import { Connection, Keypair, PublicKey, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';
import idl from '../src/lib/idl.json';

// Configuration
const NETWORK = 'devnet';
const RPC_URL = clusterApiUrl(NETWORK);
const PROGRAM_ID = new PublicKey('AoYPoczgNoBExJHAjxSqD6BFPe2kFMVcvuWz2gWoCfGQ');

async function initializeSmartContract() {
  console.log('🚀 Starting smart contract initialization...');
  
  try {
    // 1. Setup connection and provider
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

    // 4. Create provider and program
    const wallet = new Wallet(walletKeypair);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program(idl as Idl, provider);
    console.log(`📋 Program loaded: ${PROGRAM_ID.toString()}`);

    // 5. Load program configuration
    const configPath = path.join(process.cwd(), 'config', 'program-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Program configuration not found. Run initialization script first.');
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const mintAddress = new PublicKey(config.mintAddress);
    const vaultTokenAccount = new PublicKey(config.vaultTokenAccount);
    console.log(`🪙 Using PROS mint: ${mintAddress.toString()}`);

    // 6. Calculate PDAs
    const [mintState] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint_state', 'utf8')],
      PROGRAM_ID
    );
    console.log(`🔑 Mint state PDA: ${mintState.toString()}`);

    // 7. Check if already initialized
    try {
      const mintStateAccount = await (program.account as any).mintState.fetch(mintState);
      console.log('ℹ️  Smart contract already initialized!');
      console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
      console.log(`   Bump: ${mintStateAccount.bump}`);
      return {
        ...config,
        mintState: mintState.toString(),
        alreadyInitialized: true
      };
    } catch (error) {
      console.log('📝 Smart contract not yet initialized, proceeding...');
    }

    // 8. Initialize the smart contract
    console.log('🔧 Calling initialize_mint...');
    
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mintState: mintState,
        mint: mintAddress,
        vaultTokenAccount: vaultTokenAccount,
        admin: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([])  // No additional signers needed, mint is already created
      .rpc();

    console.log(`✅ Initialize mint transaction: ${tx}`);

    // 9. Verify initialization
    console.log('🔍 Verifying initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation
    
    const mintStateAccount = await (program.account as any).mintState.fetch(mintState);
    console.log(`✅ Mint state initialized successfully!`);
    console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
    console.log(`   Bump: ${mintStateAccount.bump}`);

    // 10. Update configuration
    const updatedConfig = {
      ...config,
      mintState: mintState.toString(),
      initializationTransaction: tx,
      initializedAt: new Date().toISOString(),
      mintStateAuthority: mintStateAccount.authority.toString(),
      mintStateBump: mintStateAccount.bump,
    };

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    console.log(`📄 Configuration updated: ${configPath}`);

    // 11. Summary
    console.log('\n🎉 Smart contract initialization completed successfully!');
    console.log('📋 Summary:');
    console.log(`   Transaction: ${tx}`);
    console.log(`   Mint State: ${mintState.toString()}`);
    console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
    console.log(`   PROS Mint: ${mintAddress.toString()}`);
    console.log(`   Vault Account: ${vaultTokenAccount.toString()}`);
    
    console.log('\n🚀 Ready for:');
    console.log('1. Minting PROS tokens');
    console.log('2. Creating proposals');
    console.log('3. Testing voting functionality');

    return updatedConfig;

  } catch (error) {
    console.error('❌ Smart contract initialization failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeSmartContract();
}

export default initializeSmartContract;