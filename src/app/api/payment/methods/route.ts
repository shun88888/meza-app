import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    // Increase resilience to transient network issues
    maxNetworkRetries: 3,
    timeout: 60000,
  })
}

// Simple exponential backoff retry helper for transient errors
async function withRetries<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  baseDelayMs: number = 300
): Promise<T> {
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (error: any) {
      attempt += 1
      const isStripeError = error && (error as any).type
      const status = (error as any)?.statusCode as number | undefined
      const retriable =
        // Stripe connection/server errors
        (isStripeError && (
          (error as any).type === 'api_connection_error' ||
          (error as any).type === 'api_error' ||
          (error as any).type === 'rate_limit_error'
        )) ||
        // Generic 5xx
        (typeof status === 'number' && status >= 500)

      if (!retriable || attempt > retries) {
        throw error
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

export async function GET(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    // In production without STRIPE_SECRET_KEY, return empty list gracefully
    return NextResponse.json({
      paymentMethods: [],
      hasDefaultMethod: false
    })
  }
  // At this point, stripe is guaranteed to be non-null

  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ 
        paymentMethods: [],
        hasDefaultMethod: false 
      })
    }

    // Get payment methods from Stripe (with retry)
    const paymentMethods = await withRetries(() =>
      stripe!.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
      })
    )

    // Get customer to check default payment method (with retry)
    const customer = await withRetries(() =>
      stripe!.customers.retrieve(profile.stripe_customer_id)
    )
    
    const defaultPaymentMethodId = typeof customer !== 'string' && !('deleted' in customer) && customer.invoice_settings?.default_payment_method
      ? customer.invoice_settings.default_payment_method
      : null

    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || '',
      last4: pm.card?.last4 || '',
      exp_month: pm.card?.exp_month || 0,
      exp_year: pm.card?.exp_year || 0,
      isDefault: pm.id === defaultPaymentMethodId
    }))

    return NextResponse.json({
      paymentMethods: formattedMethods,
      hasDefaultMethod: !!defaultPaymentMethodId
    })

  } catch (error) {
    console.error('Error fetching payment methods:', error)
    // 本番でStripe接続や顧客未整合があってもUIを壊さない
    return NextResponse.json({
      paymentMethods: [],
      hasDefaultMethod: false
    })
  }
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

    const { paymentMethodId, setAsDefault } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          userId: user.id
        }
      })
      
      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Attach payment method to customer if needed
    const existingPm = await withRetries(() =>
      stripe!.paymentMethods.retrieve(paymentMethodId)
    )
    if (existingPm.customer && existingPm.customer !== customerId) {
      return NextResponse.json({
        error: 'This payment method is already attached to another customer'
      }, { status: 400 })
    }

    if (!existingPm.customer) {
      const idemKey = `attach_${paymentMethodId}_${user.id}`
      await withRetries(() =>
        stripe!.paymentMethods.attach(
          paymentMethodId,
          { customer: customerId },
          { idempotencyKey: idemKey }
        )
      )
    }

    // Ensure local record exists (upsert minimal fields)
    const attachedPm = await withRetries(() =>
      stripe!.paymentMethods.retrieve(paymentMethodId)
    )
    if (attachedPm && attachedPm.type === 'card' && attachedPm.card) {
      const { data: existing } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', user.id)
        .eq('stripe_payment_method_id', paymentMethodId)
        .maybeSingle()

      if (!existing) {
        await supabase
          .from('payment_methods')
          .insert({
            user_id: user.id,
            last4: attachedPm.card.last4,
            brand: attachedPm.card.brand,
            exp_month: attachedPm.card.exp_month,
            exp_year: attachedPm.card.exp_year,
            cardholder_name: undefined,
            is_default: false,
            stripe_customer_id: customerId,
            stripe_payment_method_id: attachedPm.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
    }

    // Set as default if requested
    if (setAsDefault) {
      const idemKey = `set_default_${paymentMethodId}_${user.id}`
      await withRetries(() =>
        stripe!.customers.update(
          customerId,
          {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          },
          { idempotencyKey: idemKey }
        )
      )

      // Supabase側のデフォルトフラグも同期
      await supabase
        .from('payment_methods')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      await supabase
        .from('payment_methods')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('stripe_payment_method_id', paymentMethodId)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment method added successfully'
    })

  } catch (error) {
    console.error('Error adding payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('paymentMethodId')

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 })
    }

    // Get the payment method to verify ownership
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    // Get user's customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id || paymentMethod.customer !== profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Payment method not found or unauthorized' }, { status: 404 })
    }

    // Check if this payment method is default
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    const defaultPaymentMethodId = typeof customer !== 'string' && !('deleted' in customer)
      ? (customer.invoice_settings?.default_payment_method as string | null)
      : null
    const wasDefault = defaultPaymentMethodId === paymentMethodId

    // Detach payment method on Stripe
    await stripe.paymentMethods.detach(paymentMethodId)

    // Remove from local DB as well
    await supabase
      .from('payment_methods')
      .delete()
      .eq('user_id', user.id)
      .eq('stripe_payment_method_id', paymentMethodId)

    // If it was default, pick another as default (Stripe + Supabase)
    if (wasDefault) {
      const remaining = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
      })

      if (remaining.data.length > 0) {
        const newDefault = remaining.data[0]
        await stripe.customers.update(profile.stripe_customer_id, {
          invoice_settings: { default_payment_method: newDefault.id },
        })

        // Sync Supabase flags
        await supabase
          .from('payment_methods')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)

        const { data: existing } = await supabase
          .from('payment_methods')
          .select('id')
          .eq('user_id', user.id)
          .eq('stripe_payment_method_id', newDefault.id)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('payment_methods')
            .update({ is_default: true, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else if (newDefault.card) {
          await supabase
            .from('payment_methods')
            .insert({
              user_id: user.id,
              last4: newDefault.card.last4,
              brand: newDefault.card.brand,
              exp_month: newDefault.card.exp_month,
              exp_year: newDefault.card.exp_year,
              is_default: true,
              stripe_customer_id: profile.stripe_customer_id,
              stripe_payment_method_id: newDefault.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment method removed successfully'
    })

  } catch (error) {
    console.error('Error removing payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    )
  }
}