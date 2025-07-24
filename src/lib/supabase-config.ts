// Supabase設定
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

// 設定の検証
export const isSupabaseConfigured = () => {
  return SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey
}

// 本番環境設定
export const IS_DEMO_MODE = !isSupabaseConfigured() 