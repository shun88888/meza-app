#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * 全自動データベースセットアップスクリプト
 */

console.log('🚀 Supabase 全自動データベースセットアップを開始します...')

// 環境変数チェック
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  console.error('❌ 必要な環境変数が設定されていません:')
  missingVars.forEach(varName => console.error(`  ${varName}`))
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const projectRef = supabaseUrl.split('//')[1].split('.')[0]

async function setupDatabase() {
  try {
    // 1. Supabase CLIの認証
    console.log('🔐 Supabase CLI認証中...')
    
    // Access tokenを使用してログイン
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN
    if (accessToken) {
      execSync(`npx supabase auth login --token ${accessToken}`, { stdio: 'inherit' })
    } else {
      console.log('⚠️  SUPABASE_ACCESS_TOKENが設定されていません。手動でログインが必要です。')
      execSync('npx supabase auth login', { stdio: 'inherit' })
    }

    // 2. プロジェクトとリンク
    console.log('🔗 プロジェクトとリンク中...')
    execSync(`npx supabase link --project-ref ${projectRef}`, { stdio: 'inherit' })

    // 3. マイグレーションを実行
    console.log('📊 マイグレーションを実行中...')
    execSync('npx supabase db push', { stdio: 'inherit' })

    console.log('✅ データベースセットアップが完了しました！')

  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error.message)
    
    // フォールバック: 直接SQL実行
    console.log('🔄 フォールバック: 直接SQL実行を試行...')
    await fallbackDirectSQL()
  }
}

async function fallbackDirectSQL() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // マイグレーションファイルを読み込んで実行
  const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  if (!fs.existsSync(migrationDir)) {
    console.error('❌ マイグレーションディレクトリが見つかりません')
    return
  }

  const migrationFiles = fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort()

  for (const file of migrationFiles) {
    console.log(`⏳ マイグレーション実行中: ${file}`)
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8')
    
    try {
      // SQLを個別のステートメントに分割
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec', { 
            sql: statement 
          })
          
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️  警告: ${error.message}`)
          }
        }
      }
      
      console.log(`✅ ${file} 完了`)
    } catch (error) {
      console.warn(`⚠️  ${file} でエラー: ${error.message}`)
    }
  }
}

// package.jsonにスクリプトを追加
function addNpmScripts() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  packageJson.scripts = packageJson.scripts || {}
  
  const newScripts = {
    'db:setup': 'node scripts/setup-database-auto.js',
    'db:migrate': 'supabase db push',
    'db:reset': 'supabase db reset',
    'db:types': 'supabase gen types typescript --local > src/types/database.types.ts'
  }
  
  Object.assign(packageJson.scripts, newScripts)
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('📝 package.jsonにデータベーススクリプトを追加しました')
}

// 実行
if (require.main === module) {
  setupDatabase()
    .then(() => addNpmScripts())
    .catch(console.error)
}

module.exports = { setupDatabase }