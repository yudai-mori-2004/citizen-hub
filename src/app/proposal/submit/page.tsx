"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { FileText, Coins, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PROSBalance from "@/components/PROSBalance";
import { useWallet } from "@/hooks/useWallet";
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { connection, PROGRAM_ID, createProvider } from "@/lib/solana";
import idl from "@/lib/idl.json";

export default function SubmitProposal() {
  const { data: session, status } = useSession();
  const { wallet, publicKey, connected } = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const collateralAmount = 100; // Fixed at 100 PROS
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet || !publicKey || !connected) {
      alert("Please connect your Phantom wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Execute on-chain transactions (proposal registration + staking)
      const proposalSeedKeypair = Keypair.generate();
      const proposalSeedPubkey = proposalSeedKeypair.publicKey;

      // Create data hash for proposal content
      const proposalContent = JSON.stringify({ title, description });
      const encoder = new TextEncoder();
      const contentData = encoder.encode(proposalContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', contentData);
      const dataHash = Array.from(new Uint8Array(hashBuffer));

      const provider = createProvider(wallet);
      const program = new Program(idl as any, provider);

      // Calculate proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalSeedPubkey.toBuffer()],
        PROGRAM_ID
      );

      // Calculate deposit PDA for staking
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

      // Get proposer's token account
      const proposerTokenAccount = await getAssociatedTokenAddress(
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

      // Add proposal registration instruction
      const registerInstruction = await program.methods
        .registerProposal(dataHash)
        .accounts({
          proposal: proposalPDA,
          proposalSeed: proposalSeedPubkey,
          proposer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      transaction.add(registerInstruction);

      // Add staking instruction
      const { BN } = await import('@coral-xyz/anchor');
      const stakeInstruction = await program.methods
        .stakeForProposal(new BN(collateralAmount * 1_000_000)) // Convert to smallest units
        .accounts({
          depositor: publicKey,
          proposal: proposalPDA,
          deposit: depositPDA,
          depositorTokenAccount: proposerTokenAccount,
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

      // Sign transaction with both wallet and proposal seed
      const signedTransaction = await wallet.signTransaction(transaction);
      signedTransaction.partialSign(proposalSeedKeypair);

      // Send transaction
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txSignature, 'confirmed');

      // Verify proposal account was created on-chain
      try {
        const proposalAccount = await connection.getAccountInfo(proposalPDA);
        if (!proposalAccount) {
          throw new Error('Proposal account was not created on-chain despite successful transaction');
        }
        console.log('✓ Proposal account successfully created on-chain:', proposalPDA.toString());
      } catch (error) {
        console.error('Failed to verify proposal account creation:', error);
        throw new Error(`Proposal registration failed: ${error.message}`);
      }

      // Step 2: Store proposal in database with on-chain reference
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          wallet_address: publicKey.toString(),
          proposal_seed_pubkey: proposalSeedPubkey.toString(),
          on_chain_transaction_signature: txSignature,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Proposal submitted successfully!\nTransaction: ${txSignature}`);
        router.push("/dashboard");
      } else {
        alert(`Error storing proposal: ${data.error}${data.details ? '\n\n' + data.details : ''}`);
      }
    } catch (error: any) {
      console.error('Proposal submission error:', error);
      alert(`Failed to submit proposal: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading..." fullScreen />
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-tropical-teal mb-4">Login Required</CardTitle>
              <CardDescription>
                You need to be logged in to submit a proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signin">
                  <Button className="w-full sm:w-auto gradient-tropical hover:gradient-sunset text-white transition-all duration-300 rounded-xl flex items-center gap-2">
                    <LogIn size={16} />
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
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
                  Connect your Phantom wallet to see PROS balance
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-tropical-teal/20 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-tropical-teal/5 to-tropical-orange/5">
              <CardTitle className="text-3xl font-bold text-tropical-teal flex items-center justify-center gap-3">
                <FileText size={32} />
                Submit New Proposal
              </CardTitle>
              <p className="text-tropical-teal/70 mt-2">Share your vision for community improvement</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title Section */}
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FileText size={20} />
                    Proposal Title
                  </h3>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-teal focus:border-tropical-teal transition-all"
                    placeholder="e.g., Install new playground equipment in Central Park"
                    required
                    maxLength={100}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-600">Make it clear and engaging</span>
                    <span className="text-gray-600">{title.length}/100</span>
                  </div>
                </div>

                {/* Description Section */}
                <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100">
                  <h3 className="text-xl font-semibold mb-4 text-green-800 flex items-center gap-2">
                    <FileText size={20} />
                    Detailed Description
                  </h3>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 resize-none"
                    placeholder="Explain your proposal in detail. What problem does it solve? How will it benefit the community? What are the implementation steps?"
                    required
                    maxLength={1000}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-600">Provide comprehensive details to help voters understand</span>
                    <span className="text-green-600">{description.length}/1000</span>
                  </div>
                </div>

                {/* Collateral Section */}
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                    <Coins size={20} />
                    Required Collateral
                  </h3>
                  <div className="text-center p-6 bg-white rounded-xl border-2 border-blue-200">
                    <div className="text-4xl font-bold text-blue-800 mb-2">100 PROS</div>
                    <div className="text-blue-600 font-medium">Fixed collateral amount</div>
                    <div className="text-sm text-blue-500 mt-2">
                      This ensures all proposals have equal weight in the system
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <div className="text-sm text-blue-700 text-center">
                      <div className="font-medium">✓ Returned if proposal is approved</div>
                      <div className="font-medium">✗ Forfeited if proposal is rejected</div>
                    </div>
                  </div>
                </div>

                {/* Voting Schedule Info */}
                <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-800">
                    <FileText size={20} />
                    Fixed Voting Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-white rounded-xl border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">Tomorrow</div>
                      <div className="text-sm text-purple-600 font-medium">Voting Starts</div>
                      <div className="text-xs text-purple-500">Automatically at 0:00 UTC</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">7 Days</div>
                      <div className="text-sm text-purple-600 font-medium">Fixed Duration</div>
                      <div className="text-xs text-purple-500">Exactly one week</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">Majority</div>
                      <div className="text-sm text-purple-600 font-medium">Simple Voting</div>
                      <div className="text-xs text-purple-500">Support vs Oppose</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg text-center">
                    <div className="text-sm text-purple-700 font-medium">
                      All proposals follow the same standardized timeline for fairness
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="px-12 py-4 text-xl font-bold rounded-2xl gradient-tropical hover:gradient-sunset text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !title.trim() || !description.trim() || !connected}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting Proposal...
                      </div>
                    ) : !connected ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={20} />
                        Connect Phantom Wallet
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FileText size={24} />
                        Submit Proposal & Lock 100 PROS
                      </div>
                    )}
                  </Button>
                  
                  {connected && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-start gap-2 text-sm text-yellow-800">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Proposal submission locks 100 PROS tokens</div>
                          <div>If approved, collateral is returned. If rejected, collateral is forfeited to voters.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
