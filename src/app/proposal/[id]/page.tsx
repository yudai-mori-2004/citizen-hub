"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Vote, CheckCircle, Coins, AlertCircle, MessageSquare, BarChart3 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PROSBalance from "@/components/PROSBalance";
import { useWallet } from "@/hooks/useWallet";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { connection, PROGRAM_ID, createProvider } from "@/lib/solana";
import idl from "@/lib/idl.json";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  stake_amount: number;
  status: string;
  voting_end_date: string;
  created_at: string;
  vote_count: number;
  support_rate: number;
  support_count?: number;
  oppose_count?: number;
  neutral_count?: number;
  final_result?: string;
  on_chain_proposal_seed?: string;
  on_chain_tx_signature?: string;
  proposer_wallet_address?: string;
}

interface VoteComment {
  id: string;
  support_level: number;
  comment: string;
  created_at: string;
  collateral_amount: number;
  voter_name: string;
}

interface HistogramData {
  bin_center: number;
  range_label: string;
  count: number;
}

export default function ProposalVoting() {
  const params = useParams();
  const proposalId = params.id as string;
  const { wallet, publicKey, connected } = useWallet();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [supportLevel, setSupportLevel] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(20);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteComments, setVoteComments] = useState<VoteComment[]>([]);
  const [histogram, setHistogram] = useState<HistogramData[]>([]);
  const [showingResults, setShowingResults] = useState(false);

  const fetchProposal = useCallback(async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data);
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
    }
  }, [proposalId]);


  const fetchVotingResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/votes`);
      if (response.ok) {
        const data = await response.json();
        setVoteComments(data.votes);
        setHistogram(data.histogram);
      }
    } catch (error) {
      console.error("Error fetching voting results:", error);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  useEffect(() => {
    if (proposal && proposal.status === "Finalized") {
      fetchVotingResults();
    }
  }, [proposal, fetchVotingResults]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposal) {
      alert("Proposal data not loaded");
      return;
    }

    setIsVoting(true);

    try {
      // Check if this is a legacy proposal (without on-chain data) or new proposal
      const isLegacyProposal = !proposal.on_chain_proposal_seed;
      
      if (isLegacyProposal) {
        console.log('Processing legacy proposal (off-chain only):', proposal.id);
        // For legacy proposals, skip on-chain transaction and go directly to database
        await handleLegacyVote();
        return;
      }

      console.log('Processing on-chain proposal:', proposal.id);
      await handleOnChainVote();
    } catch (error: any) {
      console.error('Voting error:', error);
      alert(`Failed to submit vote: ${error.message || 'Unknown error'}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle voting for legacy proposals (database only)
  const handleLegacyVote = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          support_level: supportLevel,
          comment: comment.trim() || null,
          collateral_amount: collateralAmount,
          wallet_address: connected ? publicKey?.toString() : null,
          on_chain_transaction_signature: null, // No on-chain transaction for legacy
          legacy_vote: true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setHasVoted(true);
        alert('Vote submitted successfully!');
        fetchProposal(); // Refresh proposal data
      } else {
        alert(`Voting failed: ${data.error}${data.details ? '\n\n' + data.details : ''}`);
      }
    } catch (error: any) {
      console.error('Legacy voting error:', error);
      throw error;
    }
  };

  // Handle voting for on-chain proposals
  const handleOnChainVote = async () => {
    if (!wallet || !publicKey || !connected) {
      throw new Error("Please connect your Phantom wallet first");
    }

    // Step 1: Execute on-chain staking transaction
    const provider = createProvider(wallet);
    const program = new Program(idl as any, provider);

    // Calculate proposal PDA from the stored proposal seed
    const proposalSeedPubkey = new PublicKey(proposal.on_chain_proposal_seed!);
    const [proposalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), proposalSeedPubkey.toBuffer()],
      PROGRAM_ID
    );

    // Calculate deposit PDA for voting
    const [depositPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("deposit"), publicKey.toBuffer(), proposalPDA.toBuffer()],
      PROGRAM_ID
    );

    // Get mint state PDA and fetch the actual mint
    const [mintStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_state_v2")],
      PROGRAM_ID
    );

    // Fetch mint state account to get the actual mint address
    let actualMint: PublicKey;
    try {
      const mintStateAccount = await program.account.mintState.fetch(mintStatePDA);
      // For now, let's use the known mint address but check if mintState exists
      actualMint = new PublicKey('7w4KenXsTxNZAVt2z6NszouoYTfuvAGyP7y8FqA3M96i');
    } catch (error) {
      console.error('Error fetching mint state:', error);
      throw new Error('System not properly initialized. Please contact administrator.');
    }

    // Get voter's token account
    const voterTokenAccount = await getAssociatedTokenAddress(
      actualMint,
      publicKey,
      false
    );

    // Get vault token account (mint authority's ATA)
    const vaultTokenAccount = await getAssociatedTokenAddress(
      actualMint,
      mintStatePDA,
      true
    );

    const transaction = new Transaction();

    // Check if proposal account exists on-chain first
    try {
      const proposalAccount = await connection.getAccountInfo(proposalPDA);
      if (!proposalAccount) {
        console.error('Proposal account not found. Debug info:', {
          proposalId,
          proposalSeedFromDB: proposal?.on_chain_proposal_seed,
          derivedProposalPDA: proposalPDA.toString(),
          derivedFromSeed: proposalSeedPubkey.toString()
        });
        throw new Error("Proposal account not found on-chain. The proposal may not have been properly registered.");
      }
      console.log('✓ Proposal account found on-chain:', proposalPDA.toString());
    } catch (error) {
      throw new Error(`Unable to verify proposal account: ${error.message}`);
    }

    // Check if voter's token account exists and has enough balance
    try {
      const voterTokenInfo = await connection.getAccountInfo(voterTokenAccount);
      if (!voterTokenInfo) {
        throw new Error("Your PROS token account doesn't exist. Please get some PROS tokens first.");
      }
    } catch (error) {
      throw new Error(`Unable to verify your token account: ${error.message}`);
    }

    // Check if vault token account exists
    try {
      const vaultTokenInfo = await connection.getAccountInfo(vaultTokenAccount);
      if (!vaultTokenInfo) {
        throw new Error("Vault token account not found. The system may not be properly initialized.");
      }
    } catch (error) {
      throw new Error(`Unable to verify vault account: ${error.message}`);
    }

    // Add staking instruction for vote
    const { BN } = await import('@coral-xyz/anchor');
    const stakeInstruction = await program.methods
      .stakeForVote(new BN(collateralAmount * 1_000_000)) // Convert to smallest units
      .accounts({
        voter: publicKey,
        proposal: proposalPDA,
        deposit: depositPDA,
        depositorTokenAccount: voterTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        mint: actualMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    transaction.add(stakeInstruction);

    // Set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(txSignature, 'confirmed');

    // Step 2: Store vote in database with on-chain reference
    const response = await fetch(`/api/proposals/${proposalId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        support_level: supportLevel,
        comment: comment.trim() || null,
        collateral_amount: collateralAmount,
        wallet_address: publicKey.toString(),
        on_chain_transaction_signature: txSignature,
        legacy_vote: false
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setHasVoted(true);
      alert(`Vote submitted successfully!\nTransaction: ${txSignature}`);
      fetchProposal(); // Refresh proposal data
    } else {
      alert(`Voting failed: ${data.error}${data.details ? '\n\n' + data.details : ''}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Finalized": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get support level description
  const getSupportLevelDescription = (level: number) => {
    if (level > 50) return "Support";
    if (level < -50) return "Strong Oppose";
    if (level > 0) return "Mild Support";
    if (level < 0) return "Mild Oppose";
    return "Neutral";
  };

  // Helper function to get support level color
  const getSupportLevelColor = (level: number) => {
    if (level > 50) return "text-green-600 font-bold";
    if (level < -50) return "text-red-600 font-bold";
    if (level > 0) return "text-green-500";
    if (level < 0) return "text-red-500";
    return "text-gray-500";
  };

  if (!proposal) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading proposal details..." fullScreen />
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* PROS Balance Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800">
                  <Coins size={20} />
                  <span className="font-medium">Your PROS Balance:</span>
                </div>
                <PROSBalance className="text-lg font-semibold" showIcon={false} />
              </div>
              {!connected && (
                <div className="flex items-center gap-1 text-orange-600 text-sm mt-2">
                  <AlertCircle size={16} />
                  Connect your Phantom wallet to see PROS balance and vote
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{proposal.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <span>Voting ends: {formatDate(proposal.voting_end_date)}</span>
                    <span>Votes: {proposal.vote_count}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{proposal.description}</p>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Proposer:</span> {proposal.proposer}
                  </div>
                  <div>
                    <span className="font-medium">Collateral:</span> {proposal.stake_amount} PROS
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(proposal.created_at)}
                  </div>
                  {proposal.status === "Finalized" && (
                    <div>
                      <span className="font-medium">Final Support Rate:</span> {proposal.support_rate || 0}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalized Proposal Results */}
          {proposal.status === "Finalized" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} />
                    Voting Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Final Result Badge */}
                    <div className="text-center">
                      <Badge className={
                        proposal.final_result === 'approved'
                          ? 'bg-green-100 text-green-800 border border-green-300 text-lg px-6 py-2'
                          : 'bg-red-100 text-red-800 border border-red-300 text-lg px-6 py-2'
                      }>
                        {proposal.final_result === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
                      </Badge>
                    </div>

                    {/* Vote Count Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {proposal.support_count || 0}
                        </div>
                        <div className="text-sm text-gray-600">Support Votes</div>
                        <div className="text-xs text-gray-500">
                          {proposal.vote_count > 0 ? Math.round(((proposal.support_count || 0) / proposal.vote_count) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {proposal.neutral_count || 0}
                        </div>
                        <div className="text-sm text-gray-600">Neutral Votes</div>
                        <div className="text-xs text-gray-500">
                          {proposal.vote_count > 0 ? Math.round(((proposal.neutral_count || 0) / proposal.vote_count) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {proposal.oppose_count || 0}
                        </div>
                        <div className="text-sm text-gray-600">Oppose Votes</div>
                        <div className="text-xs text-gray-500">
                          {proposal.vote_count > 0 ? Math.round(((proposal.oppose_count || 0) / proposal.vote_count) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Support Level Histogram */}
                    <div>
                      <h4 className="font-medium mb-4">Support Level Distribution</h4>
                      <div className="bg-white p-4 rounded-lg border">
                        {/* Create 10 bins from -100 to 100 */}
                        {(() => {
                          // Create all 10 bins
                          const allBins = [];
                          for (let i = -100; i < 100; i += 20) {
                            const binCenter = i + 10;
                            const rangeStart = i;
                            const rangeEnd = i + 20;
                            const rangeLabel = rangeEnd === 100 ? `[${rangeStart}, ${rangeEnd}]` : `[${rangeStart}, ${rangeEnd})`;

                            // Find matching data or default to 0
                            const histogramItem = histogram.find(h => h.bin_center === binCenter);
                            const count = histogramItem ? histogramItem.count : 0;

                            allBins.push({
                              binCenter,
                              rangeLabel,
                              count,
                              rangeStart,
                              rangeEnd
                            });
                          }

                          const maxCount = Math.max(...allBins.map(b => b.count), 1);

                          return (
                            <div className="space-y-4">
                              {/* Y-axis label */}
                              <div className="flex justify-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Number of Votes</span>
                              </div>

                              {/* Chart area */}
                              <div className="relative h-64 flex items-end justify-center gap-1 bg-gray-50 rounded p-4">
                                {/* Y-axis scale */}
                                <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                                  <span>{maxCount}</span>
                                  <span>{Math.floor(maxCount * 0.75)}</span>
                                  <span>{Math.floor(maxCount * 0.5)}</span>
                                  <span>{Math.floor(maxCount * 0.25)}</span>
                                  <span>0</span>
                                </div>

                                {/* Bars */}
                                {allBins.map((bin, index) => {
                                  const height = maxCount > 0 ? (bin.count / maxCount) * 200 : 0;
                                  const isOppose = bin.binCenter < 0;
                                  const isSupport = bin.binCenter > 0;
                                  const isNeutral = bin.binCenter === 10; // [0, 20) range

                                  let barColor = '#6b7280'; // neutral gray
                                  if (isOppose) {
                                    // Red gradient for oppose (darker red for stronger oppose)
                                    const intensity = Math.abs(bin.binCenter) / 90;
                                    barColor = `rgb(${Math.floor(239 - intensity * 50)}, ${Math.floor(68 - intensity * 30)}, ${Math.floor(68 - intensity * 30)})`;
                                  } else if (isSupport) {
                                    // Green gradient for support (darker green for stronger support)
                                    const intensity = bin.binCenter / 90;
                                    barColor = `rgb(${Math.floor(34 - intensity * 10)}, ${Math.floor(197 - intensity * 50)}, ${Math.floor(94 - intensity * 30)})`;
                                  }

                                  return (
                                    <div
                                      key={index}
                                      className="flex flex-col items-center group cursor-pointer relative"
                                      style={{ width: '8%' }}
                                    >
                                      {/* Count label on hover */}
                                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                        {bin.count} votes<br />
                                        {bin.rangeLabel}
                                      </div>

                                      {/* Bar */}
                                      <div
                                        className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-80 flex items-end justify-center"
                                        style={{
                                          height: `${height}px`,
                                          backgroundColor: barColor,
                                          minHeight: bin.count > 0 ? '2px' : '0px'
                                        }}
                                      >
                                        {bin.count > 0 && height > 20 && (
                                          <span className="text-white text-xs font-medium mb-1">
                                            {bin.count}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* X-axis labels */}
                              <div className="flex justify-center gap-1 mt-2">
                                {allBins.map((bin, index) => (
                                  <div key={index} className="text-xs text-gray-600 text-center" style={{ width: '8%' }}>
                                    {bin.rangeStart}
                                  </div>
                                ))}
                                <div className="text-xs text-gray-600">100</div>
                              </div>

                              {/* X-axis label */}
                              <div className="flex justify-center mt-2">
                                <span className="text-sm font-medium text-gray-600">Support Level</span>
                              </div>

                              {/* Legend */}
                              <div className="flex justify-center gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                                  <span>Oppose</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                                  <span>Neutral</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                                  <span>Support</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vote Comments */}
              {voteComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare size={20} />
                      Voter Comments ({voteComments.filter(c => c.comment && c.comment.trim()).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {voteComments
                        .filter(comment => comment.comment && comment.comment.trim())
                        .map((comment) => (
                          <div key={comment.id} className="border-l-4 pl-4 py-2"
                            style={{
                              borderLeftColor: comment.support_level > 0 ? '#10b981' :
                                comment.support_level < 0 ? '#ef4444' : '#6b7280'
                            }}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.voter_name}</span>
                                <Badge variant="outline" className={`text-xs ${comment.support_level > 0 ? 'text-green-600 border-green-200' :
                                    comment.support_level < 0 ? 'text-red-600 border-red-200' :
                                      'text-gray-600 border-gray-200'
                                  }`}>
                                  {comment.support_level > 0 ? `+${comment.support_level}` : comment.support_level}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Coins size={12} />
                                {comment.collateral_amount} PROS
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              "{comment.comment}"
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(comment.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        ))}
                      {voteComments.filter(c => c.comment && c.comment.trim()).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No comments were provided by voters.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {proposal.status === "Active" && !hasVoted && (
            <Card className="border-2 border-tropical-teal/20 shadow-lg">
              <CardHeader className="text-center bg-gradient-to-r from-tropical-teal/5 to-tropical-orange/5">
                <CardTitle className="text-3xl font-bold text-tropical-teal flex items-center justify-center gap-3">
                  <Vote size={32} />
                  Cast Your Vote
                </CardTitle>
                <p className="text-tropical-teal/70 mt-2">Your voice matters in this democratic decision</p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleVote} className="space-y-8">
                  {/* Support Level Selection - Visual */}
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                    <h3 className="text-xl font-semibold text-center mb-6 text-gray-800">
                      How do you feel about this proposal?
                    </h3>

                    {/* Visual Vote Display */}
                    <div className="text-center mb-8 p-6 rounded-2xl" style={{
                      background: supportLevel > 0 ?
                        `linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)` :
                        supportLevel < 0 ?
                          `linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)` :
                          `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`
                    }}>
                      <div className={`text-6xl font-black mb-4 ${getSupportLevelColor(supportLevel)}`}>
                        {supportLevel > 0 ? "SUPPORT" : supportLevel < 0 ? "OPPOSE" : "NEUTRAL"}
                      </div>
                      <div className={`text-4xl font-bold mb-2 ${getSupportLevelColor(supportLevel)}`}>
                        {supportLevel > 0 ? `+${supportLevel}` : supportLevel}%
                      </div>
                      <div className={`text-lg font-medium ${getSupportLevelColor(supportLevel)}`}>
                        {getSupportLevelDescription(supportLevel)}
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="relative">
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={supportLevel}
                        onChange={(e) => setSupportLevel(Number(e.target.value))}
                        className="w-full h-4 bg-gradient-to-r from-red-400 via-gray-300 to-green-400 rounded-full appearance-none cursor-pointer slider-thumb"
                        style={{
                          background: `linear-gradient(to right, 
                            #f87171 0%, 
                            #fb923c 25%, 
                            #94a3b8 45%, 
                            #94a3b8 55%, 
                            #4ade80 75%, 
                            #22c55e 100%)`
                        }}
                      />
                      <div className="flex justify-between text-sm font-medium mt-3 px-2">
                        <span className="text-red-600 font-bold">-100% OPPOSE</span>
                        <span className="text-gray-500">0% NEUTRAL</span>
                        <span className="text-green-600 font-bold">+100% SUPPORT</span>
                      </div>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportLevel(-100)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Strong Oppose
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportLevel(-50)}
                        className="border-red-200 text-red-500 hover:bg-red-25"
                      >
                        Oppose
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportLevel(0)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Neutral
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportLevel(50)}
                        className="border-green-200 text-green-500 hover:bg-green-25"
                      >
                        Support
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportLevel(100)}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        Strong Support
                      </Button>
                    </div>
                  </div>

                  {/* Collateral Section */}
                  <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                      <Coins size={20} />
                      Stake Your PROS Tokens
                    </h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="20"
                        max="5000"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(Number(e.target.value))}
                        className="flex-1 px-4 py-3 text-xl font-bold border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                      <span className="text-xl font-bold text-blue-800">PROS</span>
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                      <span className="text-blue-600">Minimum: 20 PROS</span>
                      <span className="text-blue-600">Higher stake = Higher rewards</span>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCollateralAmount(20)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        20
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCollateralAmount(50)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        50
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCollateralAmount(100)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        100
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCollateralAmount(200)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        200
                      </Button>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-800">
                      <MessageSquare size={20} />
                      Share Your Thoughts (Optional)
                    </h3>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                      placeholder="Why do you feel this way about the proposal? Your comment helps others understand different perspectives..."
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-purple-600">Help others understand your perspective</span>
                      <span className="text-purple-600">{comment.length}/500</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="text-center">
                    <Button
                      type="submit"
                      size="lg"
                      className="px-12 py-4 text-xl font-bold rounded-2xl gradient-tropical hover:gradient-sunset text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isVoting || !connected}
                    >
                      {isVoting ? (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Submitting Vote...
                        </div>
                      ) : !connected ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={20} />
                          Connect Phantom Wallet
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Vote size={24} />
                          Cast Vote & Lock {collateralAmount} PROS
                        </div>
                      )}
                    </Button>

                    {connected && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-start gap-2 text-sm text-yellow-800">
                          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Voting locks your PROS tokens until voting ends</div>
                            <div>Winners share losers' collateral. You can change your vote anytime during voting.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {hasVoted && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Your vote has been submitted and collateral locked\! Check back after voting ends for results.
                </div>
              </CardContent>
            </Card>
          )}

          {proposal.status !== "Active" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  This proposal is not currently accepting votes (Status: {proposal.status})
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
