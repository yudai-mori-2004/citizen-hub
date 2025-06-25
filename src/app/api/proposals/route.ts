import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const proposals = await sql`
      SELECT 
        p.*,
        COUNT(v.id) as vote_count,
        CASE 
          WHEN p.status = 'Finalized' THEN 
            COUNT(CASE WHEN v.support_level > 0 THEN 1 END)
          ELSE NULL 
        END as support_count,
        CASE 
          WHEN p.status = 'Finalized' THEN 
            COUNT(CASE WHEN v.support_level < 0 THEN 1 END)
          ELSE NULL 
        END as oppose_count,
        CASE 
          WHEN p.status = 'Finalized' THEN 
            COUNT(CASE WHEN v.support_level = 0 THEN 1 END)
          ELSE NULL 
        END as neutral_count
      FROM proposals p
      LEFT JOIN votes v ON p.id = v.proposal_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      title, 
      description, 
      wallet_address,
      proposal_seed_pubkey,
      on_chain_transaction_signature
    } = await request.json();
    
    if (!title || !description || !wallet_address || !proposal_seed_pubkey || !on_chain_transaction_signature) {
      return NextResponse.json(
        { error: 'Title, description, wallet address, proposal seed, and transaction signature are required' },
        { status: 400 }
      );
    }

    // Get user ID from database using email
    const [user] = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate voting dates (next day at 0:00 UTC, run for 7 days)
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    nextDay.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(nextDay);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    // Store proposal in database with on-chain reference
    const [proposal] = await sql`
      INSERT INTO proposals (
        title, 
        description, 
        proposer_id, 
        status, 
        voting_start_date, 
        voting_end_date,
        on_chain_proposal_seed,
        on_chain_tx_signature,
        proposer_wallet_address
      )
      VALUES (
        ${title}, 
        ${description}, 
        ${user.id}, 
        'Pending',
        ${nextDay.toISOString()},
        ${endDate.toISOString()},
        ${proposal_seed_pubkey},
        ${on_chain_transaction_signature},
        ${wallet_address}
      )
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      proposal,
      message: 'Proposal submitted successfully with on-chain collateral locked'
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}