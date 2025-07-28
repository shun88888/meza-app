# 💳 カード登録完全ガイド

MezaアプリでのStripe Elements を使用した安全なカード登録機能

## ✅ 実装内容

### 🔒 **セキュリティ改善**
- ❌ 生のカード情報をサーバーに送信しない
- ✅ Stripe Elements による安全な入力フォーム
- ✅ PCI DSS 準拠のカード情報処理
- ✅ PaymentMethod API 使用

### 🗑️ **削除された機能**
- ❌ テストカード登録ボタン
- ❌ 開発用ダミーカード機能
- ❌ 生カード情報の直接送信

### 🔧 **新しい実装**
- ✅ `StripeCardForm` コンポーネント
- ✅ Stripe Elements 統合
- ✅ PaymentMethod ベース API
- ✅ 顧客管理とカードアタッチ

## 🧪 テスト方法

### 1. 開発サーバー起動

```bash
npm run dev
# アクセス: http://localhost:3000
```

### 2. ユーザー登録・ログイン

1. サインアップまたはログイン
2. 設定ページに移動: `/settings`
3. 「決済方法」を選択

### 3. カード登録テスト

**URL**: `http://localhost:3000/settings/payment/add`

#### Stripeテストカード番号

| カードブランド | カード番号 | CVC | 有効期限 |
|------------|----------|-----|---------|
| **Visa** | `4242424242424242` | `123` | `12/25` |
| **Visa (拒否)** | `4000000000000002` | `123` | `12/25` |
| **Mastercard** | `5555555555554444` | `123` | `12/25` |
| **JCB** | `3530111333300000` | `1234` | `12/25` |
| **American Express** | `378282246310005` | `1234` | `12/25` |

#### テスト手順

1. **カード名義人**: `YAMADA TARO`
2. **カード情報**: 上記のテストカード番号を入力
3. **登録ボタン**をクリック
4. Stripe による処理を待機
5. 成功時は自動的に決済設定ページに戻る

### 4. 登録確認

- 設定ページで登録されたカードを確認
- カード下4桁とブランドが表示される
- 削除機能も動作確認

## 🔍 動作確認ポイント

### フロントエンド
- [ ] Stripe Elements が正常に表示される
- [ ] リアルタイムでカード情報バリデーション
- [ ] エラーメッセージが適切に表示
- [ ] 成功時にリダイレクトされる

### バックエンド
- [ ] PaymentMethod が Stripe で作成される
- [ ] 顧客が作成またはリンクされる
- [ ] Supabase にカード情報が保存される
- [ ] エラー時の適切なロールバック

### Stripe Dashboard
- [ ] PaymentMethod が作成されている
- [ ] Customer が作成されている
- [ ] PaymentMethod が Customer にアタッチされている

## 🚨 エラーケースのテスト

### 1. 無効なカード番号

```
カード番号: 4000000000000002
結果: "Your card was declined."
```

### 2. 期限切れカード

```
カード番号: 4000000000000069
結果: "Your card has expired."
```

### 3. CVCエラー

```
カード番号: 4000000000000127
結果: "Your card's security code is incorrect."
```

### 4. 残高不足

```
カード番号: 4000000000009995
結果: "Your card has insufficient funds."
```

## 🔧 開発者向けデバッグ

### ログ確認

```bash
# 開発サーバーのログを監視
npm run dev

# Stripeイベントログを監視
stripe logs tail
```

### Webhook テスト

```bash
# Webhook リスニング開始
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# PaymentMethod作成イベントをトリガー
stripe trigger payment_method.attached
```

### API テスト

```bash
# PaymentMethod 一覧取得
curl -H "Authorization: Bearer $(stripe auth --print-access-token)" \
  https://api.stripe.com/v1/payment_methods

# Customer 一覧取得
stripe customers list --limit 5
```

## 🎯 実際の使用フロー

### ユーザー視点
1. アプリにログイン
2. 設定 → 決済方法
3. カード追加
4. 安全なカード情報入力
5. 登録完了

### システム処理
1. Stripe Elements でカード情報収集
2. PaymentMethod 作成
3. Customer 作成/取得
4. PaymentMethod アタッチ
5. Supabase 保存
6. UI 更新

## 📚 参考リンク

- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [PaymentMethod API](https://stripe.com/docs/api/payment_methods)
- [React Stripe.js](https://github.com/stripe/react-stripe-js)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

これで本格的なカード登録機能が完成しました！ 🎉