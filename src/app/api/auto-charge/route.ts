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

    // Try local DB first
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    let selectedCustomerId: string | null = null
    let selectedPaymentMethodId: string | null = null

    if (!paymentError && paymentMethods && paymentMethods.length > 0) {
      const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0]
      selectedCustomerId = defaultPaymentMethod.stripe_customer_id
      selectedPaymentMethodId = defaultPaymentMethod.stripe_payment_method_id
    } else {
      // Fallback: fetch from Stripe using profile's customer id
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (profile?.stripe_customer_id) {
        const stripePmList = await stripe.paymentMethods.list({
          customer: profile.stripe_customer_id,
          type: 'card',
        })

        if (stripePmList.data.length > 0) {
          // determine default (Stripeの実デフォルト優先)
          const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
          const defaultPmId = typeof customer !== 'string' && !('deleted' in customer)
            ? (customer.invoice_settings?.default_payment_method as string | null)
            : null

          const chosen = stripePmList.data.find(pm => pm.id === defaultPmId) || stripePmList.data[0]
          selectedCustomerId = profile.stripe_customer_id
          selectedPaymentMethodId = chosen.id

          // Backfill into local table (同期反映)
          try {
            // まず全てのis_defaultをfalseに
            await supabase
              .from('payment_methods')
              .update({ is_default: false, updated_at: new Date().toISOString() })
              .eq('user_id', user.id)

            // 存在すれば更新、なければ挿入
            const { data: existing } = await supabase
              .from('payment_methods')
              .select('id')
              .eq('user_id', user.id)
              .eq('stripe_payment_method_id', chosen.id)
              .maybeSingle()

            if (existing) {
              await supabase
                .from('payment_methods')
                .update({
                  last4: chosen.card?.last4 || null,
                  brand: chosen.card?.brand || null,
                  exp_month: chosen.card?.exp_month || null,
                  exp_year: chosen.card?.exp_year || null,
                  is_default: true,
                  stripe_customer_id: profile.stripe_customer_id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
            } else {
              await supabase.from('payment_methods').insert({
                user_id: user.id,
                last4: chosen.card?.last4 || null,
                brand: chosen.card?.brand || null,
                exp_month: chosen.card?.exp_month || null,
                exp_year: chosen.card?.exp_year || null,
                cardholder_name: undefined,
                is_default: true,
                stripe_customer_id: profile.stripe_customer_id,
                stripe_payment_method_id: chosen.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            }
          } catch (_) {
            // ignore backfill errors
          }
        }
      }

      if (!selectedCustomerId || !selectedPaymentMethodId) {
        return NextResponse.json({ error: 'No payment method found' }, { status: 400 })
      }
    }

    try {
      // Create payment intent for auto-charge
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // JPY is a zero-decimal currency; use yen as-is
        currency: 'jpy',
        customer: selectedCustomerId!,
        payment_method: selectedPaymentMethodId!,
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

      // Try to surface payment intent info for client-side 3DS handling
      const raw = stripeError?.raw || stripeError
      const pi = raw?.payment_intent as Stripe.PaymentIntent | undefined

      return NextResponse.json({ 
        success: false,
        error: 'Auto-charge failed',
        details: stripeError.message,
        paymentIntentId: pi?.id,
        clientSecret: pi?.client_secret,
        status: pi?.status
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Auto-charge API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }

    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optionally validate user_id param if provided
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('user_id')
    if (userIdParam && userIdParam !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch profile to get stripe customer id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        canAutoCharge: false,
        reason: 'Profile not found'
      })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({
        canAutoCharge: false,
        reason: 'No Stripe customer'
      })
    }

    // List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card'
    })

    if (!paymentMethods.data.length) {
      return NextResponse.json({
        canAutoCharge: false,
        reason: 'No saved payment method'
      })
    }

    // Try to detect default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    const defaultPaymentMethodId = typeof customer !== 'string' && !('deleted' in customer)
      ? (customer.invoice_settings?.default_payment_method as string | null)
      : null

    const chosen = paymentMethods.data.find(pm => pm.id === defaultPaymentMethodId) || paymentMethods.data[0]

    return NextResponse.json({
      canAutoCharge: true,
      paymentMethod: {
        id: chosen.id,
        type: chosen.type,
        card: chosen.card ? {
          brand: chosen.card.brand,
          last4: chosen.card.last4,
          exp_month: chosen.card.exp_month,
          exp_year: chosen.card.exp_year
        } : null
      }
    })
  } catch (error) {
    console.error('Auto-charge check error:', error)
    return NextResponse.json({ error: 'Failed to check auto charge' }, { status: 500 })
  }
}