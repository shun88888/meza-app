/**
 * 環境設定確認ユーティリティ
 * 前提整備：必要な環境変数の統一確認
 */

// 必須環境変数の定義
interface RequiredEnvVars {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Stripe（必須）
  STRIPE_SECRET_KEY: string
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  
  // VAPID（必須）
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_EMAIL: string
  
  // アプリケーション
  NEXT_PUBLIC_APP_URL: string
}

// オプション環境変数の定義
interface OptionalEnvVars {
  MAP_API_KEY?: string
  NEXT_PUBLIC_DEFAULT_TIMEZONE?: string
  NEXT_PUBLIC_DEBUG_MODE?: string
  NEXT_PUBLIC_ENABLE_LOCATION_DEBUG?: string
  DATABASE_URL?: string
}

// 環境設定の検証結果
export interface ConfigValidationResult {
  isValid: boolean
  missingRequired: string[]
  missingOptional: string[]
  warnings: string[]
  environment: 'development' | 'production' | 'test'
}

/**
 * 環境変数の検証
 */
export function validateEnvironmentConfig(): ConfigValidationResult {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_EMAIL',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  const optionalVars: (keyof OptionalEnvVars)[] = [
    'MAP_API_KEY',
    'NEXT_PUBLIC_DEFAULT_TIMEZONE',
    'NEXT_PUBLIC_DEBUG_MODE',
    'NEXT_PUBLIC_ENABLE_LOCATION_DEBUG',
    'DATABASE_URL'
  ]
  
  const missingRequired: string[] = []
  const missingOptional: string[] = []
  const warnings: string[] = []
  
  // 必須環境変数のチェック
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (!value || value.includes('your_') || value.includes('_here')) {
      missingRequired.push(varName)
    }
  })
  
  // オプション環境変数のチェック
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      missingOptional.push(varName)
    }
  })
  
  // 警告のチェック
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      warnings.push('本番環境でDEBUG_MODEが有効になっています')
    }
    
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('本番環境でStripeテストキーが使用されています')
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      warnings.push('本番環境でlocalhostのURLが設定されています')
    }
  }
  
  // 時刻設定の警告
  if (!process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE) {
    warnings.push('デフォルトタイムゾーンが設定されていません（Asia/Tokyoを使用）')
  }
  
  const environment = (process.env.NODE_ENV as any) || 'development'
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    warnings,
    environment
  }
}

/**
 * 環境設定の詳細表示（デバッグ用）
 */
export function logEnvironmentStatus(): void {
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== 'true') return
  
  const result = validateEnvironmentConfig()
  
  console.log('🔧 環境設定状況:')
  console.log(`  環境: ${result.environment}`)
  console.log(`  設定状態: ${result.isValid ? '✅ 完了' : '❌ 不完全'}`)
  
  if (result.missingRequired.length > 0) {
    console.error('❌ 不足している必須環境変数:')
    result.missingRequired.forEach(varName => {
      console.error(`  - ${varName}`)
    })
  }
  
  if (result.missingOptional.length > 0) {
    console.warn('⚠️ 設定されていないオプション環境変数:')
    result.missingOptional.forEach(varName => {
      console.warn(`  - ${varName}`)
    })
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ 警告:')
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`)
    })
  }
}

/**
 * 機能別の設定確認
 */
export class FeatureConfigValidator {
  /**
   * Stripe決済機能の設定確認
   */
  static validateStripeConfig(): boolean {
    const secretKey = process.env.STRIPE_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    return !!(secretKey && publishableKey && webhookSecret &&
             !secretKey.includes('your_') &&
             !publishableKey.includes('your_') &&
             !webhookSecret.includes('your_'))
  }
  
  /**
   * プッシュ通知機能の設定確認
   */
  static validatePushConfig(): boolean {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const email = process.env.VAPID_EMAIL
    
    return !!(publicKey && privateKey && email &&
             !publicKey.includes('your_') &&
             !privateKey.includes('your_') &&
             email.includes('@'))
  }
  
  /**
   * 位置情報機能の設定確認
   */
  static validateLocationConfig(): boolean {
    // 現在はOpenStreetMapを使用するため、特別な設定は不要
    // 将来的にGoogle Maps等を使用する場合はMAP_API_KEYをチェック
    return true
  }
  
  /**
   * データベース機能の設定確認
   */
  static validateDatabaseConfig(): boolean {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return !!(supabaseUrl && anonKey && serviceKey &&
             supabaseUrl.startsWith('https://') &&
             anonKey.startsWith('eyJ') &&
             serviceKey.startsWith('eyJ'))
  }
}

/**
 * 本番環境準備状況の確認
 */
export function checkProductionReadiness(): {
  ready: boolean
  blockers: string[]
  recommendations: string[]
} {
  const result = validateEnvironmentConfig()
  const blockers: string[] = []
  const recommendations: string[] = []
  
  // 必須設定の確認
  if (!result.isValid) {
    blockers.push('必須環境変数が不足しています')
  }
  
  // 機能別設定の確認
  if (!FeatureConfigValidator.validateStripeConfig()) {
    blockers.push('Stripe決済設定が不完全です')
  }
  
  if (!FeatureConfigValidator.validatePushConfig()) {
    blockers.push('プッシュ通知設定が不完全です')
  }
  
  if (!FeatureConfigValidator.validateDatabaseConfig()) {
    blockers.push('データベース設定が不完全です')
  }
  
  // 推奨設定の確認
  if (!process.env.MAP_API_KEY) {
    recommendations.push('地図APIキーの設定を検討してください')
  }
  
  if (process.env.NODE_ENV !== 'production') {
    recommendations.push('NODE_ENVをproductionに設定してください')
  }
  
  return {
    ready: blockers.length === 0,
    blockers,
    recommendations
  }
}

// 初期化時の環境設定確認
if (typeof window === 'undefined') {
  // サーバーサイドでのみ実行
  const result = validateEnvironmentConfig()
  
  if (!result.isValid && process.env.NODE_ENV !== 'test') {
    console.error('❌ 環境設定が不完全です。env-template.txt を参考に設定を完了してください。')
    console.error('不足している環境変数:', result.missingRequired)
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    logEnvironmentStatus()
  }
}