import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }

    const { userId, paymentMethodId } = await request.json()

    console.log('Setup payment method request:', { userId, paymentMethodId })

    // Validation
    if (!userId || !paymentMethodId) {
      console.error('Missing required parameters:', { userId, paymentMethodId })
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    // Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // Check if user ID matches
    if (user.id !== userId) {
      console.error('User ID mismatch:', { authenticated: user.id, requested: userId })
      return NextResponse.json(
        { error: 'ユーザーIDが一致しません' },
        { status: 403 }
      )
    }

    console.log('Authenticated user:', user.id)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    let userProfile = profile

    // If profile doesn't exist, it should be created by database trigger
    // If still not found, wait briefly and try again
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found, waiting for database trigger to create it...')
      
      // Wait for database trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try to fetch the profile again
      const { data: retryProfile, error: retryError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', userId)
        .single()

      if (retryError && retryError.code === 'PGRST116') {
        // Profile still doesn't exist, create it manually using service role
        console.log('Creating profile manually for user:', userId)
        
        // Use service role client to bypass RLS
        const supabaseAdmin = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        const { error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: user.email || '',
          })

        if (createError) {
          console.error('Profile creation error:', createError)
          console.error('Error details:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          })
          return NextResponse.json(
            { error: 'プロファイルの作成に失敗しました', details: createError.message },
            { status: 500 }
          )
        }

        // Get the newly created profile
        const { data: newProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('stripe_customer_id, email')
          .eq('id', userId)
          .single()

        if (fetchError) {
          console.error('Error fetching new profile:', fetchError)
          return NextResponse.json(
            { error: 'プロファイルの取得に失敗しました' },
            { status: 500 }
          )
        }

        userProfile = newProfile
      } else if (retryError) {
        console.error('Profile retry fetch error:', retryError)
        return NextResponse.json(
          { error: 'プロファイルの取得に失敗しました' },
          { status: 500 }
        )
      } else {
        userProfile = retryProfile
      }
    } else if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'プロファイルの取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'ユーザープロファイルが見つかりません' },
        { status: 404 }
      )
    }

    let customerId = userProfile.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: userId
        }
      })
      
      customerId = customer.id

      // Update profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update profile with customer ID:', updateError)
        return NextResponse.json(
          { error: 'Stripeカスタマー情報の更新に失敗しました' },
          { status: 500 }
        )
      }
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Get the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card,
      },
      customerId: customerId
    })

  } catch (error) {
    console.error('Failed to setup payment method:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'カード登録に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Get customer's payment methods
export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    // Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get user profile with customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile || !profile.stripe_customer_id) {
      return NextResponse.json({
        hasPaymentMethod: false,
        paymentMethods: []
      })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    })

    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      } : null
    }))

    return NextResponse.json({
      hasPaymentMethod: paymentMethods.data.length > 0,
      paymentMethods: formattedPaymentMethods,
      customerId: profile.stripe_customer_id
    })

  } catch (error) {
    console.error('Failed to get payment methods:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'カード情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}