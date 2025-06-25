-- Add collateral system to proposals table for v3.0
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS collateral_amount INTEGER DEFAULT 100;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS collateral_locked BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS collateral_returned BOOLEAN DEFAULT false;

-- Add collateral system to votes table for v3.0  
ALTER TABLE votes ADD COLUMN IF NOT EXISTS collateral_amount INTEGER DEFAULT 20;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS collateral_locked BOOLEAN DEFAULT false;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS collateral_returned BOOLEAN DEFAULT false;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS profit_earned INTEGER DEFAULT 0;

-- Create collateral_transactions table for tracking PROS token movements
CREATE TABLE IF NOT EXISTS collateral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  proposal_id UUID REFERENCES proposals(id),
  vote_id UUID REFERENCES votes(id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('lock', 'return', 'forfeit', 'profit')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_collateral_transactions_user_id ON collateral_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_collateral_transactions_proposal_id ON collateral_transactions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_collateral_transactions_type ON collateral_transactions(transaction_type);

-- Add PROS token balance tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pros_balance INTEGER DEFAULT 1000;
