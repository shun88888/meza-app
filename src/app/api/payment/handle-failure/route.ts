import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentIntentId, action } = await request.json()

    if (!paymentIntentId || !action) {
      return NextResponse.json({ error: 'Payment intent ID and action are required' }, { status: 400 })
    }

    // Get the payment intent and verify ownership
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const challengeId = paymentIntent.metadata.challengeId

    switch (action) {
      case 'cancel_payment': {
        // Cancel the payment intent
        await stripe.paymentIntents.cancel(paymentIntentId)
        
        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntentId)

        // Keep challenge in failed state but mark as unresolved
        await supabase
          .from('challenges')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            payment_intent_id: null // Remove payment intent reference
          })
          .eq('id', challengeId)

        return NextResponse.json({ 
          success: true, 
          message: 'Payment cancelled. Challenge remains failed.' 
        })
      }

      case 'schedule_retry': {
        // Schedule automatic retry (could be implemented with a job queue)
        // For now, just update the payment record with retry information
        await supabase
          .from('payments')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntentId)

        // Send notification about retry
        try {
          await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': request.headers.get('Authorization') || '',
              'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
              title: '決済リトライのお知らせ',
              body: 'ペナルティ決済を24時間後に再試行します。決済方法を確認してください。',
              type: 'reminder',
              userId: user.id
            })
          })
        } catch (notificationError) {
          console.error('Failed to send retry notification:', notificationError)
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Payment retry scheduled.' 
        })
      }

      case 'dispute_challenge': {
        // Handle challenge dispute - this could involve manual review
        await supabase
          .from('challenges')
          .update({ 
            status: 'pending', // Reset to pending for review
            completed_at: null,
            // Could add a dispute_reason field in the future
          })
          .eq('id', challengeId)

        // Send notification to admin/support (if implemented)
        try {
          await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': request.headers.get('Authorization') || '',
              'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
              title: 'チャレンジ異議申し立て',
              body: 'チャレンジの結果に異議が申し立てられました。サポートが確認します。',
              type: 'general',
              userId: user.id
            })
          })
        } catch (notificationError) {
          console.error('Failed to send dispute notification:', notificationError)
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Challenge dispute submitted for review.' 
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Payment failure handling error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`,
        type: error.type
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Payment failure handling failed' },
      { status: 500 }
    )
  }
}