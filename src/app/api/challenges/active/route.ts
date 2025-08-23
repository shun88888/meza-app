import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

// アクティブチャレンジ取得API（復帰ロジック用）
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 新しいRPC関数を使用してアクティブチャレンジを取得
    const { data: activeChallenge, error: challengeError } = await supabase
      .rpc('get_active_challenge_for_user')
      .single()

    if (challengeError) {
      if (challengeError.code === 'PGRST116') {
        // アクティブチャレンジが存在しない
        return NextResponse.json({ 
          hasActiveChallenge: false,
          challenge: null 
        })
      }
      console.error('Error fetching active challenge:', challengeError)
      return NextResponse.json({ error: 'Failed to fetch active challenge' }, { status: 500 })
    }

    if (!activeChallenge) {
      return NextResponse.json({ 
        hasActiveChallenge: false,
        challenge: null 
      })
    }

    // 時間切れチェック（サーバー側で二重チェック）
    const now = new Date()
    const endsAt = new Date((activeChallenge as any).ends_at)
    const isExpired = now > endsAt

    if (isExpired) {
      // Edge Functionに任せるため、ここでは状態を返すのみ
      return NextResponse.json({
        hasActiveChallenge: true,
        challenge: {
          ...activeChallenge,
          isExpired: true,
          timeRemainingSeconds: 0
        }
      })
    }

    return NextResponse.json({
      hasActiveChallenge: true,
      challenge: {
        ...activeChallenge,
        isExpired: false,
        timeRemainingSeconds: Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000))
      }
    })

  } catch (error) {
    console.error('Active challenge API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// チャレンジ開始API（サーバー主導フロー）
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { challenge_id, target_datetime } = body

    if (!challenge_id || !target_datetime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // サーバー主導でチャレンジを開始
    const { data: startResult, error: startError } = await supabase
      .rpc('start_challenge', {
        challenge_id_param: challenge_id,
        target_datetime_param: target_datetime
      })
      .single()

    if (startError) {
      console.error('Error starting challenge:', startError)
      return NextResponse.json({ error: 'Failed to start challenge' }, { status: 500 })
    }

    if (!(startResult as any).success) {
      return NextResponse.json({ 
        error: (startResult as any).message,
        success: false 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      challenge_id: (startResult as any).challenge_id,
      ends_at: (startResult as any).ends_at,
      message: (startResult as any).message
    })

  } catch (error) {
    console.error('Challenge start API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}