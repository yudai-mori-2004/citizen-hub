-- Insert sample users
INSERT INTO users (id, email, name, google_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'user1@example.com', 'Sample User 1', 'google_123', 'user'),
  ('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', 'Sample User 2', 'google_456', 'user'),
  ('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', 'Admin User', 'google_789', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample proposals with realistic voting dates
INSERT INTO proposals (id, title, description, proposer_id, status, voting_start_date, voting_end_date, final_result, created_at) VALUES
  (
    'prop-1',
    '公園に新しい遊具を設置する提案',
    '子供たちのために地域の公園に新しい遊具を設置することを提案します。安全性を重視した設計で、幅広い年齢層が楽しめる設備を考えています。

具体的には以下の遊具を検討しています：
- 複合遊具（滑り台、ブランコ、鉄棒を組み合わせ）
- 砂場エリアの拡張
- 小さな子供向けのスプリング遊具

予算は約300万円を想定しており、設置後の維持管理についても計画に含めています。',
    '550e8400-e29b-41d4-a716-446655440001',
    'Active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
  ),
  (
    'prop-2',
    '地域図書館の開館時間延長',
    '働く住民のために図書館の平日開館時間を21時まで延長することを提案します。

現在の開館時間：平日9:00-17:00、土日9:00-19:00
提案する開館時間：平日9:00-21:00、土日9:00-19:00

この延長により、仕事帰りの方々も図書館を利用しやすくなり、地域の学習環境が向上すると考えています。',
    '550e8400-e29b-41d4-a716-446655440002',
    'Active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  ),
  (
    'prop-3',
    '商店街でのフリーWiFi設置',
    '地域活性化のため商店街にフリーWiFiを設置し、観光客や住民の利便性を向上させる提案です。

設置予定箇所：
- 商店街メイン通り（5箇所）
- 商店街広場（2箇所）
- 主要店舗前（10箇所）

月間維持費用は約5万円を想定しており、観光客の増加による経済効果が期待できます。',
    '550e8400-e29b-41d4-a716-446655440003',
    'Pending',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '6 days',
    NULL,
    CURRENT_TIMESTAMP
  ),
  (
    'prop-4',
    '駅前広場の清掃頻度増加',
    '駅前広場の清掃を週2回から毎日に増やすことで、より清潔で快適な環境を維持する提案です。

現在の清掃スケジュール：火曜日・金曜日の週2回
提案する清掃スケジュール：毎日実施

追加コストは月額約15万円ですが、駅利用者からの苦情減少と地域イメージ向上が期待できます。',
    '550e8400-e29b-41d4-a716-446655440001',
    'Finalized',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '5 days',
    'approved',
    CURRENT_TIMESTAMP - INTERVAL '15 days'
  ),
  (
    'prop-5',
    '地域防災用品の配布拠点設置',
    '災害時に備えて、各町内に防災用品の配布拠点を設置する提案です。緊急時の物資供給体制を整備します。

設置予定拠点：
- 各町内会館（12箇所）
- 小学校（5箇所）
- 公民館（3箇所）

配布予定物資：
- 非常用飲料水
- 非常食
- 簡易トイレ
- 懐中電灯・電池
- 毛布・タオル',
    '550e8400-e29b-41d4-a716-446655440002',
    'Finalized',
    CURRENT_DATE - INTERVAL '25 days',
    CURRENT_DATE - INTERVAL '20 days',
    'approved',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
  ),
  (
    'prop-6',
    '住民税の一時減税',
    '経済支援として住民税を一時的に減税する提案です。コロナ禍の影響を受けた住民への負担軽減を目指します。

減税内容：
- 住民税均等割を50%減税
- 適用期間：1年間
- 対象：全住民

財政への影響：
- 年間減収見込み：約2億円
- 代替財源：地方創生臨時交付金の活用を検討',
    '550e8400-e29b-41d4-a716-446655440003',
    'Finalized',
    CURRENT_DATE - INTERVAL '40 days',
    CURRENT_DATE - INTERVAL '35 days',
    'rejected',
    CURRENT_TIMESTAMP - INTERVAL '45 days'
  ),
  (
    'prop-7',
    'コミュニティ農園の開設',
    '住民が共同で利用できる農園を開設し、地域コミュニティの活性化と食育を推進する提案です。

計画詳細：
- 場所：旧学校跡地（約1000㎡）
- 区画数：50区画（1区画20㎡）
- 利用料：年間5000円/区画
- 共用施設：倉庫、水道、堆肥置き場

期待効果：
- 世代間交流の促進
- 地産地消の推進
- 子どもたちの食育機会の提供',
    '550e8400-e29b-41d4-a716-446655440001',
    'Finalized',
    CURRENT_DATE - INTERVAL '55 days',
    CURRENT_DATE - INTERVAL '50 days',
    'approved',
    CURRENT_TIMESTAMP - INTERVAL '60 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample votes for finalized proposals
INSERT INTO votes (proposal_id, voter_id, support_level, comment) VALUES
  -- Votes for prop-4 (approved)
  ('prop-4', '550e8400-e29b-41d4-a716-446655440001', 85, '清潔な環境は大切です'),
  ('prop-4', '550e8400-e29b-41d4-a716-446655440002', 75, '予算が心配ですが賛成します'),
  ('prop-4', '550e8400-e29b-41d4-a716-446655440003', 90, '必要な投資だと思います'),
  
  -- Votes for prop-5 (approved)  
  ('prop-5', '550e8400-e29b-41d4-a716-446655440001', 95, '災害対策は重要'),
  ('prop-5', '550e8400-e29b-41d4-a716-446655440002', 80, '安心安全のために'),
  ('prop-5', '550e8400-e29b-41d4-a716-446655440003', 85, '地域の備えは必要'),
  
  -- Votes for prop-6 (rejected)
  ('prop-6', '550e8400-e29b-41d4-a716-446655440001', 30, '財政が心配です'),
  ('prop-6', '550e8400-e29b-41d4-a716-446655440002', 45, '代替財源が不明確'),
  ('prop-6', '550e8400-e29b-41d4-a716-446655440003', 25, '持続可能性に疑問'),
  
  -- Votes for prop-7 (approved)
  ('prop-7', '550e8400-e29b-41d4-a716-446655440001', 90, 'コミュニティ活性化に期待'),
  ('prop-7', '550e8400-e29b-41d4-a716-446655440002', 85, '食育は大切'),
  ('prop-7', '550e8400-e29b-41d4-a716-446655440003', 80, '世代間交流が生まれそう')
ON CONFLICT (proposal_id, voter_id) DO NOTHING;
