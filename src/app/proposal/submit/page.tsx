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
  const [collateralAmount, setCollateralAmount] = useState(100);
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

      // Get proposer's token account
      const proposerTokenAccount = await getAssociatedTokenAddress(
        new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3'), // PROS mint
        publicKey,
        false
      );

      // Get vault token account (mint authority's ATA)
      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_state")],
        PROGRAM_ID
      );

      const vaultTokenAccount = await getAssociatedTokenAddress(
        new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3'), // PROS mint
        mintAuthority,
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
          mint: new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3'),
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

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Submit New Proposal</CardTitle>
              <CardDescription className="text-center">
                Share your ideas for improving our community.
                <br />
                Proposals require a minimum collateral of 100 PROS tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Install new playground equipment in the park"
                    required
                    maxLength={100}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {title.length}/100 characters
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Proposal Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Provide detailed information about your proposal..."
                    required
                    maxLength={1000}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {description.length}/1000 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Collateral Amount (PROS tokens) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Minimum: 100 PROS. Higher collateral demonstrates stronger commitment.
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Voting Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    All proposals have a 7-day voting period starting the next day at 0:00 UTC.
                  </p>
                </div>

                <div className="bg-accent/50 p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Proposal Submission & Collateral System
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Collateral is locked when you submit the proposal</li>
                    <li>• If your proposal is approved, your collateral is returned</li>
                    <li>• If your proposal is rejected, you forfeit your collateral</li>
                    <li>• Voting starts the next day at 0:00 UTC and runs for exactly 7 days</li>
                    <li>• Results are determined by majority vote (support vs oppose)</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !title.trim() || !description.trim() || !connected}
                >
                  {isSubmitting ? "Submitting..." :
                    !connected ? "Connect Phantom Wallet First" :
                      `Submit Proposal (Lock ${collateralAmount} PROS)`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
