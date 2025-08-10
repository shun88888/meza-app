import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSideClient } from '@/lib/supabase-server'
import { Database } from '@/types/database'

let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service is not configured' },
      { status: 503 }
    )
  }
  // At this point, stripe is guaranteed to be non-null

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    console.error('Missing stripe signature or webhook secret')
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }
    
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Supabase client (using service role for webhook operations)
  const supabase = createServerSideClient()

  try {
    // Log webhook event for monitoring
    const { error: logError } = await supabase.from('webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: 'processing'
    })
    if (logError) {
      console.error('Failed to log webhook event:', logError)
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('💰 Payment succeeded:', paymentIntent.id)

        const challengeId = paymentIntent.metadata.challenge_id || paymentIntent.metadata.challengeId
        const userId = paymentIntent.metadata.user_id || paymentIntent.metadata.userId
        const paymentType = paymentIntent.metadata.type || 'manual'

        if (!challengeId || !userId) {
          console.error('❌ Missing challengeId or userId in payment intent metadata')
          await supabase.from('webhook_logs').insert({
            event_id: event.id,
            event_type: event.type,
            processed_at: new Date().toISOString(),
            status: 'failed',
            error_message: 'Missing required metadata'
          })
          break
        }

        // Update payment status with detailed information
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            stripe_payment_intent_id: paymentIntent.id,
            receipt_url: (paymentIntent as any)?.charges?.data?.[0]?.receipt_url,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (paymentUpdateError) {
          console.error('❌ Failed to update payment status:', paymentUpdateError)
        } else {
          console.log('✅ Payment status updated successfully')
        }

        // Update challenge status 
        const { error: challengeUpdateError } = await supabase
          .from('challenges')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', challengeId)

        if (challengeUpdateError) {
          console.error('❌ Failed to update challenge status:', challengeUpdateError)
        } else {
          console.log(`✅ Challenge ${challengeId} marked as failed (penalty paid)`)
        }

        // Send success notification
        const { error: notifyError1 } = await supabase.rpc('send_notification', {
          user_id_param: userId,
          title_param: '決済完了',
          body_param: `ペナルティ料金 ¥${(paymentIntent.amount / 100).toLocaleString()} の決済が完了しました。`,
          type_param: 'payment_success'
        })
        if (notifyError1) {
          console.error('Failed to send notification:', notifyError1)
        }

        // Log successful processing
        await supabase.from('webhook_logs').update({
          status: 'completed',
          processed_at: new Date().toISOString()
        }).eq('event_id', event.id)

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', paymentIntent.id)

        const challengeId = paymentIntent.metadata.challenge_id || paymentIntent.metadata.challengeId
        const userId = paymentIntent.metadata.user_id || paymentIntent.metadata.userId
        const lastError = paymentIntent.last_payment_error

        // Update payment status with failure details
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            failure_code: lastError?.code,
            failure_message: lastError?.message,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (paymentUpdateError) {
          console.error('❌ Failed to update payment status:', paymentUpdateError)
        } else {
          console.log('✅ Payment failure status updated')
        }

        // Send failure notification with retry option
        if (userId) {
        const { error: notifyError2 } = await supabase.rpc('send_notification', {
            user_id_param: userId,
            title_param: '決済失敗',
            body_param: `決済に失敗しました。カード情報を確認してください。エラー: ${lastError?.message || '不明なエラー'}`,
            type_param: 'payment_error'
          })
          if (notifyError2) {
            console.error('Failed to send notification:', notifyError2)
          }
        }

        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment canceled:', paymentIntent.id)

        // Update payment status
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (paymentUpdateError) {
          console.error('Failed to update payment status:', paymentUpdateError)
        }

        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        console.log('Customer created:', customer.id)

        // Link customer to user profile if metadata contains userId
        if (customer.metadata.userId) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', customer.metadata.userId)

          if (profileUpdateError) {
            console.error('Failed to update profile with customer ID:', profileUpdateError)
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)
        // Handle subscription payments if needed in the future
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)
        // Handle failed subscription payments if needed in the future
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}