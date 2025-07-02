// 本番用Supabase設定
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://protfbiygiyfikeigwiv.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3RmYml5Z2l5ZmlrZWlnd2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjE4ODMsImV4cCI6MjA2Njk5Nzg4M30.KFTSrbCe0ts01xnAdDaYYZzl7gTWmJqkch1C-lGAMEg',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3RmYml5Z2l5ZmlrZWlnd2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQyMTg4MywiZXhwIjoyMDY2OTk3ODgzfQ.AR-3HneZ05sRp8X9IAI7SbHUHQQMRNli7fUuSnfBDNk'
}

// デモモードを無効化
export const IS_DEMO_MODE = false

console.log('✅ Supabase本番設定が読み込まれました')
console.log(`🔗 URL: ${SUPABASE_CONFIG.url}`)
console.log(`🔑 Auth configured: ${!!SUPABASE_CONFIG.anonKey}`) 