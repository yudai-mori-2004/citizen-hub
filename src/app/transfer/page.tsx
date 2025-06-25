"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useWallet } from '@/hooks/useWallet';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection } from '@/lib/solana';
import { Send, ArrowRight, Loader2, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import PROSBalance from '@/components/PROSBalance';
import { useSession } from 'next-auth/react';

// PROS token mint from initialization
const PROS_MINT = new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3');

interface TransferOperation {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  recipient: string;
  amount: number;
  result?: string;
  error?: string;
}

export default function TransferPage() {
  const { data: session } = useSession();
  const { wallet, publicKey, connected } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState(100);
  const [operations, setOperations] = useState<TransferOperation[]>([]);

  const addOperation = (recipient: string, amount: number): string => {
    const id = Date.now().toString();
    const newOp: TransferOperation = {
      id,
      status: 'pending',
      recipient,
      amount
    };
    setOperations(prev => [newOp, ...prev]);
    return id;
  };

  const updateOperation = (id: string, updates: Partial<TransferOperation>) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));
  };

  const transferTokens = async () => {
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

    if (recipientPubkey.equals(publicKey)) {
      alert('Cannot transfer to yourself');
      return;
    }

    const operationId = addOperation(recipientAddress, transferAmount);
    updateOperation(operationId, { status: 'running' });

    try {
      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        PROS_MINT,
        publicKey,
        false
      );

      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        PROS_MINT,
        recipientPubkey,
        false
      );

      // Check if sender has tokens
      const senderAccountInfo = await connection.getAccountInfo(senderTokenAccount);
      if (!senderAccountInfo) {
        throw new Error('You do not have any PROS tokens to transfer');
      }

      // Check sender balance
      const senderBalance = await connection.getTokenAccountBalance(senderTokenAccount);
      const currentBalance = senderBalance.value.uiAmount || 0;
      
      if (currentBalance < transferAmount) {
        throw new Error(`Insufficient balance. You have ${currentBalance} PROS, but trying to send ${transferAmount} PROS`);
      }

      const transaction = new Transaction();

      // Check if recipient's token account exists, create if not
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
      if (!recipientAccountInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          recipientTokenAccount, // associated token account
          recipientPubkey, // owner
          PROS_MINT // mint
        );
        transaction.add(createATAInstruction);
      }

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAccount, // source
        recipientTokenAccount, // destination
        publicKey, // owner of source account
        transferAmount * 1_000_000, // amount in smallest units (6 decimals)
        [], // signers (none needed for basic transfer)
        TOKEN_PROGRAM_ID
      );

      transaction.add(transferInstruction);

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
        result: `${transferAmount} PROS transferred successfully. TX: ${txSignature}` 
      });

      // Reset form
      setRecipientAddress('');
      setTransferAmount(100);

    } catch (error: any) {
      console.error('Transfer error:', error);
      updateOperation(operationId, { 
        status: 'error', 
        error: error.message || 'Unknown error during transfer' 
      });
    }
  };

  const getOperationIcon = (status: TransferOperation['status']) => {
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

  const getOperationColor = (status: TransferOperation['status']) => {
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

  if (!session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-tropical-teal mb-4">Login Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Please log in to transfer PROS tokens.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Balance Display */}
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
                  Connect your Phantom wallet to transfer tokens
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Send size={24} />
                Transfer PROS Tokens
              </CardTitle>
              <p className="text-muted-foreground">
                Send PROS tokens to any wallet address on Solana DevNet.
              </p>
            </CardHeader>
            <CardContent>
              {!connected ? (
                <div className="text-center py-8 border border-orange-200 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <p className="text-orange-700 font-medium">
                    Please connect your Phantom wallet to transfer tokens
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Transfer Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Recipient Wallet Address *
                        </label>
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Enter recipient's Solana wallet address..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Amount (PROS tokens)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <Button
                        onClick={transferTokens}
                        className="w-full"
                        disabled={!recipientAddress.trim() || transferAmount <= 0}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Transfer {transferAmount} PROS
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Transfer Preview</h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">From:</span>
                          <span className="font-mono text-xs">
                            {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Not connected'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">To:</span>
                          <span className="font-mono text-xs">
                            {recipientAddress ? `${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}` : 'Enter address'}
                          </span>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Amount:</span>
                            <span className="font-bold text-lg">{transferAmount} PROS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium mb-2">Transfer Information</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PROS tokens are transferred instantly on Solana DevNet</li>
                      <li>• A small SOL fee (~0.000005 SOL) is required for the transaction</li>
                      <li>• If the recipient doesn't have a PROS token account, one will be created automatically</li>
                      <li>• All transfers are recorded on the blockchain and cannot be reversed</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer History */}
          {operations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transfer History</CardTitle>
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
                              Transfer {operation.amount} PROS
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