'use client'

export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">環境変数テスト</h1>
      <div className="space-y-2">
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl ? 'SET' : 'NOT SET'}
        </p>  
        <p>
          <strong>Value:</strong> {supabaseUrl || 'undefined'}
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {supabaseAnonKey ? 'SET' : 'NOT SET'}
        </p>
        <p>
          <strong>Value:</strong> {supabaseAnonKey ? 'SET (hidden)' : 'undefined'}
        </p>
      </div>
    </div>
  )
} 