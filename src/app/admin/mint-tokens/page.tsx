"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { connection, createProvider, getMintStatePDA } from '@/lib/solana';
import { getMintStateAccount } from '@/lib/program';
import idl from '@/lib/idl.json';
import { Coins, Send, Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';
import PROSBalance from '@/components/PROSBalance';

// PROS token mint from initialization
const PROS_MINT = new PublicKey('7w4KenXsTxNZAVt2z6NszouoYTfuvAGyP7y8FqA3M96i');

interface MintOperation {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  recipient: string;
  amount: number;
  result?: string;
  error?: string;
}

export default function MintTokensPage() {
  const { wallet, publicKey, connected } = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [mintAmount, setMintAmount] = useState(1000);
  const [operations, setOperations] = useState<MintOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitialization();
  }, [wallet]);

  const checkInitialization = async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    try {
      const mintState = await getMintStateAccount(wallet);
      setIsInitialized(!!mintState);
    } catch (error) {
      console.error('Error checking initialization:', error);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const addOperation = (recipient: string, amount: number): string => {
    const id = Date.now().toString();
    const newOp: MintOperation = {
      id,
      status: 'pending',
      recipient,
      amount
    };
    setOperations(prev => [newOp, ...prev]);
    return id;
  };

  const updateOperation = (id: string, updates: Partial<MintOperation>) => {
    setOperations(prev => prev.map(op =>
      op.id === id ? { ...op, ...updates } : op
    ));
  };

  const mintTokensToUser = async () => {
    if (!wallet || !publicKey || !connected) {
      alert('Please connect your Phantom wallet first');
      return;
    }

    if (!recipientAddress.trim()) {
      alert('Please enter a recipient wallet address');
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientAddress.trim());
    } catch (error) {
      alert('Invalid wallet address format');
      return;
    }

    const operationId = addOperation(recipientAddress, mintAmount);
    updateOperation(operationId, { status: 'running' });

    try {
      // Get mint state PDA
      const [mintStatePDA] = await getMintStatePDA();

      // Get recipient's associated token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        PROS_MINT,
        recipientPubkey,
        false
      );

      // Check if recipient's token account exists
      const accountInfo = await connection.getAccountInfo(recipientTokenAccount);

      const provider = createProvider(wallet);
      const program = new Program(idl as any, provider);

      const transaction = new Transaction();

      // Create recipient's token account if it doesn't exist
      if (!accountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          recipientTokenAccount, // associated token account
          recipientPubkey, // owner
          PROS_MINT // mint
        );
        transaction.add(createATAInstruction);
      }

      // Create mint instruction  
      const { BN } = await import('@coral-xyz/anchor');
      const mintInstruction = await program.methods
        .mintTo(new BN(mintAmount * 1_000_000)) // Convert to 6 decimal places
        .accounts({
          mint: PROS_MINT,
          recipient: recipientTokenAccount,
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

      updateOperation(operationId, {
        status: 'completed',
        result: `${mintAmount} PROS minted successfully. TX: ${txSignature}`
      });

      // Reset form
      setRecipientAddress('');
      setMintAmount(1000);

    } catch (error: any) {
      console.error('Minting error:', error);
      updateOperation(operationId, {
        status: 'error',
        error: error.message || 'Unknown error during minting'
      });
    }
  };

  const getOperationIcon = (status: MintOperation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getOperationColor = (status: MintOperation['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Coins size={24} />
                PROS Token Minting (DevNet)
              </CardTitle>
              <p className="text-muted-foreground">
                Mint PROS tokens to any wallet address on Solana DevNet for testing purposes.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Coins size={14} />
                  PROS Mint: {PROS_MINT.toString()}
                </Badge>
                <PROSBalance className="text-sm" />
              </div>

              {!connected && (
                <div className="text-center py-8 border border-orange-200 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <p className="text-orange-700 font-medium">
                    Please connect your Phantom wallet to mint tokens
                  </p>
                </div>
              )}

              {connected && !isInitialized && (
                <div className="text-center py-8 border border-red-200 bg-red-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-700 font-medium">
                    PROS token not initialized. Please run initialization first.
                  </p>
                </div>
              )}

              {connected && isInitialized && (
                <div className="space-y-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={20} />
                        <span className="font-medium">PROS Token Ready for Minting</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Mint Tokens</h3>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Recipient Wallet Address *
                        </label>
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Enter Solana wallet address..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Amount (PROS tokens)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000000"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <Button
                        onClick={mintTokensToUser}
                        className="w-full"
                        disabled={!recipientAddress.trim() || mintAmount <= 0}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Mint {mintAmount} PROS Tokens
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users size={20} />
                        Quick Actions
                      </h3>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRecipientAddress(publicKey?.toString() || '');
                            setMintAmount(1000);
                          }}
                          className="w-full"
                        >
                          Mint 1,000 PROS to Myself
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setRecipientAddress(publicKey?.toString() || '');
                            setMintAmount(10000);
                          }}
                          className="w-full"
                        >
                          Mint 10,000 PROS to Myself
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minting Operations History */}
          {operations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Minting Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {operations.slice(0, 10).map((operation) => (
                    <div
                      key={operation.id}
                      className={`p-4 rounded-lg border-2 ${getOperationColor(operation.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getOperationIcon(operation.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">
                              Mint {operation.amount} PROS
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(parseInt(operation.id)).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            To: {operation.recipient.slice(0, 8)}...{operation.recipient.slice(-8)}
                          </p>
                          {operation.result && (
                            <p className="text-xs text-green-700 mt-2">
                              ✓ {operation.result}
                            </p>
                          )}
                          {operation.error && (
                            <p className="text-xs text-red-700 mt-2">
                              ✗ {operation.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}