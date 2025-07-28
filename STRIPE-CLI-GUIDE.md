# 🏦 Stripe CLI完全ガイド

MezaアプリでのStripe CLIを使用したペイメント機能のテスト方法

## 📋 前提条件

1. **Stripe CLIインストール済み** ✅
   ```bash
   stripe --version  # 1.28.0
   ```

2. **Stripeアカウント設定**
   - Stripe Dashboard にアクセス
   - テストキーを取得
   - `.env.local`に設定

## 🚀 セットアップ手順

### 1. Stripeにログイン

```bash
stripe login
```

ブラウザが開き、Stripeアカウントで認証を行います。

### 2. プロダクトとプライス作成

```bash
# チャレンジペナルティ用プロダクト作成
stripe products create \
  --name="Meza Challenge Penalty" \
  --description="Penalty payment for failed challenges"

# プライス作成（例：500円）
stripe prices create \
  --unit-amount=500 \
  --currency=jpy \
  --product="prod_XXXXXXXXXX"
```

### 3. Webhook転送開始

```bash
# 開発サーバーにWebhookイベントを転送
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

出力例：
```bash
Ready! Your webhook signing secret is 'whsec_1234567890abcdef' (^C to quit)
```

この`whsec_`で始まる署名シークレットを`.env.local`にコピー：
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
```

## 🧪 テスト手順

### NPMスクリプトを使用

```bash
# Webhookリスニング開始
npm run stripe:listen

# 別ターミナルで開発サーバー起動
npm run dev

# 別ターミナルでテストイベント送信
npm run stripe:test
```

### 手動テスト

```bash
# 1. 支払い成功イベントをトリガー
stripe trigger payment_intent.succeeded

# 2. 支払い失敗イベントをトリガー
stripe trigger payment_intent.payment_failed

# 3. Checkoutセッション完了をトリガー
stripe trigger checkout.session.completed

# 4. 顧客作成をトリガー
stripe trigger customer.created
```

## 📊 ログ監視

リアルタイムでStripeイベントを監視：

```bash
stripe logs tail
```

出力例：
```bash
> POST /v1/payment_intents [200]
> POST /webhooks [200] 1.23s
```

## 🔧 カスタムイベント

特定のイベントのみを転送：

```bash
stripe listen \
  --events payment_intent.succeeded,payment_intent.payment_failed,customer.created \
  --forward-to localhost:3001/api/webhooks/stripe
```

## 🎯 Mezaアプリでのテストフロー

### 1. カード登録テスト

```bash
# 開発サーバーでカード登録
# → http://localhost:3001/settings/payment/add

# テストカード番号を使用：
# VISA: 4242424242424242
# Mastercard: 5555555555554444
# JCB: 3530111333300000
```

### 2. ペナルティ支払いテスト

```bash
# チャレンジ失敗時の支払いをシミュレート
stripe trigger payment_intent.succeeded \
  --add payment_intent:metadata.challengeId=challenge_123 \
  --add payment_intent:metadata.userId=user_456
```

### 3. Webhook受信確認

Stripe CLIの出力で確認：
```bash
2024-07-28 13:00:00  --> payment_intent.succeeded [evt_1234567890]
2024-07-28 13:00:01   POST http://localhost:3001/api/webhooks/stripe [200]
```

アプリのログで確認：
```bash
Payment succeeded: pi_1234567890
Challenge challenge_123 marked as failed due to penalty payment
```

## 🔍 トラブルシューティング

### Webhook署名エラー

```bash
# 新しい署名シークレットを取得
stripe listen --print-secret

# .env.localを更新
STRIPE_WEBHOOK_SECRET=whsec_新しいシークレット
```

### 接続エラー

```bash
# Stripeログイン状態確認
stripe config --list

# 再ログイン
stripe logout
stripe login
```

### ポートエラー

```bash
# 別ポートで転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📝 実用的なテストシナリオ

### シナリオ1: 正常な支払いフロー

1. カード登録
2. チャレンジ作成
3. チャレンジ失敗
4. ペナルティ支払い実行
5. Webhook受信確認

### シナリオ2: 支払い失敗フロー

1. 無効なカードで支払い試行
2. `payment_intent.payment_failed`トリガー
3. エラーハンドリング確認

### シナリオ3: カード管理

1. 複数カード登録
2. デフォルトカード設定
3. カード削除
4. Stripeダッシュボードで確認

## 🎉 成功の確認方法

- ✅ Stripe Dashboard でイベント確認
- ✅ アプリログでWebhook処理確認
- ✅ Supabaseデータベースで状態更新確認
- ✅ フロントエンドでUI状態確認

これでStripe CLIを使った完全なペイメント機能のテストが可能です！