import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  const debug = {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_EXISTS: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PREFIX: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) + '...',
    SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString(),
    stripeConnection: null as any
  }

  // Test Stripe connection
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const testStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        maxNetworkRetries: 2,
        timeout: 10000,
      })

      // Try a simple API call
      const balance = await testStripe.balance.retrieve()
      debug.stripeConnection = {
        status: 'success',
        available: balance.available.length > 0,
        currency: balance.available[0]?.currency || 'unknown'
      }
    } catch (error: any) {
      debug.stripeConnection = {
        status: 'error',
        error: error.message,
        type: error.type || 'unknown'
      }
    }
  }

  console.log('Debug info:', debug)
  
  return NextResponse.json(debug)
}