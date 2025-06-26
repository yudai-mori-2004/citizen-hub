import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
      support_level, 
      comment, 
      collateral_amount = 20,
      wallet_address,
      on_chain_transaction_signature,
      legacy_vote = false
    } = await request.json();
    const params = await context.params;
    const proposalId = params.id;
    
    // Validate input - updated for -100 to +100 scale
    if (support_level < -100 || support_level > 100) {
      return NextResponse.json(
        { error: 'Support level must be between -100 and 100' },
        { status: 400 }
      );
    }

    // Validate required on-chain data (except for legacy votes)
    if (!legacy_vote && (!wallet_address || !on_chain_transaction_signature)) {
      return NextResponse.json(
        { error: 'Wallet address and transaction signature are required for on-chain votes' },
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
    
    const voterId = user.id;
    
    // Check if proposal exists and is active
    const [proposal] = await sql`
      SELECT id, status, on_chain_proposal_seed FROM proposals WHERE id = ${proposalId}
    `;
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }
    
    if (proposal.status !== 'Active') {
      return NextResponse.json(
        { error: 'Voting is not active for this proposal' },
        { status: 400 }
      );
    }

    // Check if user has already voted on this proposal
    const [existingVote] = await sql`
      SELECT id FROM votes WHERE proposal_id = ${proposalId} AND voter_id = ${voterId}
    `;

    if (existingVote) {
      // Update existing vote
      const [updatedVote] = await sql`
        UPDATE votes 
        SET 
          support_level = ${support_level},
          comment = ${comment || null},
          collateral_amount = ${collateral_amount},
          on_chain_deposit_signature = ${on_chain_transaction_signature || null},
          voter_wallet_address = ${wallet_address || null},
          created_at = CURRENT_TIMESTAMP
        WHERE proposal_id = ${proposalId} AND voter_id = ${voterId}
        RETURNING *
      `;
      
      return NextResponse.json({
        success: true,
        vote: updatedVote,
        message: 'Vote updated successfully with on-chain collateral'
      });
    } else {
      // Create new vote
      const [newVote] = await sql`
        INSERT INTO votes (
          proposal_id, 
          voter_id, 
          support_level, 
          comment, 
          collateral_amount,
          on_chain_deposit_signature,
          voter_wallet_address
        )
        VALUES (
          ${proposalId}, 
          ${voterId}, 
          ${support_level}, 
          ${comment || null}, 
          ${collateral_amount},
          ${on_chain_transaction_signature || null},
          ${wallet_address || null}
        )
        RETURNING *
      `;
      
      return NextResponse.json({
        success: true,
        vote: newVote,
        message: 'Vote submitted successfully with on-chain collateral'
      });
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}