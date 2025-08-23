import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

// 証跡情報の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // チャレンジの証跡情報を取得
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, evidence_ref, status, completion_address, completed_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (challengeError) {
      if (challengeError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }
      console.error('Error fetching challenge evidence:', challengeError)
      return NextResponse.json({ error: 'Failed to fetch challenge evidence' }, { status: 500 })
    }

    // 証跡データを解析
    let evidenceData = null
    if (challenge.evidence_ref) {
      try {
        evidenceData = JSON.parse(challenge.evidence_ref)
      } catch (parseError) {
        // JSON形式でない場合はそのまま返す
        evidenceData = { raw: challenge.evidence_ref }
      }
    }

    return NextResponse.json({
      challenge_id: challenge.id,
      status: challenge.status,
      evidence: evidenceData,
      completion_address: challenge.completion_address,
      completed_at: challenge.completed_at,
      has_evidence: !!challenge.evidence_ref
    })

  } catch (error) {
    console.error('Evidence API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 証跡情報の更新（成功申請時に使用）
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
    const { evidence_type, evidence_data, metadata } = body

    // 証跡データの検証
    if (!evidence_type || !evidence_data) {
      return NextResponse.json({ error: 'Missing evidence type or data' }, { status: 400 })
    }

    // サポートされる証跡タイプ
    const supportedTypes = ['photo', 'gps', 'qr_code', 'manual', 'combined']
    if (!supportedTypes.includes(evidence_type)) {
      return NextResponse.json({ error: 'Unsupported evidence type' }, { status: 400 })
    }

    // チャレンジの状態確認
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, status, user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (challengeError) {
      if (challengeError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }
      console.error('Error fetching challenge:', challengeError)
      return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 })
    }

    // アクティブチャレンジのみ証跡追加可能
    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    // 証跡データを構造化
    const evidencePayload = {
      type: evidence_type,
      data: evidence_data,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    }

    // 証跡をJSONとして保存
    const evidenceRef = JSON.stringify(evidencePayload)

    // データベースに保存
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ 
        evidence_ref: evidenceRef,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating evidence:', updateError)
      return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      evidence_id: params.id,
      evidence_type: evidence_type,
      message: 'Evidence saved successfully'
    })

  } catch (error) {
    console.error('Evidence save API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}