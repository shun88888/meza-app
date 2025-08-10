import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    
    // Admin authentication check (implement your admin auth logic)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you may need to implement admin role checking)
    // For now, we'll allow any authenticated user for development
    
    // Get system health metrics
    const { data: healthMetrics, error: healthError } = await supabase
      .rpc('get_system_health')

    if (healthError) {
      console.error('Failed to get system health:', healthError)
      return NextResponse.json({ error: 'Failed to get system health' }, { status: 500 })
    }

    // Get system alerts
    const { data: alerts, error: alertsError } = await supabase
      .rpc('generate_system_alerts')

    if (alertsError) {
      console.error('Failed to generate alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 })
    }

    // Get recent statistics
    const { data: paymentStats, error: paymentError } = await supabase
      .from('payment_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(7)

    const { data: challengeStats, error: challengeError } = await supabase
      .from('challenge_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(7)

    const { data: notificationStats, error: notificationError } = await supabase
      .from('notification_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(7)

    // Get recent webhook logs
    const { data: recentWebhooks, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Calculate overall system status
    const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical').length || 0
    const warningAlerts = alerts?.filter((a: any) => a.severity === 'warning').length || 0
    
    let systemStatus = 'healthy'
    if (criticalAlerts > 0) {
      systemStatus = 'critical'
    } else if (warningAlerts > 0) {
      systemStatus = 'warning'
    }

    // Get active challenges count
    const { count: activeChallengesCount } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get pending payments count
    const { count: pendingPaymentsCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const dashboardData = {
      system_status: systemStatus,
      timestamp: new Date().toISOString(),
      health_metrics: healthMetrics,
      alerts: alerts,
      statistics: {
        payments: paymentStats,
        challenges: challengeStats,
        notifications: notificationStats
      },
      recent_webhooks: recentWebhooks,
      active_counts: {
        active_challenges: activeChallengesCount || 0,
        pending_payments: pendingPaymentsCount || 0,
        total_alerts: (criticalAlerts + warningAlerts)
      },
      errors: {
        payment: paymentError ? paymentError.message : null,
        challenge: challengeError ? challengeError.message : null,
        notification: notificationError ? notificationError.message : null,
        webhook: webhookError ? webhookError.message : null
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('System health API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    
    // Admin authentication check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, target } = await request.json()

    if (action === 'trigger_cron') {
      // Manually trigger cron jobs
      const results = []

      if (target === 'expired_challenges' || target === 'all') {
        try {
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/process-expired-challenges`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          })
          
          const result = await response.json()
          results.push({ job: 'expired_challenges', status: response.ok ? 'success' : 'error', result })
        } catch (error) {
          const message = (error as Error)?.message || 'Unknown error'
          results.push({ job: 'expired_challenges', status: 'error', error: message })
        }
      }

      if (target === 'retry_payments' || target === 'all') {
        try {
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/retry-failed-payments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          })
          
          const result = await response.json()
          results.push({ job: 'retry_payments', status: response.ok ? 'success' : 'error', result })
        } catch (error) {
          const message = (error as Error)?.message || 'Unknown error'
          results.push({ job: 'retry_payments', status: 'error', error: message })
        }
      }

      if (target === 'push_notifications' || target === 'all') {
        try {
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-push-notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          })
          
          const result = await response.json()
          results.push({ job: 'push_notifications', status: response.ok ? 'success' : 'error', result })
        } catch (error) {
          const message = (error as Error)?.message || 'Unknown error'
          results.push({ job: 'push_notifications', status: 'error', error: message })
        }
      }

      return NextResponse.json({ 
        message: 'Cron jobs triggered manually',
        results,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('System health action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}