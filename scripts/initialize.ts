import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createMint, getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

// Configuration
const NETWORK = 'devnet';
const RPC_URL = clusterApiUrl(NETWORK);

async function initializeProgram() {
  console.log('🚀 Starting CitizenHub program initialization...');
  
  try {
    // 1. Setup connection
    const connection = new Connection(RPC_URL, 'confirmed');
    console.log(`📡 Connected to ${NETWORK}: ${RPC_URL}`);

    // 2. Load wallet keypair
    const walletPath = path.join(process.cwd(), 'secret', 'wallet-keypair.json');
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet keypair not found at: ${walletPath}`);
    }
    
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
    );
    console.log(`💼 Loaded wallet: ${walletKeypair.publicKey.toString()}`);

    // 3. Check wallet balance
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.1 * 1e9) {
      throw new Error('Insufficient SOL balance. Need at least 0.1 SOL for initialization.');
    }

    // 4. Create PROS token mint
    console.log('🪙 Creating PROS token mint...');
    
    // Create mint authority PDA (this should match the smart contract)
    const mintStateSeed = Buffer.from('mint_state', 'utf8');
    const programId = new PublicKey('AoYPoczgNoBExJHAjxSqD6BFPe2kFMVcvuWz2gWoCfGQ');
    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [mintStateSeed],
      programId
    );
    console.log(`🔑 Mint authority PDA: ${mintAuthority.toString()}`);

    // Create the actual mint account
    const mint = await createMint(
      connection,
      walletKeypair,        // Payer
      mintAuthority,        // Mint authority (PDA)
      null,                 // Freeze authority (none)
      6                     // Decimals
    );
    console.log(`✅ PROS token mint created: ${mint.toString()}`);

    // 5. Create vault token account (for holding collateral)
    console.log('🏦 Creating vault token account...');
    const vaultTokenAccount = await getAssociatedTokenAddress(
      mint,
      mintAuthority,
      true // allowOwnerOffCurve
    );
    
    try {
      await createAssociatedTokenAccount(
        connection,
        walletKeypair,
        mint,
        mintAuthority
      );
      console.log(`✅ Vault token account created: ${vaultTokenAccount.toString()}`);
    } catch (error: any) {
      if (error.message?.includes('already in use')) {
        console.log(`ℹ️  Vault token account already exists: ${vaultTokenAccount.toString()}`);
      } else {
        throw error;
      }
    }

    // 6. Save configuration
    const config = {
      network: NETWORK,
      rpcUrl: RPC_URL,
      programId: programId.toString(),
      mintAddress: mint.toString(),
      mintAuthority: mintAuthority.toString(),
      vaultTokenAccount: vaultTokenAccount.toString(),
      walletAddress: walletKeypair.publicKey.toString(),
      timestamp: new Date().toISOString(),
    };

    const configPath = path.join(process.cwd(), 'config', 'program-config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📄 Configuration saved to: ${configPath}`);

    // 7. Summary
    console.log('\n🎉 Program initialization completed successfully!');
    console.log('📋 Summary:');
    console.log(`   Network: ${NETWORK}`);
    console.log(`   Program ID: ${programId.toString()}`);
    console.log(`   PROS Mint: ${mint.toString()}`);
    console.log(`   Mint Authority: ${mintAuthority.toString()}`);
    console.log(`   Vault Account: ${vaultTokenAccount.toString()}`);
    console.log(`   Wallet: ${walletKeypair.publicKey.toString()}`);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Call initialize_mint() from the smart contract');
    console.log('2. Mint initial PROS tokens for testing');
    console.log('3. Test proposal creation and voting');

    return config;

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeProgram();
}

export default initializeProgram;