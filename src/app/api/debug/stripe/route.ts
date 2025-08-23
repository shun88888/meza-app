import { NextResponse } from 'next/server'

export async function GET() {
  const debug = {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_EXISTS: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PREFIX: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) + '...',
    SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString()
  }

  console.log('Debug info:', debug)
  
  return NextResponse.json(debug)
}