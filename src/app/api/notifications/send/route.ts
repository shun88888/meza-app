import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import webpush from 'web-push'

// Configure web-push (these should be environment variables)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:support@meza-app.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 })
    }

    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, body, userId, type = 'general' } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const targetUserId = userId || user.id

    // Store notification in database
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title,
        body,
        type,
        is_read: false,
        push_sent: false
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)

    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Send push notifications
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        }

        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-144x144.png',
          data: {
            notificationId: notification.id,
            type,
            url: '/'
          }
        })

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, subscriptionId: subscription.id }
      } catch (error) {
        console.error('Push notification failed:', error)
        
        // If subscription is invalid, mark as inactive
        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id)
        }
        
        return { success: false, subscriptionId: subscription.id, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length

    // Update notification as sent
    if (successCount > 0) {
      await supabase
        .from('notifications')
        .update({ push_sent: true })
        .eq('id', notification.id)
    }

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      pushResults: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount
      }
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}