import { NextRequest, NextResponse } from 'next/server';

// Mock proposals data
const mockProposals = [
  {
    id: 'prop-1',
    title: '公園に新しい遊具を設置する提案',
    description: '子供たちのために地域の公園に新しい遊具を設置することを提案します。安全性を重視した設計で、幅広い年齢層が楽しめる設備を考えています。',
    proposer: 'user-123',
    stake_amount: 100,
    status: 'Active',
    voting_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 45,
    // Results hidden during active voting
    support_count: null,
    oppose_count: null,
    final_result: null
  },
  {
    id: 'prop-2', 
    title: '地域図書館の開館時間延長',
    description: '働く住民のために図書館の平日開館時間を21時まで延長することを提案します。',
    proposer: 'user-456',
    stake_amount: 100,
    status: 'Active',
    voting_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 23,
    // Results hidden during active voting
    support_count: null,
    oppose_count: null,
    final_result: null
  },
  {
    id: 'prop-3',
    title: '商店街でのフリーWiFi設置',
    description: '地域活性化のため商店街にフリーWiFiを設置し、観光客や住民の利便性を向上させる提案です。',
    proposer: 'user-789',
    stake_amount: 100,
    status: 'Pending',
    voting_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    vote_count: 0,
    support_count: null,
    oppose_count: null,
    final_result: null
  },
  {
    id: 'prop-4',
    title: '駅前広場の清掃頻度増加',
    description: '駅前広場の清掃を週2回から毎日に増やすことで、より清潔で快適な環境を維持する提案です。',
    proposer: 'user-999',
    stake_amount: 100,
    status: 'Finalized',
    voting_end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 87,
    support_count: 52,
    oppose_count: 35,
    final_result: 'approved'
  },
  {
    id: 'prop-5',
    title: '地域防災用品の配布拠点設置',
    description: '災害時に備えて、各町内に防災用品の配布拠点を設置する提案です。緊急時の物資供給体制を整備します。',
    proposer: 'user-888',
    stake_amount: 100,
    status: 'Finalized',
    voting_end_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 134,
    support_count: 89,
    oppose_count: 45,
    final_result: 'approved'
  },
  {
    id: 'prop-6',
    title: '住民税の一時減税',
    description: '経済支援として住民税を一時的に減税する提案です。コロナ禍の影響を受けた住民への負担軽減を目指します。',
    proposer: 'user-777',
    stake_amount: 100,
    status: 'Finalized',
    voting_end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 156,
    support_count: 68,
    oppose_count: 88,
    final_result: 'rejected'
  },
  {
    id: 'prop-7',
    title: 'コミュニティ農園の開設',
    description: '住民が共同で利用できる農園を開設し、地域コミュニティの活性化と食育を推進する提案です。',
    proposer: 'user-666',
    stake_amount: 100,
    status: 'Finalized',
    voting_end_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 98,
    support_count: 72,
    oppose_count: 26,
    final_result: 'approved'
  }
];

export async function GET() {
  return NextResponse.json({ proposals: mockProposals });
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, voting_duration_days } = await request.json();
    
    const newProposal = {
      id: crypto.randomUUID(),
      title,
      description,
      proposer: 'current-user',
      stake_amount: 100,
      status: 'Pending',
      voting_end_date: new Date(Date.now() + voting_duration_days * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      vote_count: 0,
      support_rate: 0
    };
    
    return NextResponse.json(newProposal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}