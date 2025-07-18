import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Settings not found, create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            push_notifications_enabled: true,
            reminder_enabled: true,
            reminder_minutes_before: 30,
            theme: 'auto',
            timezone: 'Asia/Tokyo'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default settings:', createError)
          return NextResponse.json({ error: 'Failed to create default settings' }, { status: 500 })
        }

        return NextResponse.json({ settings: newSettings })
      }
      
      console.error('Error fetching user settings:', error)
      return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      push_notifications_enabled,
      reminder_enabled,
      reminder_minutes_before,
      theme,
      timezone
    } = body

    const { data: settings, error } = await supabase
      .from('user_settings')
      .update({
        push_notifications_enabled,
        reminder_enabled,
        reminder_minutes_before,
        theme,
        timezone
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user settings:', error)
      return NextResponse.json({ error: 'Failed to update user settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 