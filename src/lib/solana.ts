import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, setProvider } from '@coral-xyz/anchor';

// Solana DevNet connection
export const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed'
);

// Program ID from deployed contract
export const PROGRAM_ID = new PublicKey('GcwrHG7nXB2Tz9P2GcwYfvgTvMdN3vkVWBhMzvEsZfhk');

// Important PDA seeds - must match smart contract
export const MINT_STATE_SEED = 'mint_state';
export const VAULT_SEED = 'vault';
export const PROPOSAL_SEED = 'proposal';
export const DEPOSIT_SEED = 'deposit';

// Program IDL type (we'll update this after reading the IDL file)
export interface CitizenHubProgram extends Idl {
  // This will be populated with the actual IDL
}

// Helper function to get PDA addresses
export const getPDAAddress = async (
  seeds: (string | PublicKey | Buffer)[],
  programId: PublicKey = PROGRAM_ID
): Promise<[PublicKey, number]> => {
  const seedsBuffer = seeds.map(seed => {
    if (typeof seed === 'string') {
      return Buffer.from(seed, 'utf8');
    }
    if (seed instanceof PublicKey) {
      return seed.toBuffer();
    }
    return seed;
  });
  
  return await PublicKey.findProgramAddressSync(seedsBuffer, programId);
};

// Get mint state PDA
export const getMintStatePDA = async (): Promise<[PublicKey, number]> => {
  return getPDAAddress([MINT_STATE_SEED]);
};

// Get proposal PDA
export const getProposalPDA = async (proposalSeed: PublicKey): Promise<[PublicKey, number]> => {
  return getPDAAddress([PROPOSAL_SEED, proposalSeed]);
};

// Get deposit PDA
export const getDepositPDA = async (
  user: PublicKey, 
  proposal: PublicKey
): Promise<[PublicKey, number]> => {
  return getPDAAddress([DEPOSIT_SEED, user, proposal]);
};

// Create Anchor provider
export const createProvider = (wallet: any) => {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  
  setProvider(provider);
  return provider;
};

// Token amount conversion helpers
export const PROS_DECIMALS = 6;
export const lamportsToTokens = (lamports: number): number => {
  return lamports / Math.pow(10, PROS_DECIMALS);
};

export const tokensToLamports = (tokens: number): number => {
  return Math.floor(tokens * Math.pow(10, PROS_DECIMALS));
};