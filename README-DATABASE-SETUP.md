# 🚀 全自動データベースセットアップガイド

このガイドでは、Supabaseでテーブルを完全自動で作成・管理する方法を説明します。

## 📋 必要な準備

### 1. 環境変数の設定

`.env.local`に以下を設定：

```bash
# 必須
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# オプション（CLI使用時に必要）
SUPABASE_ACCESS_TOKEN=your_access_token
```

### 2. Supabase CLIの準備（オプション）

```bash
# グローバルインストール
npm install -g supabase

# または、プロジェクト内で使用
npx supabase --version
```

## 🔧 自動セットアップの方法

### 方法1: NPMスクリプト（推奨）

```bash
# 全自動でデータベースをセットアップ
npm run db:setup

# マイグレーションのみ実行
npm run db:migrate

# データベースリセット
npm run db:reset

# TypeScript型定義生成
npm run db:types
```

### 方法2: アプリ起動時自動実行

アプリを起動すると自動でテーブル作成を試行：

```bash
npm run dev
```

### 方法3: 手動スクリプト実行

```bash
node scripts/setup-database-auto.js
```

## 📁 ファイル構成

```
project/
├── supabase/
│   ├── config.toml          # Supabaseプロジェクト設定
│   └── migrations/          # マイグレーションファイル
│       └── 001_create_payment_methods.sql
├── scripts/
│   └── setup-database-auto.js  # 自動セットアップスクリプト
├── src/lib/
│   └── setup-database.ts    # ランタイム自動セットアップ
└── .env.example             # 環境変数テンプレート
```

## 🛠️ 新しいテーブルの追加方法

### 1. マイグレーションファイル作成

`supabase/migrations/002_create_new_table.sql`:

```sql
-- 新しいテーブル作成
CREATE TABLE IF NOT EXISTS new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view own records" ON new_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON new_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. 自動実行

```bash
npm run db:setup
```

## 🔄 動作フロー

1. **環境変数チェック**: 必要な変数が設定されているか確認
2. **Supabase CLI認証**: アクセストークンでログイン
3. **プロジェクトリンク**: ローカルとリモートを接続
4. **マイグレーション実行**: SQLファイルを順次実行
5. **フォールバック**: CLI失敗時は直接API実行
6. **確認**: テーブル作成の成功を確認

## ⚠️ トラブルシューティング

### CLI認証エラー

```bash
# 手動ログイン
npx supabase auth login

# プロジェクトリンク確認
npx supabase projects list
npx supabase link --project-ref your-project-ref
```

### 権限エラー

- `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認
- Supabaseダッシュボードでservice_roleキーを再生成

### マイグレーションエラー

```bash
# ローカルSupabaseリセット
npx supabase db reset

# リモートに強制プッシュ
npx supabase db push --force
```

## 🚀 本番環境での使用

### CI/CDパイプライン

```yaml
# .github/workflows/deploy.yml
- name: Setup Database
  run: npm run db:setup
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Vercel Deployment

環境変数を設定して：

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_ACCESS_TOKEN
```

## 📚 参考リンク

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

これで新しいテーブル作成は完全に自動化されます！ 🎉