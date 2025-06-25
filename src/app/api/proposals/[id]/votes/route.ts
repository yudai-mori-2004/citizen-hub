import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const proposalId = params.id;

    // Get all votes for this proposal with user information
    const votes = await sql`
      SELECT 
        v.id,
        v.support_level,
        v.comment,
        v.created_at,
        v.collateral_amount,
        u.name as voter_name
      FROM votes v
      JOIN users u ON v.voter_id = u.id
      WHERE v.proposal_id = ${proposalId}
      ORDER BY v.created_at DESC
    `;

    // Calculate histogram data for support levels (10 bins from -100 to 100)
    const histogram = await sql`
      SELECT 
        CASE 
          WHEN support_level >= -100 AND support_level < -80 THEN -90
          WHEN support_level >= -80 AND support_level < -60 THEN -70
          WHEN support_level >= -60 AND support_level < -40 THEN -50
          WHEN support_level >= -40 AND support_level < -20 THEN -30
          WHEN support_level >= -20 AND support_level < 0 THEN -10
          WHEN support_level >= 0 AND support_level < 20 THEN 10
          WHEN support_level >= 20 AND support_level < 40 THEN 30
          WHEN support_level >= 40 AND support_level < 60 THEN 50
          WHEN support_level >= 60 AND support_level < 80 THEN 70
          WHEN support_level >= 80 AND support_level <= 100 THEN 90
        END as bin_center,
        CASE 
          WHEN support_level >= -100 AND support_level < -80 THEN '[-100, -80)'
          WHEN support_level >= -80 AND support_level < -60 THEN '[-80, -60)'
          WHEN support_level >= -60 AND support_level < -40 THEN '[-60, -40)'
          WHEN support_level >= -40 AND support_level < -20 THEN '[-40, -20)'
          WHEN support_level >= -20 AND support_level < 0 THEN '[-20, 0)'
          WHEN support_level >= 0 AND support_level < 20 THEN '[0, 20)'
          WHEN support_level >= 20 AND support_level < 40 THEN '[20, 40)'
          WHEN support_level >= 40 AND support_level < 60 THEN '[40, 60)'
          WHEN support_level >= 60 AND support_level < 80 THEN '[60, 80)'
          WHEN support_level >= 80 AND support_level <= 100 THEN '[80, 100]'
        END as range_label,
        COUNT(*) as count
      FROM votes 
      WHERE proposal_id = ${proposalId}
      GROUP BY 
        CASE 
          WHEN support_level >= -100 AND support_level < -80 THEN -90
          WHEN support_level >= -80 AND support_level < -60 THEN -70
          WHEN support_level >= -60 AND support_level < -40 THEN -50
          WHEN support_level >= -40 AND support_level < -20 THEN -30
          WHEN support_level >= -20 AND support_level < 0 THEN -10
          WHEN support_level >= 0 AND support_level < 20 THEN 10
          WHEN support_level >= 20 AND support_level < 40 THEN 30
          WHEN support_level >= 40 AND support_level < 60 THEN 50
          WHEN support_level >= 60 AND support_level < 80 THEN 70
          WHEN support_level >= 80 AND support_level <= 100 THEN 90
        END,
        CASE 
          WHEN support_level >= -100 AND support_level < -80 THEN '[-100, -80)'
          WHEN support_level >= -80 AND support_level < -60 THEN '[-80, -60)'
          WHEN support_level >= -60 AND support_level < -40 THEN '[-60, -40)'
          WHEN support_level >= -40 AND support_level < -20 THEN '[-40, -20)'
          WHEN support_level >= -20 AND support_level < 0 THEN '[-20, 0)'
          WHEN support_level >= 0 AND support_level < 20 THEN '[0, 20)'
          WHEN support_level >= 20 AND support_level < 40 THEN '[20, 40)'
          WHEN support_level >= 40 AND support_level < 60 THEN '[40, 60)'
          WHEN support_level >= 60 AND support_level < 80 THEN '[60, 80)'
          WHEN support_level >= 80 AND support_level <= 100 THEN '[80, 100]'
        END
      ORDER BY bin_center
    `;

    return NextResponse.json({
      votes,
      histogram
    });
  } catch (error) {
    console.error('Error fetching proposal votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal votes' },
      { status: 500 }
    );
  }
}