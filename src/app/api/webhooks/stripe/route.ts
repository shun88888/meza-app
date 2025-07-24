import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Supabase client (using service role for webhook operations)
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        const challengeId = paymentIntent.metadata.challengeId
        const userId = paymentIntent.metadata.userId

        if (!challengeId || !userId) {
          console.error('Missing challengeId or userId in payment intent metadata')
          break
        }

        // Update payment status
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (paymentUpdateError) {
          console.error('Failed to update payment status:', paymentUpdateError)
        }

        // Update challenge status to failed (penalty paid)
        const { error: challengeUpdateError } = await supabase
          .from('challenges')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', challengeId)

        if (challengeUpdateError) {
          console.error('Failed to update challenge status:', challengeUpdateError)
        } else {
          console.log(`Challenge ${challengeId} marked as failed due to penalty payment`)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)

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