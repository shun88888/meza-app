import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { SUPABASE_CONFIG, IS_DEMO_MODE } from './supabase-config'

// Lazy client creation to avoid initial load overhead
let clientSideClient: any = null
let adminClient: any = null

// Client-side Supabase client (for use in client components)
export const createClientSideClient = () => {
  if (!clientSideClient) {
    try {
      clientSideClient = createClientComponentClient<Database>()
    } catch (error) {
      console.log('Supabase client creation failed, using demo mode')
      return null
    }
  }
  return clientSideClient
}

// Admin client (for server actions and API routes) - only create when needed
export const getSupabaseClient = () => {
  if (!adminClient) {
    if (IS_DEMO_MODE) {
      console.log('デモモードが有効です')
      return null
    }
    
    try {
      adminClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
          persistSession: false
        }
      })
      console.log('✅ Supabaseクライアント接続成功')
    } catch (error) {
      console.log('❌ Supabaseクライアント作成失敗:', error)
      return null
    }
  }
  return adminClient
}

// Compatibility export - only create when actually used
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient()
    return client ? client[prop] : null
  }
})

// Utility functions for client-side usage
export async function getCurrentUser() {
  // デモモード用のローカルストレージチェック
  if (typeof window !== 'undefined') {
    const demoUser = localStorage.getItem('demo-user')
    if (demoUser) {
      return JSON.parse(demoUser)
    }
  }

  const supabase = createClientSideClient()
  if (!supabase) return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.log('Supabase auth not available')
    return null
  }
}

export async function signOut() {
  // デモモードのクリーンアップ
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo-user')
  }

  const supabase = createClientSideClient()
  if (!supabase) return

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.log('Supabase signOut not available')
  }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClientSideClient()
  if (!supabase) {
    return { error: { message: 'Supabase認証が利用できません。デモモードをお使いください。' } }
  }

  try {
    return await supabase.auth.signInWithPassword({ email, password })
  } catch (error) {
    console.log('Supabase signIn failed')
    return { error: { message: 'サインインに失敗しました。' } }
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClientSideClient()
  if (!supabase) {
    return { error: { message: 'Supabase認証が利用できません。デモモードをお使いください。' } }
  }

  try {
    return await supabase.auth.signUp({ email, password })
  } catch (error) {
    console.log('Supabase signUp failed')
    return { error: { message: 'サインアップに失敗しました。' } }
  }
} 