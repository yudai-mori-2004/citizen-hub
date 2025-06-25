const { Connection, Keypair, PublicKey, clusterApiUrl, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const { TOKEN_PROGRAM_ID, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const idl = require('../src/lib/idl.json');

// Configuration
const NETWORK = 'devnet';
const RPC_URL = clusterApiUrl(NETWORK);
const PROGRAM_ID = new PublicKey('AoYPoczgNoBExJHAjxSqD6BFPe2kFMVcvuWz2gWoCfGQ');

async function completeInitialization() {
  console.log('🚀 Starting complete smart contract initialization...');
  
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

    if (balance < 0.1 * 1e9) {
      throw new Error('Insufficient balance. Need at least 0.1 SOL for initialization.');
    }

    // 4. Create provider and program
    const wallet = new Wallet(walletKeypair);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program(idl, provider);
    console.log(`📋 Program loaded: ${PROGRAM_ID.toString()}`);

    // 5. Calculate PDAs
    const [mintState] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint_state', 'utf8')],
      PROGRAM_ID
    );
    console.log(`🔑 Mint state PDA: ${mintState.toString()}`);

    // 6. Check if already initialized
    try {
      const mintStateAccount = await program.account.mintState.fetch(mintState);
      console.log('ℹ️  Smart contract already initialized!');
      console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
      console.log(`   Bump: ${mintStateAccount.bump}`);
      
      // Save existing configuration
      const existingConfig = {
        mintState: mintState.toString(),
        mintStateAuthority: mintStateAccount.authority.toString(),
        mintStateBump: mintStateAccount.bump,
        alreadyInitialized: true,
        checkedAt: new Date().toISOString()
      };
      
      const configPath = path.join(process.cwd(), 'config', 'program-config.json');
      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      
      return existingConfig;
    } catch (error) {
      console.log('📝 Smart contract not yet initialized, proceeding...');
    }

    // 7. Generate new mint keypair
    console.log('🔧 Generating new PROS token mint...');
    const mintKeypair = Keypair.generate();
    console.log(`🪙 New PROS mint: ${mintKeypair.publicKey.toString()}`);

    // 8. Get vault token account address (PDA owned)
    const vaultTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      mintState,
      true // allowOwnerOffCurve
    );
    console.log(`🏛️ Vault token account: ${vaultTokenAccount.toString()}`);

    // 9. First create the mint account and vault token account
    console.log('🔧 Creating mint account...');
    
    // Create mint account instruction
    const mintRentExemption = await connection.getMinimumBalanceForRentExemption(82);
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: walletKeypair.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: 82, // Mint account size
      lamports: mintRentExemption,
      programId: TOKEN_PROGRAM_ID,
    });

    // Initialize mint instruction
    const initializeMintIx = createInitializeMintInstruction(
      mintKeypair.publicKey,
      6, // decimals
      mintState, // mint authority (PDA)
      null // freeze authority
    );

    // Create associated token account instruction
    console.log('🏛️ Creating vault token account...');
    const createATAIx = createAssociatedTokenAccountInstruction(
      walletKeypair.publicKey, // payer
      vaultTokenAccount,       // associated token account
      mintState,               // owner (PDA)
      mintKeypair.publicKey    // mint
    );

    // Send preliminary transactions
    const { Transaction } = require('@solana/web3.js');
    
    // Transaction 1: Create and initialize mint
    const mintTx = new Transaction()
      .add(createMintAccountIx)
      .add(initializeMintIx);
    
    mintTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    mintTx.feePayer = walletKeypair.publicKey;
    mintTx.partialSign(walletKeypair, mintKeypair);
    
    const mintTxSig = await connection.sendRawTransaction(mintTx.serialize());
    await connection.confirmTransaction(mintTxSig);
    console.log(`✅ Mint created: ${mintTxSig}`);

    // Transaction 2: Create vault token account
    const vaultTx = new Transaction().add(createATAIx);
    vaultTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    vaultTx.feePayer = walletKeypair.publicKey;
    vaultTx.sign(walletKeypair);
    
    const vaultTxSig = await connection.sendRawTransaction(vaultTx.serialize());
    await connection.confirmTransaction(vaultTxSig);
    console.log(`✅ Vault account created: ${vaultTxSig}`);

    // 10. Now initialize the smart contract with mint as signer
    console.log('🔧 Calling initialize_mint with mint as signer...');
    
    const tx = await program.methods
      .initializeMint()
      .accounts({
        mintState: mintState,
        mint: mintKeypair.publicKey,
        vaultTokenAccount: vaultTokenAccount,
        admin: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([mintKeypair])  // Mint keypair must be a signer according to IDL
      .rpc();

    console.log(`✅ Initialize mint transaction: ${tx}`);

    // 10. Verify initialization
    console.log('🔍 Verifying initialization...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for confirmation
    
    const mintStateAccount = await program.account.mintState.fetch(mintState);
    console.log(`✅ Mint state initialized successfully!`);
    console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
    console.log(`   Bump: ${mintStateAccount.bump}`);

    // 11. Save configuration
    const finalConfig = {
      programId: PROGRAM_ID.toString(),
      mintAddress: mintKeypair.publicKey.toString(),
      mintAuthority: mintState.toString(),
      vaultTokenAccount: vaultTokenAccount.toString(),
      mintState: mintState.toString(),
      mintStateAuthority: mintStateAccount.authority.toString(),
      mintStateBump: mintStateAccount.bump,
      initializationTransaction: tx,
      initializedAt: new Date().toISOString(),
      initializedBy: walletKeypair.publicKey.toString()
    };

    const configPath = path.join(process.cwd(), 'config', 'program-config.json');
    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    console.log(`📄 Configuration saved: ${configPath}`);

    // 12. Summary
    console.log('\n🎉 Smart contract initialization completed successfully!');
    console.log('📋 Summary:');
    console.log(`   Transaction: ${tx}`);
    console.log(`   Mint State: ${mintState.toString()}`);
    console.log(`   Authority: ${mintStateAccount.authority.toString()}`);
    console.log(`   PROS Mint: ${mintKeypair.publicKey.toString()}`);
    console.log(`   Vault Account: ${vaultTokenAccount.toString()}`);
    
    console.log('\n🚀 Ready for:');
    console.log('1. Minting PROS tokens');
    console.log('2. Creating proposals');
    console.log('3. Testing voting functionality');

    return finalConfig;

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
  completeInitialization();
}

module.exports = completeInitialization;