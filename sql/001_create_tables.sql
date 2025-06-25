-- Create Users table for NextAuth + Google OAuth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  wallet_address VARCHAR(255), -- For Phase 2
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proposer_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Finalized')),
  voting_start_date TIMESTAMP WITH TIME ZONE, -- Next 0:00 after creation
  voting_end_date TIMESTAMP WITH TIME ZONE,   -- 5 days after start
  final_result VARCHAR(20) CHECK (final_result IN ('approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  support_level INTEGER CHECK (support_level >= 0 AND support_level <= 100),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(proposal_id, voter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON proposals(voting_start_date, voting_end_date);
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON proposals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
