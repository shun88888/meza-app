import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    stripe_secret_exists: !!process.env.STRIPE_SECRET_KEY,
    stripe_secret_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...',
    stripe_public_exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripe_public_prefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString()
  })
}