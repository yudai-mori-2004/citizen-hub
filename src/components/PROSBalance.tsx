"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { connection } from '@/lib/solana';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Coins, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// PROS token mint address from initialization
const PROS_MINT = new PublicKey('8H9W98YMknMs24wSV7kzJRCehkNX8672KAYjdHGLQxt3');

interface PROSBalanceProps {
  className?: string;
  showIcon?: boolean;
}

export default function PROSBalance({ className = '', showIcon = true }: PROSBalanceProps) {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchBalance = async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get user's associated token account for PROS
      const userTokenAccount = await getAssociatedTokenAddress(
        PROS_MINT,
        publicKey,
        false // allowOwnerOffCurve
      );

      // Check if account exists and get balance
      const accountInfo = await connection.getAccountInfo(userTokenAccount);
      
      if (!accountInfo) {
        // Account doesn't exist, balance is 0
        setBalance(0);
      } else {
        // Parse token account data to get balance
        const tokenAccountInfo = await connection.getTokenAccountBalance(userTokenAccount);
        const balanceAmount = tokenAccountInfo.value.uiAmount || 0;
        setBalance(balanceAmount);
      }
    } catch (err: any) {
      console.error('Error fetching PROS balance:', err);
      setError('Failed to fetch balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey, connected]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  if (!connected) {
    return null;
  }

  if (loading) {
    return (
      <Badge variant="outline" className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="destructive" className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Coins className="w-4 h-4" />}
        Error
      </Badge>
    );
  }

  const formatBalance = (bal: number | null) => {
    if (bal === null) return '--';
    return bal.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const getVariant = () => {
    if (balance === null) return 'outline';
    if (balance >= 100) return 'default';
    if (balance >= 20) return 'secondary';
    return 'destructive';
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`flex items-center gap-2 cursor-pointer hover:opacity-80 ${className}`}
      onClick={fetchBalance}
      title="Click to refresh balance"
    >
      {showIcon && <Coins className="w-4 h-4" />}
      {formatBalance(balance)} PROS
    </Badge>
  );
}

export { PROS_MINT };