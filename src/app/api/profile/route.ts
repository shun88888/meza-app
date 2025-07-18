import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ message: 'Profile already exists', profile: existingProfile })
    }

    // Create new profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        push_notifications_enabled: false,
        reminder_enabled: true,
        reminder_minutes_before: 10,
        theme: 'light',
        timezone: 'Asia/Tokyo'
      })

    if (settingsError) {
      console.error('User settings creation error:', settingsError)
      // Don't fail the profile creation if settings fail
    }

    // Get the created profile
    const { data: newProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching new profile:', fetchError)
      return NextResponse.json({ error: 'Profile created but failed to fetch' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profile created successfully', profile: newProfile }, { status: 201 })
  } catch (error) {
    console.error('Profile creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 