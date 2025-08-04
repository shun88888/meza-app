import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { challengeId, amount } = body

    if (!challengeId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get challenge data
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get user's payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (paymentError || !paymentMethods || paymentMethods.length === 0) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 })
    }

    // Use the first (most recent) payment method or find default
    const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0]

    try {
      // Create payment intent for auto-charge
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'jpy',
        customer: defaultPaymentMethod.stripe_customer_id,
        payment_method: defaultPaymentMethod.stripe_payment_method_id,
        confirm: true, // Auto-confirm the payment
        off_session: true, // Indicates this is for saved payment method
        description: `Challenge penalty auto-charge for challenge ${challengeId}`,
        metadata: {
          challengeId: challengeId,
          userId: user.id,
          type: 'auto_penalty'
        }
      })

      // Record the payment in database
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          amount: amount,
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
          stripe_payment_intent_id: paymentIntent.id,
          payment_method: 'auto_charge',
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error recording payment:', insertError)
      }

      return NextResponse.json({
        success: paymentIntent.status === 'succeeded',
        paymentIntent: paymentIntent,
        message: paymentIntent.status === 'succeeded' 
          ? 'Auto-charge completed successfully' 
          : 'Auto-charge failed'
      })

    } catch (stripeError: any) {
      console.error('Stripe auto-charge error:', stripeError)
      
      // Record failed payment
      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          amount: amount,
          status: 'failed',
          payment_method: 'auto_charge_failed',
          created_at: new Date().toISOString(),
          error_message: stripeError.message
        })

      return NextResponse.json({ 
        success: false,
        error: 'Auto-charge failed',
        details: stripeError.message 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Auto-charge API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}