import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  created_at: string
}

interface PushSubscription {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidEmail = Deno.env.get('VAPID_EMAIL')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📨 Starting push notification processing...')

    // Get unsent notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, title, body, type, created_at')
      .eq('push_sent', false)
      .order('created_at', { ascending: true })
      .limit(50) // Process max 50 at a time

    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ No notifications to send')
      return new Response(
        JSON.stringify({ message: 'No notifications to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${notifications.length} notifications to send`)

    let sentCount = 0
    let failedCount = 0

    for (const notification of notifications as PushNotification[]) {
      try {
        console.log(`📨 Sending notification ${notification.id} to user ${notification.user_id}`)

        // Get user's push subscriptions
        const { data: subscriptions, error: subsError } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', notification.user_id)

        if (subsError) {
          console.error(`❌ Error fetching subscriptions for user ${notification.user_id}:`, subsError)
          continue
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`⚠️ No push subscriptions found for user ${notification.user_id}`)
          
          // Mark as sent even though no subscription (avoid infinite retry)
          await supabase
            .from('notifications')
            .update({ 
              push_sent: true, 
              sent_at: new Date().toISOString(),
              push_status: 'no_subscription'
            })
            .eq('id', notification.id)
          
          continue
        }

        let pushSent = false

        // Send to all user's subscriptions
        for (const subscription of subscriptions as PushSubscription[]) {
          try {
            const pushPayload = {
              title: notification.title,
              body: notification.body,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: {
                type: notification.type,
                timestamp: notification.created_at,
                url: getNotificationUrl(notification.type)
              },
              actions: getNotificationActions(notification.type)
            }

            // Use Web Push API to send notification
            const response = await sendWebPush({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            }, JSON.stringify(pushPayload), {
              vapidDetails: {
                subject: vapidEmail,
                publicKey: vapidPublicKey,
                privateKey: vapidPrivateKey
              }
            })

            if (response.ok) {
              pushSent = true
              console.log(`✅ Push notification sent successfully to ${subscription.endpoint.slice(0, 50)}...`)
            } else {
              console.error(`❌ Push notification failed: ${response.status} ${response.statusText}`)
              
              // If subscription is invalid, remove it
              if (response.status === 410) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('user_id', notification.user_id)
                  .eq('endpoint', subscription.endpoint)
                
                console.log('🗑️ Removed invalid subscription')
              }
            }

          } catch (pushError) {
            console.error(`❌ Error sending push to subscription:`, pushError)
          }
        }

        // Update notification status
        await supabase
          .from('notifications')
          .update({ 
            push_sent: true, 
            sent_at: new Date().toISOString(),
            push_status: pushSent ? 'sent' : 'failed'
          })
          .eq('id', notification.id)

        if (pushSent) {
          sentCount++
        } else {
          failedCount++
        }

      } catch (notificationError) {
        console.error(`❌ Error processing notification ${notification.id}:`, notificationError)
        failedCount++
        
        // Mark as failed
        await supabase
          .from('notifications')
          .update({ 
            push_sent: true, 
            sent_at: new Date().toISOString(),
            push_status: 'error'
          })
          .eq('id', notification.id)
      }
    }

    const result = {
      message: 'Push notification processing completed',
      total_found: notifications.length,
      sent_successfully: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Push notification summary:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Critical error in push notification processing:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Critical error in push notification processing',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to send web push
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  options: any
): Promise<Response> {
  const webPushModule = await import('https://esm.sh/web-push@3.6.6')
  webPushModule.setVapidDetails(
    options.vapidDetails.subject,
    options.vapidDetails.publicKey,
    options.vapidDetails.privateKey
  )
  
  return await webPushModule.sendNotification(subscription, payload)
}

// Helper function to get notification URL based on type
function getNotificationUrl(type: string): string {
  switch (type) {
    case 'challenge_failed':
    case 'challenge_success':
      return '/history'
    case 'payment_success':
    case 'payment_error':
    case 'payment_retry':
      return '/settings/payment'
    default:
      return '/'
  }
}

// Helper function to get notification actions based on type
function getNotificationActions(type: string): Array<{ action: string; title: string }> {
  switch (type) {
    case 'challenge_failed':
      return [
        { action: 'view_payment', title: '決済確認' },
        { action: 'dismiss', title: '閉じる' }
      ]
    case 'payment_error':
      return [
        { action: 'retry_payment', title: '再試行' },
        { action: 'view_settings', title: '設定' }
      ]
    case 'payment_success':
      return [
        { action: 'view_history', title: '履歴確認' },
        { action: 'dismiss', title: '閉じる' }
      ]
    default:
      return [
        { action: 'view', title: '確認' },
        { action: 'dismiss', title: '閉じる' }
      ]
  }
}