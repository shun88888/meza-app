import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/signup',
    '/login',
    '/welcome',
    '/help',
    '/privacy',
    '/terms',
    '/about'
  ]

  // API routes that don't require authentication
  const publicApiRoutes = [
    '/api/webhooks/stripe',
    '/api/health',
    '/api/auth'
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname) || 
                       publicRoutes.some(route => pathname.startsWith(route + '/'))
  
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // If it's a public route or public API route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return res
  }

  // For protected routes, check authentication
  if (!session) {
    // If accessing an API route, return 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // For web routes, redirect to sign in with the intended destination
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // User is authenticated, check for onboarding completion
  if (pathname.startsWith('/onboarding')) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      // Profile doesn't exist, user needs onboarding
      return res
    }

    // User has profile, redirect to main app
    if (pathname === '/onboarding') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check for payment method requirement on certain routes
  const paymentRequiredRoutes = ['/create-challenge', '/challenge']
  
  if (paymentRequiredRoutes.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      // No payment method setup, redirect to payment setup
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/profile/payment-methods'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}