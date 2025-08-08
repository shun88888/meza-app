-- ===== MEZA アプリ 本番用データベーススキーマ =====
-- 前提整備：challenge_id を全イベントの主キーに紐付け
-- 実行順序：このファイル全体をSupabaseのSQLエディタで実行

-- PostGIS拡張を有効化（位置情報処理用）
CREATE EXTENSION IF NOT EXISTS postgis;

-- プロフィールテーブルの更新
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  
  -- Stripe関連
  stripe_customer_id TEXT,
  default_payment_method_id TEXT,
  
  -- ユーザー設定
  timezone TEXT DEFAULT 'Asia/Tokyo' NOT NULL,
  notification_enabled BOOLEAN DEFAULT true NOT NULL,
  location_permission_granted BOOLEAN DEFAULT false NOT NULL,
  
  -- 安全設定
  monthly_penalty_limit INTEGER DEFAULT 5000 NOT NULL, -- 50円の上限
  warning_before_charge BOOLEAN DEFAULT true NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- チャレンジテーブルの更新
DROP TABLE IF EXISTS challenges CASCADE;
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- 時刻設定（UTC基準）
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- チャレンジ設定
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'success', 'fail', 'settled')),
  target_meters INTEGER DEFAULT 100 NOT NULL,
  penalty_amount INTEGER NOT NULL, -- セント単位
  
  -- 位置情報
  home_location GEOGRAPHY(POINT, 4326) NOT NULL,
  target_location GEOGRAPHY(POINT, 4326) NOT NULL,
  home_address TEXT NOT NULL,
  target_address TEXT NOT NULL,
  
  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 位置情報ピングテーブル（新規）
CREATE TABLE location_pings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  
  -- 位置データ
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION NOT NULL, -- GPS精度（メートル）
  
  -- メタデータ
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT CHECK (source IN ('gps', 'network', 'qr', 'manual')) NOT NULL,
  
  -- 品質管理
  is_valid BOOLEAN DEFAULT true NOT NULL,
  movement_from_previous DOUBLE PRECISION DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 決済ログテーブル（更新）
DROP TABLE IF EXISTS payment_logs CASCADE;
CREATE TABLE payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe関連
  payment_intent_id TEXT NOT NULL,
  payment_method_id TEXT,
  
  -- 決済情報
  amount INTEGER NOT NULL, -- セント単位
  currency TEXT DEFAULT 'jpy' NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  
  -- Stripe詳細
  receipt_url TEXT,
  failure_code TEXT,
  failure_message TEXT,
  
  -- リトライ管理
  retry_count INTEGER DEFAULT 0 NOT NULL,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  max_retries INTEGER DEFAULT 3 NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 通知ログテーブル（新規）
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- 通知内容
  kind TEXT CHECK (kind IN ('reminder_30min', 'reminder_5min', 'challenge_start', 'challenge_end', 'success', 'failure', 'payment_success', 'payment_failed')) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- 配信状態
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  push_token TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- メタデータ
  platform TEXT CHECK (platform IN ('web', 'ios', 'android')) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- インデックスの作成（パフォーマンス最適化）
CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_start_at ON challenges(start_at);
CREATE INDEX idx_location_pings_challenge_id ON location_pings(challenge_id);
CREATE INDEX idx_location_pings_timestamp ON location_pings(timestamp);
CREATE INDEX idx_payment_logs_challenge_id ON payment_logs(challenge_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_next_retry_at ON payment_logs(next_retry_at);
CREATE INDEX idx_notification_logs_challenge_id ON notification_logs(challenge_id);
CREATE INDEX idx_notification_logs_scheduled_at ON notification_logs(scheduled_at);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- プロフィール
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- チャレンジ
CREATE POLICY "Users can view own challenges" ON challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = user_id);

-- 位置情報ピング
CREATE POLICY "Users can view own location pings" ON location_pings FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM challenges WHERE id = challenge_id)
);
CREATE POLICY "Users can create own location pings" ON location_pings FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM challenges WHERE id = challenge_id)
);

-- 決済ログ
CREATE POLICY "Users can view own payment logs" ON payment_logs FOR SELECT USING (auth.uid() = user_id);

-- 通知ログ
CREATE POLICY "Users can view own notification logs" ON notification_logs FOR SELECT USING (auth.uid() = user_id);

-- トリガー関数の作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payment_logs_updated_at BEFORE UPDATE ON payment_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 移動距離計算関数の作成
CREATE OR REPLACE FUNCTION calculate_distance_moved(challenge_uuid UUID)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    total_distance DOUBLE PRECISION := 0;
    ping_record RECORD;
    prev_lat DOUBLE PRECISION;
    prev_lng DOUBLE PRECISION;
    current_distance DOUBLE PRECISION;
BEGIN
    -- 最初のピングを取得
    SELECT lat, lng INTO prev_lat, prev_lng
    FROM location_pings 
    WHERE challenge_id = challenge_uuid AND is_valid = true
    ORDER BY timestamp ASC 
    LIMIT 1;
    
    IF prev_lat IS NULL THEN
        RETURN 0;
    END IF;
    
    -- 各ピング間の距離を累積計算
    FOR ping_record IN 
        SELECT lat, lng 
        FROM location_pings 
        WHERE challenge_id = challenge_uuid AND is_valid = true
        ORDER BY timestamp ASC 
        OFFSET 1
    LOOP
        -- Haversine距離計算（メートル単位）
        SELECT ST_Distance(
            ST_GeogFromText('POINT(' || prev_lng || ' ' || prev_lat || ')'),
            ST_GeogFromText('POINT(' || ping_record.lng || ' ' || ping_record.lat || ')')
        ) INTO current_distance;
        
        total_distance := total_distance + current_distance;
        prev_lat := ping_record.lat;
        prev_lng := ping_record.lng;
    END LOOP;
    
    RETURN total_distance;
END;
$$ LANGUAGE plpgsql;

-- 管理者用ビュー（統計・監視用）
CREATE OR REPLACE VIEW admin_challenge_stats AS
SELECT 
    DATE_TRUNC('day', c.created_at) as date,
    COUNT(*) as total_challenges,
    COUNT(CASE WHEN c.status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN c.status = 'fail' THEN 1 END) as failed,
    ROUND(AVG(c.penalty_amount::numeric) / 100, 2) as avg_penalty_yen,
    COUNT(DISTINCT c.user_id) as unique_users
FROM challenges c
GROUP BY DATE_TRUNC('day', c.created_at)
ORDER BY date DESC;

-- サンプルデータの挿入（開発用）
-- 実際の本番環境では削除してください
-- INSERT INTO profiles (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com');

COMMENT ON TABLE challenges IS 'チャレンジテーブル：challenge_idが全システムの主キー';
COMMENT ON TABLE location_pings IS '位置情報ピング：GPS品質管理と移動距離計算用';
COMMENT ON TABLE payment_logs IS '決済ログ：冪等性キー管理とリトライ処理用';
COMMENT ON TABLE notification_logs IS '通知ログ：配信状況追跡用';

-- スキーマ作成完了
SELECT 'データベーススキーマの作成が完了しました。' as status;