-- Update vote scale from 0-100 to -100 to +100 for v3.0 specification
-- This changes the voting system to support strong oppose (-100) to strong support (+100)

-- First, update the constraint on the votes table
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_support_level_check;
ALTER TABLE votes ADD CONSTRAINT votes_support_level_check 
  CHECK (support_level >= -100 AND support_level <= 100);

-- Update voting end date calculation from 5 days to 7 days
-- This will be handled in the application code, but adding comment for reference
-- New specification: 7-day voting period instead of 5 days

-- Add comment to clarify the new scale
COMMENT ON COLUMN votes.support_level IS 'Support level from -100 (strong oppose) to +100 (strong support), 0 is neutral';
