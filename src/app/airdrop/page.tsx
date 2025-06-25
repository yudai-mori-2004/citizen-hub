"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { connection, createProvider, getMintStatePDA } from '@/lib/solana';
import idl from '@/lib/idl.json';
import { Gift, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import PROSBalance from '@/components/PROSBalance';

// PROS token mint from initialization
const PROS_MINT = new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3');
const AIRDROP_AMOUNT = 1000;

export default function AirdropPage() {
  const { wallet, publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const claimAirdrop = async () => {
    if (!wallet || !publicKey || !connected) {
      setMessage('Please connect your Phantom wallet first');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Get mint state PDA
      const [mintStatePDA] = await getMintStatePDA();
      
      // Get user's associated token account
      const userTokenAccount = await getAssociatedTokenAddress(
        PROS_MINT,
        publicKey,
        false
      );

      // Check if user's token account exists
      const accountInfo = await connection.getAccountInfo(userTokenAccount);
      
      const provider = createProvider(wallet);
      const program = new Program(idl as any, provider);
      
      const transaction = new Transaction();

      // Create user's token account if it doesn't exist
      if (!accountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          userTokenAccount, // associated token account
          publicKey, // owner
          PROS_MINT // mint
        );
        transaction.add(createATAInstruction);
      }

      // Create mint instruction
      const { BN } = await import('@coral-xyz/anchor');
      const mintInstruction = await program.methods
        .mintTo(new BN(AIRDROP_AMOUNT * 1_000_000)) // Convert to 6 decimal places
        .accounts({
          mint: PROS_MINT,
          recipient: userTokenAccount,
          mintState: mintStatePDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      transaction.add(mintInstruction);

      // Set recent blockhash and fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(txSignature, 'confirmed');

      setMessage(`Successfully received ${AIRDROP_AMOUNT} PROS tokens!`);
      setMessageType('success');

    } catch (error: any) {
      console.error('Airdrop error:', error);
      setMessage(error.message || 'Failed to claim airdrop');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl text-purple-800">
                <Gift size={24} />
                Free PROS Tokens
              </CardTitle>
              <p className="text-purple-600">
                Get 1,000 PROS tokens to try out CitizenHub's voting platform!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <PROSBalance className="text-xl font-bold" />
              </div>

              {!connected ? (
                <div className="text-center py-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-orange-700">
                    Connect your Phantom wallet to claim tokens
                  </p>
                </div>
              ) : (
                <Button
                  onClick={claimAirdrop}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Claim 1,000 PROS Tokens
                    </>
                  )}
                </Button>
              )}

              {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  messageType === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {messageType === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {message}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">What can you do with PROS tokens?</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Vote on proposals (minimum 20 PROS)</li>
                  <li>• Submit new proposals (minimum 100 PROS)</li>
                  <li>• Transfer tokens to other users</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}