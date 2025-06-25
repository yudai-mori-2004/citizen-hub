"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { WalletIcon } from 'lucide-react';

interface WalletButtonProps {
  className?: string;
}

export default function WalletButton({ className }: WalletButtonProps) {
  const { publicKey, connected, connecting, connect, disconnect } = useWallet();

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatPublicKey = (key: string) => {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={connecting}
      className={className}
      variant={connected ? "secondary" : "default"}
    >
      <WalletIcon size={16} className="mr-2" />
      {connecting 
        ? 'Connecting...' 
        : connected && publicKey
        ? formatPublicKey(publicKey.toString())
        : 'Connect Wallet'
      }
    </Button>
  );
}