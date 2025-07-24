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

    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent IDが必要です' },
        { status: 400 }
      )
    }

    // Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json(
        { error: '決済情報が見つかりません' },
        { status: 404 }
      )
    }

    const challengeId = paymentIntent.metadata.challengeId
    const userId = paymentIntent.metadata.userId

    if (!challengeId || !userId) {
      return NextResponse.json(
        { error: '決済のメタデータが不正です' },
        { status: 400 }
      )
    }

    // Update payment status in database
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ 
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed'
      })
      .eq('stripe_payment_intent_id', paymentIntentId)

    if (paymentUpdateError) {
      console.error('Failed to update payment status:', paymentUpdateError)
    }

    // If payment succeeded, update challenge status
    if (paymentIntent.status === 'succeeded') {
      const { error: challengeUpdateError } = await supabase
        .from('challenges')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', challengeId)

      if (challengeUpdateError) {
        console.error('Failed to update challenge status:', challengeUpdateError)
        return NextResponse.json(
          { error: 'チャレンジステータスの更新に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        message: '決済が完了しました。チャレンジは失敗扱いとなります。'
      })
    } else {
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        message: '決済が完了していません。'
      })
    }

  } catch (error) {
    console.error('Payment confirmation failed:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '決済確認に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent_id')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent IDが必要です' },
        { status: 400 }
      )
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata
    })

  } catch (error) {
    console.error('Payment intent retrieval failed:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe エラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '決済情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}