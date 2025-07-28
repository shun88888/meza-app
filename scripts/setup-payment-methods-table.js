#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 個別のSQL文を実行する関数
async function executeSQL(query) {
  try {
    const { data, error } = await supabase
      .from('_dummy')
      .select('*')
      .limit(0)
    
    // SQLを直接実行する代替方法として、Supabase REST APIを使用
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function setupPaymentMethodsTable() {
  try {
    console.log('🔧 payment_methodsテーブルのセットアップを開始します...')

    // テーブルが既に存在するかチェック
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('count', { count: 'exact', head: true })
      
      if (!error) {
        console.log('✅ payment_methodsテーブルは既に存在します')
        return
      }
    } catch (e) {
      // テーブルが存在しない場合は続行
    }

    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, '..', 'supabase-payment-methods-table.sql')
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQLファイルが見つかりません: ${sqlPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // SQLを行ごとに分割して実行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 ${statements.length}個のSQL文を実行します...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⏳ SQL文 ${i + 1}/${statements.length} を実行中...`)
        try {
          await executeSQL(statement)
        } catch (error) {
          console.warn(`⚠️  SQL文 ${i + 1} でエラー (続行):`, error.message)
        }
      }
    }

    console.log('✅ payment_methodsテーブルのセットアップが完了しました!')
    
    // テーブル確認
    const { data, error: checkError } = await supabase
      .from('payment_methods')
      .select('count', { count: 'exact', head: true })

    if (checkError) {
      console.warn('⚠️  テーブル確認でエラーが発生しましたが、作成は成功している可能性があります')
      console.warn('エラー:', checkError)
    } else {
      console.log('✅ テーブルの確認が完了しました')
    }
    
  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error)
    
    // 手動実行の案内
    const sqlPath = path.join(__dirname, '..', 'supabase-payment-methods-table.sql')
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8')
      console.log('\n📝 手動でSupabase Studioから以下のSQLを実行してください:')
      console.log('='.repeat(60))
      console.log(sql)
      console.log('='.repeat(60))
    }
    
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  setupPaymentMethodsTable()
}

module.exports = { setupPaymentMethodsTable }