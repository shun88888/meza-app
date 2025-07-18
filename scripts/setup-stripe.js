#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Stripe決済機能 - 完全自動セットアップ');
console.log('==========================================\n');

// 色付きログ関数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 環境変数チェック
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('❌ .env.localファイルが見つかりません', 'red');
    log('📋 env-template.txtをコピーしています...', 'yellow');
    
    const templatePath = path.join(process.cwd(), 'env-template.txt');
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, envPath);
      log('✅ .env.localファイルを作成しました', 'green');
    } else {
      log('❌ env-template.txtが見つかりません', 'red');
      process.exit(1);
    }
  }
  return envPath;
}

// Stripe CLIのインストール確認
function checkStripeCLI() {
  try {
    execSync('stripe --version', { stdio: 'pipe' });
    log('✅ Stripe CLI が既にインストールされています', 'green');
    return true;
  } catch (error) {
    log('❌ Stripe CLI がインストールされていません', 'red');
    return false;
  }
}

// Stripe CLIのインストール
function installStripeCLI() {
  log('📦 Stripe CLI をインストールしています...', 'blue');
  
  try {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      // macOS
      execSync('brew install stripe/stripe-cli/stripe', { stdio: 'inherit' });
    } else if (platform === 'linux') {
      // Linux
      execSync('curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg', { stdio: 'inherit' });
      execSync('echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list', { stdio: 'inherit' });
      execSync('sudo apt update && sudo apt install stripe', { stdio: 'inherit' });
    } else {
      log('❌ このプラットフォームではStripe CLIの自動インストールをサポートしていません', 'red');
      log('📋 手動でインストールしてください: https://stripe.com/docs/stripe-cli#install', 'yellow');
      process.exit(1);
    }
    
    log('✅ Stripe CLI のインストールが完了しました', 'green');
    return true;
  } catch (error) {
    log('❌ Stripe CLI のインストールに失敗しました', 'red');
    log('📋 手動でインストールしてください: https://stripe.com/docs/stripe-cli#install', 'yellow');
    return false;
  }
}

// Stripe APIキーの検証
function validateStripeKeys(publishableKey, secretKey) {
  if (!publishableKey || !secretKey) {
    return false;
  }
  
  if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
    return false;
  }
  
  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    return false;
  }
  
  // Test/Live mode consistency check
  const isPublishableTest = publishableKey.startsWith('pk_test_');
  const isSecretTest = secretKey.startsWith('sk_test_');
  
  if (isPublishableTest !== isSecretTest) {
    return false;
  }
  
  return true;
}

// キーの種類を判定
function getKeyMode(key) {
  if (key.startsWith('pk_test_') || key.startsWith('sk_test_')) {
    return 'test';
  } else if (key.startsWith('pk_live_') || key.startsWith('sk_live_')) {
    return 'live';
  }
  return 'unknown';
}

// 環境変数の更新
function updateEnvFile(envPath, updates) {
  let content = fs.readFileSync(envPath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, content);
}

// Stripe Webhookセットアップ
async function setupWebhook(secretKey) {
  log('🔗 Stripe Webhook を設定しています...', 'blue');
  
  try {
    // Stripe CLIでログイン
    log('📋 Stripe CLI でログインしています...', 'yellow');
    execSync(`stripe login --api-key ${secretKey}`, { stdio: 'inherit' });
    
    // Webhook リスナーを開始（バックグラウンド）
    log('🎧 Webhook リスナーを開始しています...', 'yellow');
    log('📋 別のターミナルで以下のコマンドを実行してください:', 'cyan');
    log('stripe listen --forward-to localhost:3000/api/webhooks/stripe', 'magenta');
    
    const webhookSecret = await question('Webhook Secret (whsec_で始まる文字列) を入力してください: ');
    
    if (!webhookSecret.startsWith('whsec_')) {
      log('❌ 無効なWebhook Secretです', 'red');
      return null;
    }
    
    log('✅ Webhook Secret を取得しました', 'green');
    return webhookSecret;
    
  } catch (error) {
    log('❌ Webhook設定に失敗しました', 'red');
    console.error(error);
    return null;
  }
}

// 決済テスト
async function testPayment() {
  log('🧪 決済機能をテストしています...', 'blue');
  
  try {
    // 開発サーバーが起動しているかチェック
    const response = await fetch('http://localhost:3000/api/setup-payment-method', {
      method: 'HEAD'
    }).catch(() => null);
    
    if (!response) {
      log('❌ 開発サーバーが起動していません', 'red');
      log('📋 別のターミナルで npm run dev を実行してください', 'yellow');
      return false;
    }
    
    log('✅ 開発サーバーが起動しています', 'green');
    log('🌐 ブラウザで http://localhost:3000 にアクセスしてテストしてください', 'cyan');
    
    // テストカード情報を表示
    log('\n💳 テスト用カード情報:', 'yellow');
    log('カード番号: 4242 4242 4242 4242', 'cyan');
    log('有効期限: 12/34', 'cyan');
    log('CVC: 123', 'cyan');
    log('郵便番号: 12345', 'cyan');
    
    return true;
    
  } catch (error) {
    log('❌ テストに失敗しました', 'red');
    console.error(error);
    return false;
  }
}

// メイン処理
async function main() {
  try {
    // 1. 環境ファイルチェック
    log('📋 Step 1: 環境ファイルをチェックしています...', 'blue');
    const envPath = checkEnvFile();
    
    // 2. Stripe CLIチェック
    log('\n📋 Step 2: Stripe CLI をチェックしています...', 'blue');
    if (!checkStripeCLI()) {
      const install = await question('Stripe CLI をインストールしますか？ (y/n): ');
      if (install.toLowerCase() === 'y') {
        if (!installStripeCLI()) {
          process.exit(1);
        }
      } else {
        log('❌ Stripe CLI が必要です', 'red');
        process.exit(1);
      }
    }
    
    // 3. Stripe キー設定
    log('\n📋 Step 3: Stripe API キーを設定しています...', 'blue');
    
    // 環境選択
    log('🔧 Stripe環境を選択してください:', 'yellow');
    log('1. テスト環境 (pk_test_... / sk_test_...) - 開発・テスト用', 'cyan');
    log('2. 本番環境 (pk_live_... / sk_live_...) - 実際のサービス運用', 'cyan');
    
    const envChoice = await question('環境を選択してください (1: テスト, 2: 本番): ');
    const isTestMode = envChoice === '1';
    
    if (isTestMode) {
      log('🧪 テスト環境を選択しました', 'blue');
      log('📋 Stripe Dashboard で「テストデータを表示」をONにしてください', 'yellow');
      log('🔗 https://dashboard.stripe.com/test/apikeys', 'cyan');
    } else {
      log('🚀 本番環境を選択しました', 'blue');
      log('⚠️  実際の決済が発生します！', 'red');
      log('📋 Stripe Dashboard で「本番データを表示」をONにしてください', 'yellow');
      log('🔗 https://dashboard.stripe.com/apikeys', 'cyan');
    }
    
    // 現在の環境変数を読み込み
    const envContent = fs.readFileSync(envPath, 'utf8');
    const currentPublishableKey = envContent.match(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(.+)/)?.[1];
    const currentSecretKey = envContent.match(/STRIPE_SECRET_KEY=(.+)/)?.[1];
    
    if (!validateStripeKeys(currentPublishableKey, currentSecretKey)) {
      log('❌ Stripe キーが設定されていません', 'red');
      
      const expectedPrefix = isTestMode ? 'pk_test_' : 'pk_live_';
      const expectedSecretPrefix = isTestMode ? 'sk_test_' : 'sk_live_';
      
      const publishableKey = await question(`公開可能キー (${expectedPrefix}で始まる): `);
      const secretKey = await question(`シークレットキー (${expectedSecretPrefix}で始まる): `);
      
      if (!validateStripeKeys(publishableKey, secretKey)) {
        log('❌ 無効なStripe キーです', 'red');
        process.exit(1);
      }
      
      const keyMode = getKeyMode(publishableKey);
      if ((isTestMode && keyMode !== 'test') || (!isTestMode && keyMode !== 'live')) {
        log(`❌ 選択した環境と異なるキーです (選択: ${isTestMode ? 'テスト' : '本番'}, キー: ${keyMode})`, 'red');
        process.exit(1);
      }
      
      // 環境変数を更新
      updateEnvFile(envPath, {
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': publishableKey,
        'STRIPE_SECRET_KEY': secretKey
      });
      
      log(`✅ ${isTestMode ? 'テスト' : '本番'}環境のStripe キーを設定しました`, 'green');
    } else {
      const keyMode = getKeyMode(currentPublishableKey);
      log(`✅ Stripe キーは既に設定されています (${keyMode}環境)`, 'green');
    }
    
    // 4. Webhook設定
    log('\n📋 Step 4: Webhook を設定しています...', 'blue');
    const webhookSecret = await setupWebhook(currentSecretKey || secretKey);
    
    if (webhookSecret) {
      updateEnvFile(envPath, {
        'STRIPE_WEBHOOK_SECRET': webhookSecret
      });
      log('✅ Webhook Secret を設定しました', 'green');
    }
    
    // 5. テスト実行
    log('\n📋 Step 5: 決済機能をテストしています...', 'blue');
    await testPayment();
    
    // 完了メッセージ
    log('\n🎉 Stripe決済機能のセットアップが完了しました！', 'green');
    log('==========================================', 'green');
    log('📋 次のステップ:', 'yellow');
    log('1. npm run dev でサーバーを起動', 'cyan');
    log('2. ブラウザで http://localhost:3000 にアクセス', 'cyan');
    log('3. ユーザー登録後、プロフィール → 支払い方法でカード登録', 'cyan');
    log('4. チャレンジを作成してテスト', 'cyan');
    log('\n💳 テスト用カード: 4242 4242 4242 4242', 'magenta');
    
  } catch (error) {
    log('❌ セットアップに失敗しました', 'red');
    console.error(error);
  } finally {
    rl.close();
  }
}

// 実行
if (require.main === module) {
  main();
}

module.exports = { main }; 