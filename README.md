# Meza - 位置ベースペナルティアラームアプリ

朝活をサポートする位置ベースのペナルティアラームアプリです。指定した時間に指定した場所にいないとペナルティが課されます。

## 🚀 デプロイ済みアプリ

**本番環境**: [デプロイ後のURLがここに表示されます]

## ✨ 機能

- 📍 **位置ベースチャレンジ**: 起床時間と目標地点を設定
- 💰 **ペナルティシステム**: 時間内に到達しなかった場合の自動課金
- 🎯 **GPS精度**: 100m以内の精密な位置判定
- 🔐 **認証システム**: Supabase Auth による安全なユーザー管理
- 💳 **決済機能**: Stripe による安全な決済処理
- 📱 **PWA対応**: モバイルアプリのような操作感

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, TailwindCSS
- **バックエンド**: Supabase (PostgreSQL + PostGIS)
- **認証**: Supabase Auth
- **決済**: Stripe
- **地図**: React Leaflet + OpenStreetMap
- **ホスティング**: Vercel

## 📋 デプロイ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. データベースのパスワードを設定
4. プロジェクトが作成されるまで待機

### 2. データベースのセットアップ

Supabaseのダッシュボードで以下のSQLを実行：

```sql
-- PostGIS拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- チャレンジテーブル
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wake_time TIME NOT NULL,
  penalty_amount INTEGER NOT NULL,
  home_location GEOGRAPHY(POINT, 4326) NOT NULL,
  target_location GEOGRAPHY(POINT, 4326) NOT NULL,
  home_address TEXT NOT NULL,
  target_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 決済テーブル
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own challenges" ON challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- トリガー関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- タイムスタンプ更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 3. Stripe設定

1. [Stripe Dashboard](https://dashboard.stripe.com)にログイン
2. APIキーを取得（公開可能キーと秘密キー）
3. Webhookエンドポイントを設定

### 4. 環境変数の設定

`.env.local`ファイルを作成：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe設定
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App設定
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

### 5. Vercelデプロイ

1. GitHubにプロジェクトをプッシュ
2. [Vercel](https://vercel.com)にログイン
3. GitHubリポジトリを連携
4. 環境変数を設定
5. デプロイ実行

## 🔧 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# モバイル対応開発サーバー
npm run mobile

# QRコード表示
npm run qr

# ビルド
npm run build
```

## 📱 PWA機能

- **ホーム画面に追加**: iOS Safari / Android Chrome
- **オフライン対応**: 基本機能のキャッシュ
- **プッシュ通知**: チャレンジ開始時間の通知

## 🔒 セキュリティ

- **Row Level Security**: Supabaseの行レベルセキュリティ
- **認証**: Supabase Auth による JWT認証
- **決済**: Stripe による PCI DSS 準拠の決済処理

## 📊 アーキテクチャ

```
フロントエンド (Next.js)
    ↓
Supabase (認証・データベース)
    ↓
Stripe (決済処理)
    ↓
Vercel (ホスティング)
```

## 🐛 トラブルシューティング

### ビルドエラー
- `npm run build`でエラーが発生する場合は、依存関係を再インストール

### GPS取得エラー
- HTTPSでのアクセスが必要
- ブラウザの位置情報許可を確認

### 決済エラー
- Stripe APIキーが正しく設定されているか確認
- Webhookエンドポイントが正しく設定されているか確認

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 