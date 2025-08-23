import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

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
  // Allow challenge failure page regardless of auth/session state
  '/challenge-failed',
  '/not-found',
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

  // Get authentication status using proper Supabase middleware client
  let isAuthenticated = false
  let currentUser = null
  
  try {
    const response = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res: response })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!error && user) {
      isAuthenticated = true
      currentUser = user
    }
  } catch (error) {
    // Auth check failed, treat as unauthenticated
    isAuthenticated = false
  }

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

  // アクティブチャレンジの強制誘導チェック（認証済みユーザーのみ）
  if (isAuthenticated && isProtectedRoute && currentUser) {
    try {
      const response = await checkActiveChallenge(request, pathname, currentUser.id)
      if (response) {
        return response
      }
    } catch (error) {
      // アクティブチャレンジチェックでエラーが発生してもページアクセスは継続
      console.warn('Active challenge check failed:', error)
    }
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

// アクティブチャレンジチェック関数
async function checkActiveChallenge(request: NextRequest, pathname: string, userId: string): Promise<NextResponse | null> {
  // チャレンジ関連ページは除外（無限リダイレクト防止）
  const challengePages = [
    '/active-challenge',
    '/challenge/',
    '/challenge-failed',
    '/settings',
    '/api'
  ]
  
  const isChallengePage = challengePages.some(page => pathname.startsWith(page))
  if (isChallengePage) {
    return null
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return null
    }

    // Service Roleクライアントでアクティブチャレンジをチェック
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // アクティブチャレンジの有無をチェック
    const { data: activeChallenge, error } = await supabase
      .from('challenges')
      .select('id, ends_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // データベースエラー（not foundは正常）
      return null
    }

    if (activeChallenge) {
      // アクティブチャレンジが存在する場合
      const now = new Date()
      const endsAt = new Date(activeChallenge.ends_at)
      
      if (now <= endsAt) {
        // まだ時間内の場合、チャレンジページに誘導
        const url = request.nextUrl.clone()
        url.pathname = `/challenge/${activeChallenge.id}`
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
      }
      // 時間切れの場合はEdge Functionに処理を任せる
    }

    return null
  } catch (error) {
    console.warn('Active challenge middleware error:', error)
    return null
  }
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