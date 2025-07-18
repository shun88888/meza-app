import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=auth_error&message=${encodeURIComponent('認証に失敗しました')}`, requestUrl.origin)
        )
      }

      if (data?.user) {
        // Check if profile exists, create if not
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating profile for user:', data.user.id)
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            console.error('Profile creation error:', createError)
            // Don't fail the authentication, just log the error
          } else {
            console.log('Profile created successfully for user:', data.user.id)
          }

          // Create user settings
          const { error: settingsError } = await supabase
            .from('user_settings')
            .insert({
              user_id: data.user.id,
              push_notifications_enabled: false,
              reminder_enabled: true,
              reminder_minutes_before: 10,
              theme: 'light',
              timezone: 'Asia/Tokyo'
            })

          if (settingsError) {
            console.error('User settings creation error:', settingsError)
            // Don't fail the authentication, just log the error
          } else {
            console.log('User settings created successfully for user:', data.user.id)
          }
        } else if (profile) {
          console.log('Profile already exists for user:', data.user.id)
        }

        // Successful authentication, redirect to intended page
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }
    } catch (error) {
      console.error('Auth callback processing error:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=server_error&message=${encodeURIComponent('サーバーエラーが発生しました')}`, requestUrl.origin)
      )
    }
  }

  // No code parameter, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}