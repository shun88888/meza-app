# Meza App セットアップガイド

Mezaは位置情報を活用した起床チャレンジアプリケーションです。このガイドに従って、ローカル開発環境またはプロダクション環境をセットアップしてください。

## 前提条件

- Node.js 18.0.0 以上
- npm または yarn
- Supabase アカウント
- Stripe アカウント
- Git

## 1. リポジトリのクローン

```bash
git clone [repository-url]
cd meza-app
```

## 2. 依存関係のインストール

```bash
npm install
# または
yarn install
```

## 3. 環境変数の設定

### 環境ファイルの作成
```bash
cp .env.example .env.local
```

### 必要な環境変数

#### Supabase設定
1. [Supabase](https://supabase.com) でプロジェクトを作成
2. プロジェクト設定から以下を取得：
   - `NEXT_PUBLIC_SUPABASE_URL`: プロジェクトURL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 公開 (anon) キー
   - `SUPABASE_SERVICE_ROLE_KEY`: サービスロールキー

#### Stripe設定
1. [Stripe](https://stripe.com) でアカウントを作成
2. ダッシュボードから以下を取得：
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: 公開可能キー
   - `STRIPE_SECRET_KEY`: シークレットキー
   - `STRIPE_WEBHOOK_SECRET`: Webhook エンドポイントシークレット

#### VAPID設定 (Push通知用)
```bash
npx web-push generate-vapid-keys
```
生成されたキーを環境変数に設定：
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: 公開キー
- `VAPID_PRIVATE_KEY`: 秘密キー

## 4. データベースセットアップ

### Supabaseでのセットアップ
1. Supabase ダッシュボードで SQL エディタを開く
2. `setup-supabase-unified.sql` の内容を実行
   ```sql
   -- PostGIS拡張の有効化やテーブル作成など
   ```

### ローカル開発用（オプション）
```bash
# Supabase CLI のインストール
npm install -g @supabase/cli

# ローカル開発環境の起動
supabase start

# データベーススキーマの適用
supabase db reset
```

## 5. Stripe Webhook の設定

### 開発環境
```bash
# Stripe CLI のインストール
# https://stripe.com/docs/stripe-cli

# Webhookの転送開始
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### プロダクション環境
1. Stripe ダッシュボードで Webhook エンドポイントを作成
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. イベント選択:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 6. アプリケーションの起動

### 開発モード
```bash
npm run dev
# または
yarn dev
```

### モバイルデバイスでの開発
```bash
npm run mobile
# または
yarn mobile
```

アプリケーションは http://localhost:3000 で起動します。

## 7. プロダクション デプロイ

### Vercel でのデプロイ（推奨）
1. GitHub リポジトリにコードをプッシュ
2. [Vercel](https://vercel.com) にログイン
3. プロジェクトをインポート
4. 環境変数を設定
5. デプロイ

### 環境変数設定（プロダクション）
- `NEXT_PUBLIC_BASE_URL`: 本番ドメイン（例: https://meza-app.vercel.app）
- その他の環境変数も適切な本番用の値に設定

## 8. 追加設定

### PWA設定
- `public/manifest.json` でアプリ名やアイコンをカスタマイズ
- `public/sw.js` でサービスワーカーを設定済み

### Analytics設定（オプション）
- Google Analytics ID を環境変数に設定
- Sentry DSN を設定してエラートラッキングを有効化

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数が正しく設定されているか確認
   - Supabaseプロジェクトが起動状態か確認

2. **Stripe決済エラー**
   - Webhook URL が正しく設定されているか確認
   - テストモードと本番モードのキーが一致しているか確認

3. **位置情報が取得できない**
   - HTTPS接続が必要（本番環境）
   - ブラウザの位置情報許可を確認

4. **Push通知が動作しない**
   - VAPID キーが正しく生成・設定されているか確認
   - サービスワーカーが登録されているか確認

### ログ確認
```bash
# 開発環境でのログ確認
npm run dev

# プロダクション環境（Vercel）
vercel logs [deployment-url]
```

## 開発ガイドライン

### ディレクトリ構造
```
src/
├── app/                 # Next.js App Router ページ
├── components/          # React コンポーネント
├── lib/                 # ユーティリティとライブラリ
├── types/              # TypeScript 型定義
└── styles/             # CSS ファイル
```

### コーディング規約
- TypeScript の使用を推奨
- ESLint と Prettier の設定に従う
- コンポーネントは再利用可能な形で作成
- API ルートにはエラーハンドリングを実装

## サポート

問題が発生した場合は、以下をご確認ください：
1. このドキュメントの内容
2. 環境変数の設定
3. ログファイルのエラーメッセージ

追加のサポートが必要な場合は、開発チームにお問い合わせください。