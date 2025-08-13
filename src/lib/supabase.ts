import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { SUPABASE_CONFIG, isSupabaseConfigured } from './supabase-config'

// Global singleton instance (survive HMR)
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null | undefined
}

let globalSupabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Initialize singleton only once
const initSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured properly. Running in demo mode.')
    return null
  }

  if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createClientComponentClient<Database>()
  }

  // Client-side: use global singleton that persists across HMR
  if (!globalThis.__supabaseClient) {
    globalThis.__supabaseClient = createClientComponentClient<Database>()
  }
  globalSupabaseInstance = globalThis.__supabaseClient || null
  
  return globalSupabaseInstance
}

export const createClientSideClient = () => {
  return initSupabaseClient()
}

// Admin client (for server actions requiring elevated permissions)
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    })
  : null

// Helper function to create user profile
export async function createUserProfile(userId: string, email: string) {
  const supabase = createClientSideClient()
  if (!supabase) return { error: { message: 'Supabase not available' } }

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return { error: null }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { error: profileError }
    }

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        push_notifications_enabled: false,
        reminder_enabled: true,
        reminder_minutes_before: 10,
        theme: 'light',
        timezone: 'Asia/Tokyo'
      })

    if (settingsError) {
      console.error('User settings creation error:', settingsError)
      // Don't return error for settings, profile creation is more important
    }

    return { error: null }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { error: error as any }
  }
}

// Utility functions for client-side usage
export async function getCurrentUser() {
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
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return { error }
    }

    // If signup was successful and user is confirmed, create profile immediately
    if (data?.user && data.user.email_confirmed_at) {
      const profileResult = await createUserProfile(data.user.id, data.user.email || email)
      if (profileResult.error) {
        console.error('Profile creation failed:', profileResult.error)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.log('Supabase signUp failed')
    return { error: { message: 'サインアップに失敗しました。' } }
  }
} 