import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    
    // Skip middleware for static files and API routes that don't need auth
    const { pathname } = req.nextUrl
    
    // Static files and public assets
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico' ||
      pathname === '/manifest.json' ||
      pathname.startsWith('/icon-')
    ) {
      return res
    }

    // Create Supabase client only if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return res
    }

    const supabase = createMiddlewareClient<Database>({ req, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Supabase auth error in middleware:', error)
      // Don't block the request, just log the error
      return res
    }

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
      // Redirect to signin page for unauthenticated users
      const redirectUrl = new URL('/auth/signin', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // User is authenticated, allow access
    return res

  } catch (error) {
    console.error('Middleware error:', error)
    // Don't block the request even if middleware fails
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}