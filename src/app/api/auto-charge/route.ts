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

    const { challengeId, userId, amount } = await request.json()

    // Validation
    if (!challengeId || !userId || !amount) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    // Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get user profile with customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile || !profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'ユーザー情報またはカード情報が見つかりません' },
        { status: 404 }
      )
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    
    if (!customer || customer.deleted) {
      return NextResponse.json(
        { error: 'カスタマー情報が見つかりません' },
        { status: 404 }
      )
    }

    const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method

    if (!defaultPaymentMethodId) {
      return NextResponse.json(
        { error: 'デフォルトの支払い方法が設定されていません' },
        { status: 400 }
      )
    }

    // Create and confirm payment intent immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'jpy',
      customer: profile.stripe_customer_id,
      payment_method: defaultPaymentMethodId as string,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/challenge/${challengeId}/payment-success`,
      metadata: {
        challengeId: challengeId,
        userId: userId,
        type: 'auto_penalty_payment'
      }
    })

    // Update challenge with payment intent ID
    const { error: challengeUpdateError } = await supabase
      .from('challenges')
      .update({ 
        payment_intent_id: paymentIntent.id,
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId)

    if (challengeUpdateError) {
      console.error('Failed to update challenge:', challengeUpdateError)
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending'
      })

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
    }

    // Handle different payment intent statuses
    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        status: 'succeeded',
        paymentIntentId: paymentIntent.id,
        message: 'ペナルティ料金の自動引き落としが完了しました'
      })
    } else if (paymentIntent.status === 'requires_action' && paymentIntent.next_action) {
      return NextResponse.json({
        success: false,
        status: 'requires_action',
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
        message: '追加認証が必要です'
      })
    } else {
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        message: '自動引き落としに失敗しました'
      })
    }

  } catch (error) {
    console.error('Auto charge failed:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      // Handle specific Stripe errors
      if (error.code === 'card_declined') {
        return NextResponse.json(
          { 
            error: 'カードが拒否されました。カード情報を確認してください。',
            errorCode: 'card_declined'
          },
          { status: 400 }
        )
      } else if (error.code === 'insufficient_funds') {
        return NextResponse.json(
          { 
            error: '残高不足です。',
            errorCode: 'insufficient_funds'
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `決済エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '自動引き落としに失敗しました' },
      { status: 500 }
    )
  }
}

// Check if auto charge is possible
export async function GET(request: NextRequest) {
  try {
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
        canAutoCharge: false,
        reason: 'カード情報が登録されていません'
      })
    }

    // Check if customer has default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    
    if (!customer || customer.deleted) {
      return NextResponse.json({
        canAutoCharge: false,
        reason: 'カスタマー情報が見つかりません'
      })
    }

    const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method

    if (!defaultPaymentMethodId) {
      return NextResponse.json({
        canAutoCharge: false,
        reason: 'デフォルトの支払い方法が設定されていません'
      })
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId as string)

    return NextResponse.json({
      canAutoCharge: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        } : null
      }
    })

  } catch (error) {
    console.error('Failed to check auto charge capability:', error)
    
    return NextResponse.json({
      canAutoCharge: false,
      reason: 'チェックに失敗しました'
    })
  }
}