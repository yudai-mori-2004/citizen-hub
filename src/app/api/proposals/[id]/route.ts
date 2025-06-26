import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const proposalId = params.id;

    const [proposal] = await sql`
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
        END as neutral_count,
        CASE 
          WHEN p.status = 'Finalized' AND COUNT(v.id) > 0 THEN
            ROUND(COUNT(CASE WHEN v.support_level > 0 THEN 1 END)::numeric / COUNT(v.id)::numeric * 100, 1)
          WHEN p.status = 'Finalized' AND COUNT(v.id) = 0 THEN 0
          ELSE NULL
        END as support_rate
      FROM proposals p
      LEFT JOIN votes v ON p.id = v.proposal_id
      WHERE p.id = ${proposalId}
      GROUP BY p.id
    `;
    
    // Debug logging for proposal data
    if (proposal) {
      console.log('Proposal data from DB:', {
        id: proposal.id,
        title: proposal.title,
        has_on_chain_seed: !!proposal.on_chain_proposal_seed,
        has_tx_signature: !!proposal.on_chain_tx_signature,
        has_wallet_address: !!proposal.proposer_wallet_address,
        created_at: proposal.created_at
      });
    }
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}
