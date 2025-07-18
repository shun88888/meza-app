#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Webhook Secret を環境変数に追加
function addWebhookSecret(webhookSecret) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local ファイルが見つかりません', 'red');
    return false;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  
  // 既存のWebhook Secretを削除
  content = content.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, '');
  
  // 新しいWebhook Secretを追加
  if (!content.endsWith('\n')) {
    content += '\n';
  }
  content += `STRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
  
  fs.writeFileSync(envPath, content);
  log('✅ Webhook Secret を .env.local に追加しました', 'green');
  return true;
}

// Stripe CLI でWebhook Secret を取得
function getWebhookSecret() {
  return new Promise((resolve, reject) => {
    log('🔗 Stripe Webhook Secret を取得しています...', 'blue');
    
    const stripeProcess = spawn('stripe', ['listen', '--forward-to', 'localhost:3000/api/webhooks/stripe'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let webhookSecret = null;
    let timeout = null;

    // 10秒でタイムアウト
    timeout = setTimeout(() => {
      stripeProcess.kill();
      reject(new Error('Webhook Secret の取得がタイムアウトしました'));
    }, 10000);

    stripeProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log(`📡 Stripe CLI: ${output.trim()}`, 'cyan');
      
      // Webhook Secret を抽出
      const match = output.match(/whsec_[a-zA-Z0-9_]+/);
      if (match && !webhookSecret) {
        webhookSecret = match[0];
        clearTimeout(timeout);
        stripeProcess.kill();
        resolve(webhookSecret);
      }
    });

    stripeProcess.stderr.on('data', (data) => {
      const error = data.toString();
      log(`⚠️ Stripe CLI Error: ${error.trim()}`, 'yellow');
      
      // Webhook Secret がエラー出力にある場合もある
      const match = error.match(/whsec_[a-zA-Z0-9_]+/);
      if (match && !webhookSecret) {
        webhookSecret = match[0];
        clearTimeout(timeout);
        stripeProcess.kill();
        resolve(webhookSecret);
      }
    });

    stripeProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (!webhookSecret) {
        reject(new Error(`Stripe CLI が終了しました (code: ${code})`));
      }
    });
  });
}

// Webhook のテスト
async function testWebhook() {
  log('🧪 Webhook をテストしています...', 'blue');
  
  try {
    // 開発サーバーが起動しているかチェック
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test'
      },
      body: JSON.stringify({ type: 'test' })
    }).catch(() => null);

    if (!response) {
      log('❌ 開発サーバーが起動していません', 'red');
      log('📋 別のターミナルで npm run dev を実行してください', 'yellow');
      return false;
    }

    log('✅ Webhook エンドポイントにアクセス可能です', 'green');
    return true;
  } catch (error) {
    log(`❌ Webhook テストに失敗しました: ${error.message}`, 'red');
    return false;
  }
}

// メイン処理
async function main() {
  try {
    log('🚀 Stripe Webhook 自動セットアップ開始', 'blue');
    log('==========================================\n', 'blue');

    // 1. Stripe CLI の確認
    try {
      execSync('stripe --version', { stdio: 'pipe' });
      log('✅ Stripe CLI が利用可能です', 'green');
    } catch (error) {
      log('❌ Stripe CLI がインストールされていません', 'red');
      log('📋 brew install stripe/stripe-cli/stripe でインストールしてください', 'yellow');
      process.exit(1);
    }

    // 2. Webhook Secret の取得
    let webhookSecret;
    try {
      webhookSecret = await getWebhookSecret();
      log(`✅ Webhook Secret を取得しました: ${webhookSecret}`, 'green');
    } catch (error) {
      log(`❌ Webhook Secret の取得に失敗しました: ${error.message}`, 'red');
      
      // 手動入力にフォールバック
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      log('📋 手動でWebhook Secretを入力してください', 'yellow');
      log('別のターミナルで以下を実行:', 'cyan');
      log('stripe listen --forward-to localhost:3000/api/webhooks/stripe', 'magenta');
      
      webhookSecret = await new Promise(resolve => {
        rl.question('Webhook Secret (whsec_で始まる文字列): ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      
      if (!webhookSecret.startsWith('whsec_')) {
        log('❌ 無効なWebhook Secretです', 'red');
        process.exit(1);
      }
    }

    // 3. 環境変数に追加
    if (!addWebhookSecret(webhookSecret)) {
      process.exit(1);
    }

    // 4. Webhook のテスト
    await testWebhook();

    // 5. 完了メッセージ
    log('\n🎉 Stripe Webhook セットアップが完了しました！', 'green');
    log('==========================================', 'green');
    log('📋 次のステップ:', 'yellow');
    log('1. 開発サーバーを再起動してください: npm run dev', 'cyan');
    log('2. 別のターミナルで Webhook リスナーを起動:', 'cyan');
    log(`   stripe listen --forward-to localhost:3000/api/webhooks/stripe`, 'magenta');
    log('3. ブラウザで決済テストを実行してください', 'cyan');
    log('\n💳 テスト用カード: 4242 4242 4242 4242', 'magenta');

  } catch (error) {
    log(`❌ セットアップに失敗しました: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}

module.exports = { main }; 