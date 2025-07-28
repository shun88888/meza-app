import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function setupDatabase() {
  if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, skipping database setup')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // テーブルが既に存在するかチェック
    const { data, error } = await supabase
      .from('payment_methods')
      .select('count', { count: 'exact', head: true })
    
    if (!error) {
      console.log('✅ payment_methodsテーブルは既に存在します')
      return true
    }

    console.log('🔧 payment_methodsテーブルを作成中...')

    // テーブル作成SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        last4 VARCHAR(4) NOT NULL,
        brand VARCHAR(50) NOT NULL,
        exp_month INTEGER NOT NULL,
        exp_year INTEGER NOT NULL,
        cardholder_name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // RLS有効化SQL
    const enableRLSSQL = `
      ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
    `

    // RLSポリシーSQL
    const policiesSQL = `
      CREATE POLICY IF NOT EXISTS "Users can view own payment methods" ON payment_methods
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert own payment methods" ON payment_methods
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own payment methods" ON payment_methods
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can delete own payment methods" ON payment_methods
        FOR DELETE USING (auth.uid() = user_id);
    `

    // インデックス作成SQL
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
      CREATE INDEX IF NOT EXISTS payment_methods_created_at_idx ON payment_methods(created_at);
    `

    // SQLを順次実行
    const sqlStatements = [
      createTableSQL,
      enableRLSSQL,
      policiesSQL,
      indexesSQL
    ]

    for (const sql of sqlStatements) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql })
        })

        if (!response.ok) {
          console.warn('⚠️ SQL実行警告:', await response.text())
        }
      } catch (error) {
        console.warn('⚠️ SQL実行エラー (続行):', error)
      }
    }

    // 作成確認
    const { error: checkError } = await supabase
      .from('payment_methods')
      .select('count', { count: 'exact', head: true })

    if (!checkError) {
      console.log('✅ payment_methodsテーブルが正常に作成されました')
      return true
    } else {
      console.error('❌ テーブル作成の確認に失敗:', checkError)
      return false
    }

  } catch (error) {
    console.error('❌ データベースセットアップエラー:', error)
    return false
  }
}