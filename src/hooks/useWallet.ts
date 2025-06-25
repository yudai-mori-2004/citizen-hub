import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';

interface PhantomWallet {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
}

declare global {
  interface Window {
    solana?: PhantomWallet;
  }
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<PhantomWallet | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Phantom wallet detection
    const getProvider = () => {
      if ('solana' in window) {
        const provider = window.solana;
        if (provider?.isPhantom) {
          setWallet(provider);
          if (provider.isConnected && provider.publicKey) {
            setPublicKey(provider.publicKey);
            setConnected(true);
          }
        }
      }
    };

    getProvider();

    // Listen for account changes
    if (wallet && typeof wallet.on === 'function') {
      const handleConnect = (publicKey: PublicKey) => {
        setPublicKey(publicKey);
        setConnected(true);
      };

      const handleDisconnect = () => {
        setPublicKey(null);
        setConnected(false);
      };

      const handleAccountChanged = (publicKey: PublicKey | null) => {
        if (publicKey) {
          setPublicKey(publicKey);
          setConnected(true);
        } else {
          setPublicKey(null);
          setConnected(false);
        }
      };

      wallet.on('connect', handleConnect);
      wallet.on('disconnect', handleDisconnect);
      wallet.on('accountChanged', handleAccountChanged);

      // Cleanup function
      return () => {
        wallet.off?.('connect', handleConnect);
        wallet.off?.('disconnect', handleDisconnect);
        wallet.off?.('accountChanged', handleAccountChanged);
      };
    }
  }, [wallet]);

  const connect = async () => {
    if (!wallet) {
      alert('Phantom wallet not found! Please install Phantom extension.');
      return;
    }

    try {
      setConnecting(true);
      const response = await wallet.connect();
      setPublicKey(response.publicKey);
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (wallet) {
      try {
        await wallet.disconnect();
        setPublicKey(null);
        setConnected(false);
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    }
  };

  return {
    wallet,
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
  };
};