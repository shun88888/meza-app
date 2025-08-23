import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    // Increase resilience to transient network issues
    maxNetworkRetries: 5,
    timeout: 30000, // Reduce timeout for faster failure detection
    // Force IPv4 to avoid IPv6 issues
    host: 'api.stripe.com',
    protocol: 'https',
  })
}

// Enhanced exponential backoff retry helper for transient errors
async function withRetries<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelayMs: number = 500
): Promise<T> {
  let attempt = 0
  let lastError: any
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(`Attempt ${attempt + 1}/${retries + 1}`)
      const result = await fn()
      console.log(`Attempt ${attempt + 1} succeeded`)
      return result
    } catch (error: any) {
      lastError = error
      attempt += 1
      console.log(`Attempt ${attempt} failed:`, error.message, error.type)
      
      const isStripeError = error && (error as any).type
      const status = (error as any)?.statusCode as number | undefined
      const retriable =
        // Stripe connection/server errors
        (isStripeError && (
          (error as any).type === 'StripeConnectionError' ||
          (error as any).type === 'api_connection_error' ||
          (error as any).type === 'api_error' ||
          (error as any).type === 'rate_limit_error'
        )) ||
        // Generic 5xx
        (typeof status === 'number' && status >= 500) ||
        // Network timeouts
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ENOTFOUND')

      if (!retriable || attempt > retries) {
        console.log(`Giving up after ${attempt} attempts. Not retriable: ${!retriable}`)
        throw lastError
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.log(`Waiting ${delay}ms before retry...`)
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
  console.log('POST /api/payment/methods - Starting request')
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Stripe configured:', !!stripe)
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  // Check if Stripe is configured
  if (!stripe) {
    console.error('Stripe not configured - STRIPE_SECRET_KEY missing')
    return NextResponse.json(
      { error: 'Payment service is not configured - Stripe keys not found' },
      { status: 503 }
    )
  }

  // Validate Stripe key format
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey && !stripeKey.startsWith('sk_')) {
    console.error('Invalid Stripe secret key format - should start with sk_')
    return NextResponse.json(
      { error: 'Invalid Stripe configuration' },
      { status: 400 }
    )
  }

  try {
    console.log('Creating Supabase client...')
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('User check result:', { user: !!user, error: !!userError })
    if (userError) {
      console.error('User auth error:', userError)
    }

    if (userError || !user) {
      console.log('Returning 401 - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    console.log('Fetching user profile for user ID:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    console.log('Profile fetch result:', { profile: !!profile, error: !!profileError })
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id
    console.log('Existing customer ID:', customerId)

    // Create customer if not exists
    if (!customerId) {
      console.log('Creating new Stripe customer...')
      try {
        const customer = await withRetries(() =>
          stripe!.customers.create({
            email: profile.email,
            metadata: {
              userId: user.id
            }
          })
        )
        
        customerId = customer.id
        console.log('Created customer with ID:', customerId)

        // Update profile with customer ID
        const updateResult = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
        
        console.log('Profile update result:', updateResult)
      } catch (customerError) {
        console.error('Customer creation error:', customerError)
        throw customerError
      }
    }

    // Create SetupIntent for secure card saving
    console.log('Creating SetupIntent for customer:', customerId)
    try {
      const setupIntent = await withRetries(() => {
        console.log('Attempting to create SetupIntent...')
        return stripe!.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
          // Add metadata for debugging
          metadata: {
            created_by: 'api',
            user_id: user.id,
            timestamp: new Date().toISOString()
          }
        })
      }, 4, 1000) // 4 retries with 1s base delay

      console.log('SetupIntent created successfully:', setupIntent.id)
      return NextResponse.json({ 
        clientSecret: setupIntent.client_secret
      })
    } catch (setupError) {
      console.error('SetupIntent creation error after retries:', setupError)
      
      // Detailed error logging
      if (setupError instanceof Error) {
        console.error('Error name:', setupError.name)
        console.error('Error stack:', setupError.stack)
      }
      
      throw setupError
    }

  } catch (error) {
    console.error('Error creating setup intent:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode
      })
      return NextResponse.json({
        error: `Stripe error: ${error.message}`,
        type: error.type,
        code: error.code
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create setup intent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service is not configured' },
      { status: 503 }
    )
  }

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

    // Get user's customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (setAsDefault) {
      // Update default payment method in Stripe
      const idemKey = `set_default_${paymentMethodId}_${user.id}`
      await withRetries(() =>
        stripe!.customers.update(
          profile.stripe_customer_id,
          {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          },
          { idempotencyKey: idemKey }
        )
      )

      // Sync Supabase flags
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
      message: 'Payment method updated successfully'
    })

  } catch (error) {
    console.error('Error updating payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: `Stripe error: ${error.message}`
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update payment method' },
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