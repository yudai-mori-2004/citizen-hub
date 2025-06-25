import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getVotingSchedule } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Adding sample data...');

    // Create sample users
    const [user1] = await sql`
      INSERT INTO users (email, name, google_id)
      VALUES ('test@example.com', 'Test User', 'temp-user-id')
      ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    const [user2] = await sql`
      INSERT INTO users (email, name, google_id)
      VALUES ('voter2@example.com', 'Voter 2', 'google-voter-2')
      ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    const [user3] = await sql`
      INSERT INTO users (email, name, google_id)
      VALUES ('voter3@example.com', 'Voter 3', 'google-voter-3')
      ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    // Create sample proposals
    const { votingStartDate, votingEndDate } = getVotingSchedule();
    
    // Active proposal
    const [activeProposal] = await sql`
      INSERT INTO proposals (
        title, 
        description, 
        proposer_id, 
        status,
        voting_start_date, 
        voting_end_date
      )
      VALUES (
        '公園に新しい遊具を設置する提案',
        '子供たちのために地域の公園に新しい遊具を設置することを提案します。安全性を重視した設計で、幅広い年齢層が楽しめる設備を考えています。',
        ${user1.id},
        'Active',
        ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()},
        ${new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()}
      )
      RETURNING id
    `;

    // Pending proposal
    await sql`
      INSERT INTO proposals (
        title, 
        description, 
        proposer_id, 
        status,
        voting_start_date, 
        voting_end_date
      )
      VALUES (
        '地域図書館の開館時間延長',
        '働く住民のために図書館の平日開館時間を21時まで延長することを提案します。',
        ${user1.id},
        'Pending',
        ${votingStartDate.toISOString()},
        ${votingEndDate.toISOString()}
      )
    `;

    // Finalized proposal (approved)
    const [finalizedProposal] = await sql`
      INSERT INTO proposals (
        title, 
        description, 
        proposer_id, 
        status,
        final_result,
        voting_start_date, 
        voting_end_date
      )
      VALUES (
        '駅前広場の清掃頻度増加',
        '駅前広場の清掃を週2回から毎日に増やすことで、より清潔で快適な環境を維持する提案です。',
        ${user1.id},
        'Finalized',
        'approved',
        ${new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()},
        ${new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()}
      )
      RETURNING id
    `;

    // Add sample votes for proposals
    await sql`
      INSERT INTO votes (proposal_id, voter_id, support_level, comment)
      VALUES 
        (${finalizedProposal.id}, ${user1.id}, 75, '良い提案だと思います'),
        (${finalizedProposal.id}, ${user2.id}, 85, '賛成です'),
        (${finalizedProposal.id}, ${user3.id}, 25, '費用が心配です'),
        (${activeProposal.id}, ${user2.id}, 60, 'いいですね'),
        (${activeProposal.id}, ${user3.id}, 40, 'もう少し検討が必要')
    `;

    console.log('Sample data added successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Sample data added successfully' 
    });

  } catch (error) {
    console.error('Seed failed:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
