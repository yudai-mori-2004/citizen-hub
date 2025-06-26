-- =============================================================================
-- CitizenHub Database Initialization Script
-- =============================================================================
-- This script sets up the complete database schema and initial data
-- Run this once when setting up a new environment

-- =============================================================================
-- TABLE CREATION
-- =============================================================================

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
  voting_end_date TIMESTAMP WITH TIME ZONE,   -- 7 days after start (was 5)
  final_result VARCHAR(20) CHECK (final_result IN ('approved', 'rejected')),
  -- On-chain integration fields
  on_chain_proposal_seed VARCHAR(255),
  on_chain_tx_signature VARCHAR(255),
  proposer_wallet_address VARCHAR(255),
  stake_amount INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Votes table with updated scale (-100 to +100)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  support_level INTEGER CHECK (support_level >= -100 AND support_level <= 100), -- Updated range
  comment TEXT,
  -- Collateral system fields
  collateral_amount INTEGER DEFAULT 20,
  -- On-chain integration fields
  on_chain_deposit_signature VARCHAR(255),
  voter_wallet_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(proposal_id, voter_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON proposals(voting_start_date, voting_end_date);
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

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

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert demo user (admin)
INSERT INTO users (id, email, name, google_id, role)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin@citizenhub.dev', 'CitizenHub Admin', 'demo_google_id', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert demo proposals with realistic content
INSERT INTO proposals (
  id, 
  title, 
  description, 
  proposer_id, 
  status, 
  voting_start_date, 
  voting_end_date,
  on_chain_proposal_seed,
  on_chain_tx_signature
) VALUES 
-- Proposal 1: Infrastructure
('proposal-001', 'Install Nighttime Lighting in Central Park', 
'Enhance safety and accessibility by installing LED lighting along all major pathways in Central Park. This includes solar-powered lights with motion sensors to reduce energy consumption while maintaining 24/7 illumination for pedestrians and cyclists.',
'550e8400-e29b-41d4-a716-446655440000', 'Active', 
CURRENT_TIMESTAMP, 
CURRENT_TIMESTAMP + INTERVAL '7 days',
NULL, NULL),

-- Proposal 2: Technology
('proposal-002', 'Implement Smart Waste Bins',
'Deploy IoT-enabled waste bins throughout the city that automatically notify waste management when full. This will optimize collection routes, reduce overflow, and keep our streets cleaner while reducing operational costs.',
'550e8400-e29b-41d4-a716-446655440000', 'Active',
CURRENT_TIMESTAMP - INTERVAL '1 day', 
CURRENT_TIMESTAMP + INTERVAL '6 days',
NULL, NULL),

-- Proposal 3: Digital Services
('proposal-003', 'Multilingual City Hall Website',
'Redesign the city hall website to support multiple languages including Spanish, Korean, and Vietnamese to better serve our diverse community. Include voice navigation and accessibility features for residents with disabilities.',
'550e8400-e29b-41d4-a716-446655440000', 'Pending',
CURRENT_TIMESTAMP + INTERVAL '1 day', 
CURRENT_TIMESTAMP + INTERVAL '8 days',
NULL, NULL),

-- Proposal 4: Transportation
('proposal-004', 'Optimize Bus Routes',
'Analyze ridership data and community feedback to redesign bus routes for better coverage of underserved neighborhoods. Add express routes during peak hours and improve connectivity to major employment centers.',
'550e8400-e29b-41d4-a716-446655440000', 'Active',
CURRENT_TIMESTAMP - INTERVAL '2 days', 
CURRENT_TIMESTAMP + INTERVAL '5 days',
NULL, NULL),

-- Proposal 5: Infrastructure (Long-term)
('proposal-005', 'Accelerate Sewer Infrastructure Rehabilitation',
'Fast-track the replacement of aging sewer lines in the downtown district to prevent flooding and reduce maintenance costs. This multi-year project will improve water quality and reduce emergency repairs.',
'550e8400-e29b-41d4-a716-446655440000', 'Finalized',
CURRENT_TIMESTAMP - INTERVAL '10 days', 
CURRENT_TIMESTAMP - INTERVAL '3 days',
NULL, NULL),

-- Proposal 6: Education
('proposal-006', 'Wi-Fi Installation in Public Elementary Schools',
'Upgrade internet infrastructure in all public elementary schools to support modern digital learning tools. Include cybersecurity training for teachers and parental controls for safe internet access.',
'550e8400-e29b-41d4-a716-446655440000', 'Finalized',
CURRENT_TIMESTAMP - INTERVAL '15 days', 
CURRENT_TIMESTAMP - INTERVAL '8 days',
NULL, NULL),

-- Proposal 7: Recreation
('proposal-007', 'Riverfront Walking Path Development',
'Develop a 3-mile walking and cycling path along the riverfront with rest areas, exercise stations, and native plant landscaping. This will provide recreational opportunities while supporting local ecosystem restoration.',
'550e8400-e29b-41d4-a716-446655440000', 'Active',
CURRENT_TIMESTAMP - INTERVAL '3 days', 
CURRENT_TIMESTAMP + INTERVAL '4 days',
NULL, NULL),

-- Proposal 8: Transportation
('proposal-008', 'Expand Bike Sharing Stations',
'Add 20 new bike sharing stations in residential areas currently underserved by public transportation. Include electric bikes and implement a low-income discount program to improve transportation equity.',
'550e8400-e29b-41d4-a716-446655440000', 'Pending',
CURRENT_TIMESTAMP + INTERVAL '2 days', 
CURRENT_TIMESTAMP + INTERVAL '9 days',
NULL, NULL)

ON CONFLICT (id) DO NOTHING;

-- Insert demo votes
INSERT INTO votes (proposal_id, voter_id, support_level, comment, collateral_amount) VALUES 
('proposal-001', '550e8400-e29b-41d4-a716-446655440000', 85, 'Essential for safety, especially for evening joggers and dog walkers.', 25),
('proposal-002', '550e8400-e29b-41d4-a716-446655440000', 70, 'Good idea but need to ensure maintenance is included in the budget.', 20),
('proposal-004', '550e8400-e29b-41d4-a716-446655440000', -30, 'Current routes work fine. This seems like unnecessary disruption.', 30),
('proposal-007', '550e8400-e29b-41d4-a716-446655440000', 95, 'This will greatly improve our quality of life and property values.', 50)
ON CONFLICT (proposal_id, voter_id) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'CitizenHub database initialization completed successfully!';
  RAISE NOTICE 'Created tables: users, proposals, votes';
  RAISE NOTICE 'Inserted demo data: 1 admin user, 8 proposals, 4 votes';
END $$;