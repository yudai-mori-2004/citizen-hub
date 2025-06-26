import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

interface UserActivity {
  id: string;
  type: 'proposal' | 'vote';
  title: string;
  amount: number;
  status: string;
  created_at: string;
  tx_signature?: string;
  support_level?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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
    
    const userId = user.id;

    // Get user's proposals with collateral information
    const proposals = await sql`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.stake_amount,
        p.on_chain_tx_signature,
        p.created_at,
        p.final_result
      FROM proposals p
      WHERE p.proposer_id = ${userId}
      ORDER BY p.created_at DESC
    `;

    // Get user's votes with collateral information
    const votes = await sql`
      SELECT 
        v.id,
        v.support_level,
        v.collateral_amount,
        v.on_chain_deposit_signature,
        v.created_at,
        p.title,
        p.status as proposal_status,
        p.final_result
      FROM votes v
      JOIN proposals p ON v.proposal_id = p.id
      WHERE v.voter_id = ${userId}
      ORDER BY v.created_at DESC
    `;

    // Transform proposals into activity items
    const proposalActivities: UserActivity[] = proposals.map(proposal => ({
      id: `proposal-${proposal.id}`,
      type: 'proposal' as const,
      title: proposal.title,
      amount: proposal.stake_amount || 100, // Default proposal stake
      status: proposal.status,
      created_at: proposal.created_at,
      tx_signature: proposal.on_chain_tx_signature,
    }));

    // Transform votes into activity items
    const voteActivities: UserActivity[] = votes.map(vote => ({
      id: `vote-${vote.id}`,
      type: 'vote' as const,
      title: `Vote on: ${vote.title}`,
      amount: vote.collateral_amount || 20, // Default vote stake
      status: vote.proposal_status,
      created_at: vote.created_at,
      tx_signature: vote.on_chain_deposit_signature,
      support_level: vote.support_level,
    }));

    // Combine and sort all activities by date
    const allActivities = [...proposalActivities, ...voteActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate statistics
    const stats = {
      totalProposals: proposals.length,
      totalVotes: votes.length,
      totalStaked: proposalActivities.reduce((sum, p) => sum + p.amount, 0) + 
                   voteActivities.reduce((sum, v) => sum + v.amount, 0),
      approvedProposals: proposals.filter(p => p.final_result === 'approved').length,
      rejectedProposals: proposals.filter(p => p.final_result === 'rejected').length,
    };

    return NextResponse.json({
      success: true,
      user_id: userId,
      activities: allActivities,
      statistics: stats,
      balance: 0, // We'll remove this as it's not used in the new design
      transactions: allActivities // Keep for backward compatibility initially
    });

  } catch (error) {
    console.error('Error fetching user balance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}