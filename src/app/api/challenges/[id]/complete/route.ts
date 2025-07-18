import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      current_lat, 
      current_lng, 
      current_address
    } = body

    // Validate required fields
    if (current_lat === undefined || current_lng === undefined) {
      return NextResponse.json({ error: 'Missing required coordinates' }, { status: 400 })
    }

    // Validate numeric fields
    if (isNaN(current_lat) || isNaN(current_lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // First, get the challenge to check if it exists and belongs to the user
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }
      console.error('Error fetching challenge:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 })
    }

    // Check if challenge is already completed
    if (challenge.status === 'completed' || challenge.status === 'failed') {
      return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 })
    }

    // Use Supabase function to complete the challenge
    const { data: completionResult, error: completionError } = await supabase
      .rpc('complete_challenge', {
        challenge_id: params.id,
        completion_lat_param: parseFloat(current_lat),
        completion_lng_param: parseFloat(current_lng),
        completion_address_param: current_address || null
      })

    if (completionError) {
      console.error('Error completing challenge:', completionError)
      return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 })
    }

    const result = completionResult[0]
    const isSuccess = result.within_range
    const distance = result.distance_to_target

    // Get updated challenge data
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (updateError) {
      console.error('Error fetching updated challenge:', updateError)
      return NextResponse.json({ error: 'Failed to fetch updated challenge' }, { status: 500 })
    }

    // Send notification
    try {
      const notificationTitle = isSuccess ? 'チャレンジ成功！' : 'チャレンジ失敗'
      const notificationBody = isSuccess 
        ? `おめでとうございます！目標地点から${distance.toFixed(0)}m以内に到着しました。`
        : `チャレンジが失敗しました。目標地点から${distance.toFixed(0)}m離れています。ペナルティ料金 ¥${challenge.penalty_amount.toLocaleString()} が発生します。`
      
      await supabase.rpc('send_notification', {
        user_id_param: user.id,
        title_param: notificationTitle,
        body_param: notificationBody,
        type_param: 'challenge'
      })
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
      // Don't fail the completion if notification fails
    }

    // If challenge failed, create payment intent for penalty
    if (!isSuccess) {
      try {
        const penaltyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            amount: challenge.penalty_amount,
            challengeId: params.id,
            userId: user.id
          })
        })

        if (!penaltyResponse.ok) {
          console.error('Failed to create penalty payment intent')
          // Don't fail the completion if payment fails
        }
      } catch (paymentError) {
        console.error('Error processing penalty payment:', paymentError)
        // Don't fail the completion if payment fails
      }
    }

    return NextResponse.json({ 
      challenge: updatedChallenge,
      success: isSuccess,
      distance_to_target: distance,
      within_range: result.within_range,
      message: isSuccess ? 'Challenge completed successfully!' : 'Challenge failed, penalty applied.'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}