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

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      )
    }

    const { amount, challengeId, userId } = await request.json()

    // Validation
    if (!amount || !challengeId || !userId) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    // Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'ユーザープロファイルが見つかりません' },
        { status: 404 }
      )
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
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
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'jpy',
      customer: customerId,
      metadata: {
        challengeId: challengeId,
        userId: userId,
        type: 'penalty_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store payment intent ID in challenge
    const { error: challengeUpdateError } = await supabase
      .from('challenges')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', challengeId)

    if (challengeUpdateError) {
      console.error('Failed to update challenge with payment intent ID:', challengeUpdateError)
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending'
      })

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId
    })

  } catch (error) {
    console.error('Payment intent creation failed:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '決済の作成に失敗しました' },
      { status: 500 }
    )
  }
}