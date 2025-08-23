import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {

    console.log('🧪 Testing Stripe connection...')

    const stripeKey = process.env.STRIPE_SECRET_KEY
    
    if (!stripeKey) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not configured',
        hasKey: false
      })
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Stripeの接続をテスト
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      stripe: {
        accountId: account.id,
        country: account.country,
        defaultCurrency: account.default_currency,
        hasKey: true,
        keyType: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
      }
    })

  } catch (error: any) {
    console.error('Stripe test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hasKey: !!process.env.STRIPE_SECRET_KEY
    }, { status: 500 })
  }
}