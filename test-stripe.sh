#!/bin/bash

# 🏦 Stripe CLI Complete Test Suite
# Mezaアプリのペイメント機能完全テスト

echo "🚀 Stripe CLI テストスイートを開始します..."

# 色付きログ用の関数
log_success() { echo "✅ $1"; }
log_info() { echo "ℹ️  $1"; }
log_error() { echo "❌ $1"; }

# 1. Stripe CLI接続確認
log_info "Stripe CLI接続確認中..."
if stripe config --list > /dev/null 2>&1; then
    log_success "Stripe CLI接続OK"
else
    log_error "Stripe CLIにログインしてください: stripe login"
    exit 1
fi

# 2. 開発サーバー確認
log_info "開発サーバー確認中..."
if curl -s http://localhost:3000 > /dev/null; then
    log_success "開発サーバー稼働中 (localhost:3000)"
else
    log_error "開発サーバーを起動してください: npm run dev"
    exit 1
fi

# 3. 製品・価格確認
log_info "Stripe製品確認中..."
PRODUCTS=$(stripe products list --limit 1)
if echo "$PRODUCTS" | grep -q "Meza Challenge Penalty"; then
    log_success "製品「Meza Challenge Penalty」確認済み"
else
    log_info "製品を作成します..."
    stripe products create --name="Meza Challenge Penalty" --description="Penalty payment for failed challenges"
    log_success "製品作成完了"
fi

# 4. Webhookリスニング開始（バックグラウンド）
log_info "Webhookリスニング開始..."
stripe listen --forward-to localhost:3000/api/webhooks/stripe > /tmp/stripe-listen.log 2>&1 &
WEBHOOK_PID=$!
sleep 2
log_success "Webhook転送開始 (PID: $WEBHOOK_PID)"

# 5. テストイベント送信
log_info "テストイベント送信開始..."

echo "📋 テスト1: 支払い成功"
stripe trigger payment_intent.succeeded
sleep 1

echo "📋 テスト2: 顧客作成"
stripe trigger customer.created
sleep 1

echo "📋 テスト3: 支払い失敗"
stripe trigger payment_intent.payment_failed
sleep 1

echo "📋 テスト4: Checkout完了"
stripe trigger checkout.session.completed
sleep 1

echo "📋 テスト5: 請求書支払い成功"
stripe trigger invoice.payment_succeeded
sleep 1

# 6. ログ確認
log_info "Webhookログ確認中..."
if [ -f /tmp/stripe-listen.log ]; then
    echo "=== Webhook Log (最新10行) ==="
    tail -10 /tmp/stripe-listen.log
    echo "=========================="
fi

# 7. リアルタイムログ表示オプション
echo ""
echo "🔍 リアルタイムでWebhookログを監視するには:"
echo "   stripe logs tail"
echo ""
echo "🧪 手動でイベントをテストするには:"
echo "   stripe trigger payment_intent.succeeded"
echo "   stripe trigger customer.created"
echo "   stripe trigger checkout.session.completed"
echo ""
echo "🛑 Webhookリスニングを停止するには:"
echo "   kill $WEBHOOK_PID"
echo ""

log_success "Stripeテストスイート完了！"

# Webhookプロセスをバックグラウンドで継続
echo "📡 Webhookリスニングは継続中です (PID: $WEBHOOK_PID)"
echo "   停止するには: kill $WEBHOOK_PID"