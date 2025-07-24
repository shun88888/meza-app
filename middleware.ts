import { NextRequest, NextResponse } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/',
  '/stats',
  '/history',
  '/settings',
  '/create-challenge',
  '/active-challenge',
  '/challenge',
  '/onboarding',
  '/help',
  '/faq',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/welcome',
  '/privacy',
  '/terms',
  '/about',
  '/blocked',
  '/unauthorized',
  '/external-link-blocked',
  '/signup',
  '/login',
]

// Define blocked routes (deprecated or admin routes)
const blockedRoutes = [
  '/admin',
  '/dev',
  '/profile', // Deprecated, redirect to /settings
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // Skip middleware for API routes, static files, and Next.js internal routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for blocked routes
  const isBlocked = blockedRoutes.some(route => pathname.startsWith(route))
  if (isBlocked) {
    if (pathname.startsWith('/profile')) {
      // Redirect deprecated profile routes to settings
      url.pathname = '/settings'
      return NextResponse.redirect(url)
    } else {
      // Redirect to unauthorized page
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  // Get authentication status from cookies/headers
  const supabaseToken = request.cookies.get('sb-access-token')
  const isAuthenticated = !!supabaseToken

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    url.pathname = '/auth/signin'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth pages to home
  if (isAuthenticated && pathname.startsWith('/auth/') && pathname !== '/auth/callback') {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Allow access to public routes regardless of authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For unknown routes not covered above, redirect to not-found
  if (!isProtectedRoute && !isPublicRoute) {
    url.pathname = '/not-found'
    return NextResponse.redirect(url)
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent content type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (adjust based on your needs)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://nominatim.openstreetmap.org https://api.mapbox.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}