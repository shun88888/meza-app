import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
}

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service is not configured' },
      { status: 503 }
    )
  }
  // At this point, stripe is guaranteed to be non-null

  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentIntentId, paymentMethodId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }

    // Get the original payment intent
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
    }

    // Verify the payment intent belongs to this user
    if (paymentIntent.metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let updatedPaymentIntent: Stripe.PaymentIntent

    if (paymentIntent.status === 'requires_payment_method') {
      if (!paymentMethodId) {
        return NextResponse.json({ error: 'Payment method is required for retry' }, { status: 400 })
      }

      // Update payment intent with new payment method
              updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
        payment_method: paymentMethodId,
      })

      // Confirm the payment intent
      updatedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    } else if (paymentIntent.status === 'requires_confirmation') {
      // Just confirm the existing payment intent
      updatedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    } else if (paymentIntent.status === 'requires_action') {
      // Payment intent requires additional action (like 3D Secure)
      updatedPaymentIntent = paymentIntent
    } else {
      return NextResponse.json({ 
        error: 'Payment intent cannot be retried',
        status: paymentIntent.status 
      }, { status: 400 })
    }

    // Update payment record status
    await supabase
      .from('payments')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)

    return NextResponse.json({
      paymentIntent: {
        id: updatedPaymentIntent.id,
        client_secret: updatedPaymentIntent.client_secret,
        status: updatedPaymentIntent.status,
        next_action: updatedPaymentIntent.next_action
      }
    })

  } catch (error) {
    console.error('Payment retry error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`,
        type: error.type
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Payment retry failed' },
      { status: 500 }
    )
  }
}