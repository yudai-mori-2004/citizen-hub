-- Add on-chain fields to proposals table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS on_chain_proposal_seed VARCHAR(255),
ADD COLUMN IF NOT EXISTS on_chain_tx_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS proposer_wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS stake_amount INTEGER DEFAULT 100;

-- Add on-chain fields to votes table  
ALTER TABLE votes
ADD COLUMN IF NOT EXISTS on_chain_deposit_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS voter_wallet_address VARCHAR(255);

-- Update proposals table structure for better on-chain integration
COMMENT ON COLUMN proposals.on_chain_proposal_seed IS 'Solana public key used as seed for proposal PDA';
COMMENT ON COLUMN proposals.on_chain_tx_signature IS 'Transaction signature for proposal registration and staking';
COMMENT ON COLUMN proposals.proposer_wallet_address IS 'Solana wallet address of the proposer';
COMMENT ON COLUMN proposals.stake_amount IS 'Amount of PROS tokens staked for this proposal';

COMMENT ON COLUMN votes.on_chain_deposit_signature IS 'Transaction signature for vote staking';
COMMENT ON COLUMN votes.voter_wallet_address IS 'Solana wallet address of the voter';