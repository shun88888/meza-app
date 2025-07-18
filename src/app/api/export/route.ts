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
    const format = searchParams.get('format') || 'json'

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch user challenges
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch user payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Fetch notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const exportData = {
      export_info: {
        user_id: user.id,
        exported_at: new Date().toISOString(),
        format: format
      },
      profile: profile || {},
      challenges: challenges || [],
      payments: payments || [],
      settings: settings || {},
      notifications: notifications || []
    }

    if (format === 'csv') {
      // Generate CSV for challenges (most commonly exported data)
      const csvHeader = 'Date,Status,Target Time,Penalty Amount,Home Address,Target Address,Completed At,Distance to Target\n'
      const csvRows = (challenges || []).map(challenge => {
        return [
          new Date(challenge.created_at).toLocaleDateString(),
          challenge.status,
          challenge.target_time,
          challenge.penalty_amount,
          `"${challenge.home_address}"`,
          `"${challenge.target_address}"`,
          challenge.completed_at || '',
          challenge.distance_to_target || ''
        ].join(',')
      }).join('\n')

      const csvContent = csvHeader + csvRows

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="meza-challenges-${user.id}.csv"`
        }
      })
    } else {
      // Return JSON format
      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="meza-data-${user.id}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Generate export data
    const exportResponse = await fetch(`${request.nextUrl.origin}/api/export?format=json`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    })

    if (!exportResponse.ok) {
      throw new Error('Failed to generate export data')
    }

    const exportData = await exportResponse.text()

    // Send notification about export (in a real app, you'd email the data)
    try {
      await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({
          title: 'データエクスポート完了',
          body: `データのエクスポートが完了しました。プロフィールページからダウンロードできます。`,
          type: 'general',
          userId: user.id
        })
      })
    } catch (notificationError) {
      console.error('Failed to send export notification:', notificationError)
      // Don't fail the export if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'データエクスポートが完了しました。ダウンロードページをご確認ください。',
      downloadUrl: `/api/export?format=json`
    })
  } catch (error) {
    console.error('Export request error:', error)
    return NextResponse.json({ error: 'Export request failed' }, { status: 500 })
  }
}