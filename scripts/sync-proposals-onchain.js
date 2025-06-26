#!/usr/bin/env node

/**
 * One-time script to sync existing proposals to on-chain
 * Usage: node scripts/sync-proposals-onchain.js
 */

const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { Pool } = require('pg');

// Import IDL
const idl = require('../src/lib/idl.json');

// Configuration
const PROGRAM_ID = new PublicKey('GcwrHG7nXB2Tz9P2GcwYfvgTvMdN3vkVWBhMzvEsZfhk');
const WALLET_PATH = './secret/wallet-keypair.json';
const DATABASE_URL = "";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

// Load wallet
const loadWallet = () => {
  try {
    const walletData = JSON.parse(readFileSync(WALLET_PATH, 'utf8'));
    return Keypair.fromSecretKey(new Uint8Array(walletData));
  } catch (error) {
    console.error('❌ Failed to load wallet:', error);
    process.exit(1);
  }
};

// Generate proposal hash
const generateProposalHash = (proposal) => {
  const data = {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    created_at: proposal.created_at
  };
  
  const dataString = JSON.stringify(data, null, 0);
  return createHash('sha256').update(dataString, 'utf8').digest();
};

// Get proposal PDA
const getProposalPDA = async (proposalSeed) => {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('proposal', 'utf8'), proposalSeed.toBuffer()],
    PROGRAM_ID
  );
};

async function main() {
  console.log('🚀 Starting proposal on-chain sync...');
  
  // Initialize database connection
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  // Load wallet
  const wallet = loadWallet();
  console.log(`🔑 Loaded wallet: ${wallet.publicKey.toString()}`);
  
  // Create program instance
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
  const program = new Program(idl, provider);
  
  try {
    // 1. Fetch existing proposals that don't have on-chain data
    console.log('📋 Fetching proposals from database...');
    const result = await pool.query(`
      SELECT id, title, description, proposer_id, created_at, 
             on_chain_proposal_seed, on_chain_tx_signature
      FROM proposals 
      WHERE on_chain_proposal_seed IS NULL OR on_chain_tx_signature IS NULL
         OR on_chain_proposal_seed = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
         OR on_chain_tx_signature = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
      ORDER BY created_at ASC
    `);
    
    const proposals = result.rows;
    console.log(`📊 Found ${proposals.length} proposals to sync`);
    
    if (proposals.length === 0) {
      console.log('✅ All proposals are already synced!');
      return;
    }
    
    // 2. Process each proposal
    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      console.log(`\n🔄 Processing proposal ${i + 1}/${proposals.length}: "${proposal.title}"`);
      
      try {
        // Generate proposal seed keypair
        const proposalSeed = Keypair.generate();
        console.log(`  🎲 Generated proposal seed: ${proposalSeed.publicKey.toString()}`);
        
        // Generate proposal hash
        const proposalHash = generateProposalHash(proposal);
        const hashArray = Array.from(proposalHash);
        console.log(`  🔐 Generated hash: ${proposalHash.toString('hex')}`);
        
        // Get proposal PDA
        const [proposalPDA] = await getProposalPDA(proposalSeed.publicKey);
        console.log(`  📍 Proposal PDA: ${proposalPDA.toString()}`);
        
        // Register proposal on-chain
        console.log('  🌐 Registering on Solana...');
        const tx = await program.methods
          .registerProposal(hashArray)
          .accounts({
            proposal: proposalPDA,
            proposalSeed: proposalSeed.publicKey,
            proposer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([proposalSeed])
          .rpc();
        
        console.log(`  ✅ Transaction: ${tx}`);
        
        // Wait for confirmation
        await connection.confirmTransaction(tx, 'confirmed');
        console.log('  ✅ Transaction confirmed');
        
        // Update database
        await pool.query(`
          UPDATE proposals 
          SET on_chain_proposal_seed = $1, 
              on_chain_tx_signature = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [proposalSeed.publicKey.toString(), tx, proposal.id]);
        
        console.log('  ✅ Database updated');
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Failed to process proposal "${proposal.title}":`, error);
        // Continue with next proposal
      }
    }
    
    console.log('\n🎉 Sync completed!');
    
    // Final summary
    const finalResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(on_chain_proposal_seed) as synced
      FROM proposals
    `);
    
    const stats = finalResult.rows[0];
    console.log(`📊 Final stats: ${stats.synced}/${stats.total} proposals synced`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('📤 Database connection closed');
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});