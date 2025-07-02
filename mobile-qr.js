const qrcode = require('qrcode-terminal');
const { execSync } = require('child_process');

// ローカルIPアドレスを取得
function getLocalIP() {
  try {
    const result = execSync('ifconfig | grep "inet " | grep -v 127.0.0.1', { encoding: 'utf8' });
    const match = result.match(/inet (\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : '10.0.86.219';
  } catch (error) {
    return '10.0.86.219'; // フォールバック
  }
}

const localIP = getLocalIP();
const port = process.env.PORT || 3000;
const mobileURL = `http://${localIP}:${port}`;

console.log('\n🚀 Mezaアプリがモバイルでテスト可能になりました！\n');
console.log('📱 モバイルデバイスでの接続方法：\n');
console.log('1. モバイルデバイスとPCが同じWi-Fiに接続されていることを確認');
console.log('2. 下記QRコードをモバイルカメラでスキャン');
console.log('3. または、ブラウザで以下のURLにアクセス：');
console.log(`   ${mobileURL}\n`);

// QRコードを表示
qrcode.generate(mobileURL, { small: true }, (qr) => {
  console.log('📲 QRコード:\n');
  console.log(qr);
  console.log('\n✨ PWA機能でホーム画面にインストール可能！');
  console.log('💡 iOS: Safari「共有」→「ホーム画面に追加」');
  console.log('💡 Android: Chrome「メニュー」→「ホーム画面に追加」\n');
});

module.exports = { mobileURL }; 