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
      current_address,
      auto_charge = false,
      is_success = null
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

    let isSuccess: boolean
    let distance: number

    // auto_charge の場合は自動失敗（Edge Function からの呼び出し想定）
    if (auto_charge && is_success === false) {
      // 自動失敗用RPCを使用
      const { data: autoFailResult, error: autoFailError } = await supabase
        .rpc('auto_fail_expired_challenge', {
          challenge_id_param: params.id,
          failure_reason: 'timeout'
        })
        .single()

      if (autoFailError) {
        console.error('Error auto-failing challenge:', autoFailError)
        return NextResponse.json({ error: 'Failed to auto-fail challenge' }, { status: 500 })
      }

      isSuccess = false
      distance = 0
    } else {
      // 通常のユーザー成功申請: 新しいRPC関数を使用
      const { data: completionResult, error: completionError } = await supabase
        .rpc('submit_challenge_success', {
          challenge_id_param: params.id,
          completion_lat_param: parseFloat(current_lat),
          completion_lng_param: parseFloat(current_lng),
          completion_address_param: current_address || null,
          evidence_ref_param: null // 将来の拡張用
        })
        .single()

      if (completionError) {
        console.error('Error submitting challenge success:', completionError)
        return NextResponse.json({ error: 'Failed to submit challenge success' }, { status: 500 })
      }

      if (!(completionResult as any).success) {
        return NextResponse.json({ 
          error: (completionResult as any).message,
          challenge_expired: (completionResult as any).message === 'Challenge time expired'
        }, { status: 400 })
      }

      isSuccess = (completionResult as any).within_range
      distance = (completionResult as any).distance_to_target
    }

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
      const notificationTitle = isSuccess ? 'チャレンジ成功！' : (auto_charge ? 'チャレンジ自動失敗' : 'チャレンジ失敗')
      const notificationBody = isSuccess 
        ? `おめでとうございます！目標地点から${distance.toFixed(0)}m以内に到着しました。`
        : auto_charge 
          ? `起床時間を過ぎたため、チャレンジが自動的に失敗しました。ペナルティ料金 ¥${challenge.penalty_amount.toLocaleString()} が自動決済されました。`
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
      within_range: isSuccess,
      message: isSuccess ? 'Challenge completed successfully!' : 'Challenge failed, penalty applied.'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}