import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { PROGRAM_ID, createProvider, getMintStatePDA, getProposalPDA, getDepositPDA } from './solana';
import idl from './idl.json';

// Type definitions
export interface MintState {
  authority: PublicKey;
  bump: number;
}

export interface ProposalHash {
  proposalId: PublicKey;
  dataHash: number[];
  proposer: PublicKey;
  finalized: boolean;
  bump: number;
}

export interface DepositAccount {
  user: PublicKey;
  proposal: PublicKey;
  amount: number;
  claimed: boolean;
  bump: number;
}

export enum VoteOutcome {
  Approved = 'Approved',
  Rejected = 'Rejected'
}

// Create program instance
export const createProgram = (wallet: any): Program => {
  const provider = createProvider(wallet);
  return new Program(idl as Idl, provider);
};

// Initialize the PROS token mint (admin only)
export const initializeMint = async (
  wallet: any,
  mintKeypair: Keypair
): Promise<string> => {
  try {
    const program = createProgram(wallet);
    const [mintState] = await getMintStatePDA();
    
    // Get vault token account PDA
    const vaultTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      mintState,
      true // allowOwnerOffCurve
    );

    const tx = await program.methods
      .initializeMint()
      .accounts({
        mintState: mintState,
        mint: mintKeypair.publicKey,
        vaultTokenAccount: vaultTokenAccount,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([mintKeypair])
      .rpc();

    console.log('Initialize mint transaction:', tx);
    return tx;
  } catch (error) {
    console.error('Error initializing mint:', error);
    throw error;
  }
};

// Mint PROS tokens (admin only)
export const mintTo = async (
  wallet: any,
  mint: PublicKey,
  recipient: PublicKey,
  amount: number
): Promise<string> => {
  try {
    const program = createProgram(wallet);
    const [mintState] = await getMintStatePDA();
    
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mint,
      recipient
    );

    const tx = await program.methods
      .mintTo(amount)
      .accounts({
        mint: mint,
        recipient: recipientTokenAccount,
        mintState: mintState,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log('Mint to transaction:', tx);
    return tx;
  } catch (error) {
    console.error('Error minting tokens:', error);
    throw error;
  }
};

// Register a proposal hash on-chain
export const registerProposal = async (
  wallet: any,
  dataHash: number[],
  proposalSeed: Keypair
): Promise<string> => {
  try {
    const program = createProgram(wallet);
    const [proposal] = await getProposalPDA(proposalSeed.publicKey);

    const tx = await program.methods
      .registerProposal(dataHash)
      .accounts({
        proposal: proposal,
        proposalSeed: proposalSeed.publicKey,
        proposer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([proposalSeed])
      .rpc();

    console.log('Register proposal transaction:', tx);
    return tx;
  } catch (error) {
    console.error('Error registering proposal:', error);
    throw error;
  }
};

// Stake PROS tokens for a proposal (proposer)
export const stakeForProposal = async (
  wallet: any,
  proposal: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<string> => {
  try {
    const program = createProgram(wallet);
    const [deposit] = await getDepositPDA(wallet.publicKey, proposal);
    const [mintState] = await getMintStatePDA();
    
    const depositorTokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );
    
    const vaultTokenAccount = await getAssociatedTokenAddress(
      mint,
      mintState,
      true
    );

    const tx = await program.methods
      .stakeForProposal(amount)
      .accounts({
        depositor: wallet.publicKey,
        proposal: proposal,
        deposit: deposit,
        depositorTokenAccount: depositorTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Stake for proposal transaction:', tx);
    return tx;
  } catch (error) {
    console.error('Error staking for proposal:', error);
    throw error;
  }
};

// Stake PROS tokens for voting
export const stakeForVote = async (
  wallet: any,
  proposal: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<string> => {
  try {
    const program = createProgram(wallet);
    const [deposit] = await getDepositPDA(wallet.publicKey, proposal);
    const [mintState] = await getMintStatePDA();
    
    const depositorTokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );
    
    const vaultTokenAccount = await getAssociatedTokenAddress(
      mint,
      mintState,
      true
    );

    const tx = await program.methods
      .stakeForVote(amount)
      .accounts({
        voter: wallet.publicKey,
        proposal: proposal,
        deposit: deposit,
        depositorTokenAccount: depositorTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Stake for vote transaction:', tx);
    return tx;
  } catch (error) {
    console.error('Error staking for vote:', error);
    throw error;
  }
};

// Get mint state account
export const getMintStateAccount = async (wallet: any): Promise<MintState | null> => {
  try {
    const program = createProgram(wallet);
    const [mintState] = await getMintStatePDA();
    const account = await program.account.mintState.fetch(mintState);
    return {
      authority: account.authority,
      bump: account.bump,
    };
  } catch (error: any) {
    // Account doesn't exist yet - this is expected before initialization
    if (error.message?.includes('Account does not exist') || error.message?.includes('has no data')) {
      console.log('Mint state account not initialized yet');
      return null;
    }
    console.error('Error fetching mint state:', error);
    return null;
  }
};

// Get proposal account
export const getProposalAccount = async (
  wallet: any,
  proposalPDA: PublicKey
): Promise<ProposalHash | null> => {
  try {
    const program = createProgram(wallet);
    const account = await program.account.proposalHash.fetch(proposalPDA);
    return {
      proposalId: account.proposalId,
      dataHash: account.dataHash,
      proposer: account.proposer,
      finalized: account.finalized,
      bump: account.bump,
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
};

// Get deposit account
export const getDepositAccountData = async (
  wallet: any,
  depositPDA: PublicKey
): Promise<DepositAccount | null> => {
  try {
    const program = createProgram(wallet);
    const account = await program.account.depositAccount.fetch(depositPDA);
    return {
      user: account.user,
      proposal: account.proposal,
      amount: account.amount.toNumber(),
      claimed: account.claimed,
      bump: account.bump,
    };
  } catch (error) {
    console.error('Error fetching deposit:', error);
    return null;
  }
};