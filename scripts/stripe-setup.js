#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🏦 Stripe CLI セットアップを開始します...')

// 環境変数チェック
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY が設定されていません')
  console.log('💡 .env.localに以下を追加してください:')
  console.log('STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key')
  process.exit(1)
}

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey.startsWith('sk_test_')) {
  console.error('❌ テスト環境のStripeキーを使用してください (sk_test_で始まる)')
  process.exit(1)
}

try {
  // Stripe CLIのバージョンチェック
  console.log('🔍 Stripe CLIバージョンチェック中...')
  const version = execSync('stripe --version', { encoding: 'utf8' }).trim()
  console.log(`✅ Stripe CLI: ${version}`)

  // プロダクトとプライスの作成
  console.log('🛍️ テストプロダクトを作成中...')
  
  // プロダクト作成
  const productResult = execSync(`stripe products create \\
    --name="Meza Challenge Penalty" \\
    --description="Penalty payment for failed challenges"`, 
    { encoding: 'utf8' }
  )
  
  const product = JSON.parse(productResult)
  console.log(`✅ プロダクト作成完了: ${product.id}`)

  // プライス作成（100円）
  const priceResult = execSync(`stripe prices create \\
    --unit-amount=100 \\
    --currency=jpy \\
    --product="${product.id}"`, 
    { encoding: 'utf8' }
  )
  
  const price = JSON.parse(priceResult)
  console.log(`✅ プライス作成完了: ${price.id} (¥100)`)

  // 設定ファイルを更新
  const envPath = path.join(__dirname, '..', '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  // Stripeプロダクト/プライスIDを追加
  if (!envContent.includes('STRIPE_PRODUCT_ID=')) {
    envContent += `\n# Stripe Test Product\nSTRIPE_PRODUCT_ID=${product.id}\nSTRIPE_PRICE_ID=${price.id}\n`
    fs.writeFileSync(envPath, envContent)
    console.log('✅ .env.localを更新しました')
  }

  // Webhook設定情報を表示
  console.log('\n🔗 Webhook転送を開始するには:')
  console.log('stripe listen --forward-to localhost:3001/api/webhooks/stripe')
  console.log('\n🧪 テストイベントをトリガーするには:')
  console.log('stripe trigger payment_intent.succeeded')
  console.log('stripe trigger checkout.session.completed')

  console.log('\n✅ Stripe CLIセットアップが完了しました！')

} catch (error) {
  console.error('❌ エラーが発生しました:', error.message)
  
  // 手動セットアップ手順を表示
  console.log('\n📝 手動でセットアップするには:')
  console.log('1. stripe login')
  console.log('2. stripe products create --name="Meza Challenge Penalty"')
  console.log('3. stripe prices create --unit-amount=100 --currency=jpy --product=PRODUCT_ID')
  console.log('4. stripe listen --forward-to localhost:3001/api/webhooks/stripe')
  
  process.exit(1)
}