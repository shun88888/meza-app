-- ===== "閉じても進む"システム強化マイグレーション =====
-- Phase 1: データベーススキーマ更新

-- 1. challenges テーブルの強化
-- ends_at カラム追加（サーバー時刻基準の確定終了時刻）
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS evidence_ref TEXT;

-- status enumの拡張（設計書準拠）
-- 既存のCHECK制約を削除して新しいものを追加
DO $$
BEGIN
    -- 既存の制約を削除（名前が分からない場合があるので安全に処理）
    ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
    
    -- 新しい制約を追加
    ALTER TABLE challenges 
    ADD CONSTRAINT challenges_status_check 
    CHECK (status IN ('pending', 'created', 'active', 'completed', 'succeeded', 'failed', 'failed_timeout', 'failed_payment'));
END $$;

-- 2. payments テーブルの強化
-- 冪等性とエラーハンドリング用カラム追加
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT FALSE;

-- status制約も更新
DO $$
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
    ALTER TABLE payments 
    ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'completed', 'succeeded', 'failed', 'requires_action', 'processing'));
END $$;

-- 3. payment_methods テーブルの強化
-- default_payment_method カラム追加（profiles テーブル連携用）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS default_payment_method TEXT;

-- 4. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_challenges_user_status_ends ON challenges(user_id, status, ends_at);
CREATE INDEX IF NOT EXISTS idx_challenges_active_ends_at ON challenges(status, ends_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_challenge_status ON payments(challenge_id, status);

-- 5. コメント追加（保守性向上）
COMMENT ON COLUMN challenges.ends_at IS 'サーバー時刻基準の確定終了時刻（タイムゾーン考慮済み）';
COMMENT ON COLUMN challenges.evidence_ref IS '成功証跡への参照（写真URL、GPS座標、QRコードなど）';
COMMENT ON COLUMN payments.idempotency_key IS 'Stripe PaymentIntent作成時の冪等性キー（通常はchallenge_id）';
COMMENT ON COLUMN payments.webhook_received_at IS 'Stripe webhookで最終同期された時刻';
COMMENT ON COLUMN payments.requires_action IS '3DS認証など追加アクションが必要かどうか';

-- 6. データ移行（既存データの補完）
-- 既存のactiveチャレンジにends_atを設定（target_timeから推測）
UPDATE challenges 
SET ends_at = (CURRENT_DATE + target_time::time)::timestamptz
WHERE ends_at IS NULL 
AND status = 'active' 
AND target_time IS NOT NULL;

-- pendingチャレンジは明日の同時刻に設定
UPDATE challenges 
SET ends_at = ((CURRENT_DATE + INTERVAL '1 day') + target_time::time)::timestamptz
WHERE ends_at IS NULL 
AND status = 'pending' 
AND target_time IS NOT NULL;

-- 7. RLSポリシーの更新準備
-- 新しいステータスに対応したポリシー（後でSECURITY DEFINER RPCで制御）
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;

-- より厳格なRLS: 基本的に読み取り専用、更新はRPC経由のみ
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- UPDATE/DELETEは後でSECURITY DEFINER RPCでのみ許可

-- 8. トリガー関数: 自動更新
CREATE OR REPLACE FUNCTION update_challenge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
DROP TRIGGER IF EXISTS update_challenge_timestamp_trigger ON challenges;
CREATE TRIGGER update_challenge_timestamp_trigger
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_timestamp();

-- 9. 初期化完了ログ
INSERT INTO system_logs (service, level, message, metadata)
VALUES (
    'migration',
    'info',
    'Challenge system enhancement migration completed',
    jsonb_build_object(
        'migration', '20250823000000_enhance_challenge_system',
        'timestamp', NOW(),
        'changes', jsonb_build_array(
            'Added ends_at timestamptz column',
            'Added evidence_ref text column', 
            'Enhanced status enum constraints',
            'Added idempotency_key to payments',
            'Updated RLS policies',
            'Added performance indexes'
        )
    )
);