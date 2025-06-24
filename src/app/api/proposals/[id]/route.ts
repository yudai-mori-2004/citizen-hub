import { NextRequest, NextResponse } from 'next/server';

// Mock proposals data (same as in the main proposals route)  
const mockProposals = [
  {
    id: 'prop-1',
    title: '公園に新しい遊具を設置する提案',
    description: '子供たちのために地域の公園に新しい遊具を設置することを提案します。安全性を重視した設計で、幅広い年齢層が楽しめる設備を考えています。\n\n具体的には以下の遊具を検討しています：\n- 複合遊具（滑り台、ブランコ、鉄棒を組み合わせ）\n- 砂場エリアの拡張\n- 小さな子供向けのスプリング遊具\n\n予算は約300万円を想定しており、設置後の維持管理についても計画に含めています。',
    proposer: 'user-123',
    stake_amount: 100,
    status: 'Active',
    voting_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 45,
    support_count: null,
    oppose_count: null,
    final_result: null
  },
  {
    id: 'prop-2', 
    title: '地域図書館の開館時間延長',
    description: '働く住民のために図書館の平日開館時間を21時まで延長することを提案します。\n\n現在の開館時間：平日9:00-17:00、土日9:00-19:00\n提案する開館時間：平日9:00-21:00、土日9:00-19:00\n\nこの延長により、仕事帰りの方々も図書館を利用しやすくなり、地域の学習環境が向上すると考えています。',
    proposer: 'user-456',
    stake_amount: 100,
    status: 'Active',
    voting_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    vote_count: 23,
    support_count: null,
    oppose_count: null,
    final_result: null
  },
  {
    id: 'prop-3',
    title: '商店街でのフリーWiFi設置',
    description: '地域活性化のため商店街にフリーWiFiを設置し、観光客や住民の利便性を向上させる提案です。\n\n設置予定箇所：\n- 商店街メイン通り（5箇所）\n- 商店街広場（2箇所）\n- 主要店舗前（10箇所）\n\n月間維持費用は約5万円を想定しており、観光客の増加による経済効果が期待できます。',
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
    description: '駅前広場の清掃を週2回から毎日に増やすことで、より清潔で快適な環境を維持する提案です。\n\n現在の清掃スケジュール：火曜日・金曜日の週2回\n提案する清掃スケジュール：毎日実施\n\n追加コストは月額約15万円ですが、駅利用者からの苦情減少と地域イメージ向上が期待できます。',
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
    description: '災害時に備えて、各町内に防災用品の配布拠点を設置する提案です。緊急時の物資供給体制を整備します。\n\n設置予定拠点：\n- 各町内会館（12箇所）\n- 小学校（5箇所）\n- 公民館（3箇所）\n\n配布予定物資：\n- 非常用飲料水\n- 非常食\n- 簡易トイレ\n- 懐中電灯・電池\n- 毛布・タオル',
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
    description: '経済支援として住民税を一時的に減税する提案です。コロナ禍の影響を受けた住民への負担軽減を目指します。\n\n減税内容：\n- 住民税均等割を50%減税\n- 適用期間：1年間\n- 対象：全住民\n\n財政への影響：\n- 年間減収見込み：約2億円\n- 代替財源：地方創生臨時交付金の活用を検討',
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
    description: '住民が共同で利用できる農園を開設し、地域コミュニティの活性化と食育を推進する提案です。\n\n計画詳細：\n- 場所：旧学校跡地（約1000㎡）\n- 区画数：50区画（1区画20㎡）\n- 利用料：年間5000円/区画\n- 共用施設：倉庫、水道、堆肥置き場\n\n期待効果：\n- 世代間交流の促進\n- 地産地消の推進\n- 子どもたちの食育機会の提供',
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const proposalId = params.id;
  const proposal = mockProposals.find(p => p.id === proposalId);
  
  if (!proposal) {
    return NextResponse.json(
      { error: 'Proposal not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(proposal);
}