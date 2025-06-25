import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with proper auth
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Starting database migration...');

    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        image TEXT,
        google_id VARCHAR(255) UNIQUE,
        wallet_address VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Proposals table
    await sql`
      CREATE TABLE IF NOT EXISTS proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        proposer_id UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Finalized')),
        voting_start_date TIMESTAMP WITH TIME ZONE,
        voting_end_date TIMESTAMP WITH TIME ZONE,
        final_result VARCHAR(20) CHECK (final_result IN ('approved', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Votes table
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        voter_id UUID REFERENCES users(id),
        support_level INTEGER CHECK (support_level >= 0 AND support_level <= 100),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(proposal_id, voter_id)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON proposals(voting_start_date, voting_end_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON votes(proposal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`;

    console.log('Migration completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
