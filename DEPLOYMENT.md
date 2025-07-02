# Mezaアプリ デプロイ後チェックリスト

## ✅ 必須確認事項

### 1. Supabase設定
- [ ] データベーステーブルが正常に作成されている
- [ ] RLSポリシーが適用されている
- [ ] PostGIS拡張が有効化されている
- [ ] 認証URLが正しく設定されている

### 2. アプリ機能確認
- [ ] ログイン/ログアウト機能
- [ ] チャレンジ作成機能
- [ ] GPS位置取得機能
- [ ] 地図表示機能
- [ ] カウントダウン機能
- [ ] スライド解除機能

### 3. PWA機能確認
- [ ] マニフェストファイルが正常に読み込まれる
- [ ] Service Workerが動作している
- [ ] ホーム画面に追加可能

### 4. パフォーマンス確認
- [ ] 初期ロード時間 < 3秒
- [ ] 画面遷移がスムーズ
- [ ] モバイルで正常動作

## 🔧 本番環境設定

### 環境変数
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### Supabase認証設定
- Site URL: `https://your-app-name.vercel.app`
- Redirect URLs: `https://your-app-name.vercel.app/auth/callback`

## 🚨 トラブルシューティング

### よくある問題

1. **ログインできない**
   - Supabase認証URLが正しく設定されているか確認
   - 環境変数が正しく設定されているか確認

2. **GPS取得エラー**
   - HTTPSでアクセスしているか確認
   - ブラウザの位置情報許可を確認

3. **地図が表示されない**
   - ページが完全に読み込まれているか確認
   - ブラウザのコンソールエラーを確認

4. **ビルドエラー**
   - 環境変数がすべて設定されているか確認
   - package.jsonの依存関係が正しいか確認

## 📱 モバイル最適化

### iOS Safari
- PWAとしてホーム画面に追加可能
- フルスクリーン表示対応
- タッチジェスチャー対応

### Android Chrome
- PWAインストール可能
- プッシュ通知対応（将来実装）
- オフライン機能（基本的な画面）

## 🔒 セキュリティ

### Supabase RLS
- 全テーブルでRow Level Securityが有効
- ユーザーは自分のデータのみアクセス可能
- 認証されていないユーザーはデータアクセス不可

### Next.js セキュリティ
- CSRF保護
- XSS保護
- セキュアなCookieオプション

## 📊 監視とログ

### Vercel Analytics
- ページビュー監視
- パフォーマンス監視
- エラー監視

### Supabase監視
- データベース接続数
- API呼び出し数
- 認証イベント

## 🚀 スケーリング

### パフォーマンス最適化
- 画像の最適化
- コード分割
- キャッシュ戦略

### 容量管理
- Supabaseの使用量監視
- Vercelの帯域幅監視
- ストレージ使用量確認 