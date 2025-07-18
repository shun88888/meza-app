import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    let query = supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: challenges, error } = await query

    if (error) {
      console.error('Error fetching challenges:', error)
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
    }

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('API Error:', error)
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

    const body = await request.json()
    const {
      target_time,
      home_address,
      home_latitude,
      home_longitude,
      target_address,
      target_latitude,
      target_longitude,
      penalty_amount,
      wake_up_location_address,
      wake_up_location_lat,
      wake_up_location_lng
    } = body

    // Validate required fields
    if (!target_time || !penalty_amount || !home_latitude || !home_longitude || !target_latitude || !target_longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate numeric fields
    if (isNaN(home_latitude) || isNaN(home_longitude) || isNaN(target_latitude) || isNaN(target_longitude)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert([
        {
          user_id: user.id,
          target_time,
          home_address: home_address || '',
          home_latitude: parseFloat(home_latitude),
          home_longitude: parseFloat(home_longitude),
          target_address: target_address || '',
          target_latitude: parseFloat(target_latitude),
          target_longitude: parseFloat(target_longitude),
          penalty_amount: parseInt(penalty_amount),
          wake_up_location_address,
          wake_up_location_lat: wake_up_location_lat ? parseFloat(wake_up_location_lat) : null,
          wake_up_location_lng: wake_up_location_lng ? parseFloat(wake_up_location_lng) : null,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating challenge:', error)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    // Send notification about new challenge
    try {
      await supabase.rpc('send_notification', {
        user_id_param: user.id,
        title_param: 'チャレンジ作成完了',
        body_param: `新しいチャレンジが作成されました。目標時間: ${target_time}`,
        type_param: 'challenge'
      })
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
      // Don't fail challenge creation if notification fails
    }

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}