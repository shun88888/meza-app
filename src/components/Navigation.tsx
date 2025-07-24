'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { InteractiveMenu, InteractiveMenuItem } from '@/components/ui/modern-mobile-menu'
import { Home, BarChart3, History, User, Settings } from 'lucide-react'
import { useNavigationGuard } from '@/hooks/useNavigationGuard'

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { guardedPush } = useNavigationGuard({
    enableExternalLinkBlocking: true,
    enableRouteGuarding: true,
    showBlockedMessage: true,
  })

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        // If user is not authenticated and on a protected route, redirect to signin
        if (!currentUser && !isPublicRoute(pathname)) {
          router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
          return
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [pathname, router])

  const isPublicRoute = (path: string) => {
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/callback',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/signup',
      '/login',
      '/welcome',
      '/settings',
      '/privacy',
      '/terms',
      '/about'
    ]
    return publicRoutes.includes(path) || publicRoutes.some(route => path.startsWith(route + '/'))
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Bottom navigation items
  const bottomNavItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/stats', label: '統計', icon: '🔐' },
    { href: '/history', label: '履歴', icon: '📅' },
    { href: '/settings', label: '設定', icon: '⚙️' },
  ]

  // Modern mobile menu items
  const mobileMenuItems: InteractiveMenuItem[] = [
    { label: 'ホーム', icon: Home },
    { label: '統計', icon: BarChart3 },
    { label: '履歴', icon: History },
    { label: '設定', icon: Settings },
  ]

  // Navigation routes for menu items
  const navigationRoutes = [
    '/',
    '/stats',
    '/history',
    '/settings',
  ]

  const handleMenuItemClick = (index: number, title: string) => {
    guardedPush(navigationRoutes[index])
  }

  const menuItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/create-challenge', label: 'チャレンジ作成', icon: '🎯' },
    { href: '/active-challenge', label: 'アクティブチャレンジ', icon: '⚡' },
    { href: '/history', label: '履歴', icon: '📋' },
    { href: '/stats', label: '統計', icon: '📊' },
    { href: '/profile', label: 'プロフィール', icon: '👤' },
    { href: '/help', label: 'ヘルプ', icon: '❓' },
  ]

  const authMenuItems = [
    { href: '/auth/signin', label: 'ログイン', icon: '🔐' },
    { href: '/auth/signup', label: '新規登録', icon: '✨' },
  ]

  // Don't show navigation on certain pages
  const hideNavigation = [
    '/welcome',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/onboarding',
    '/signup',
    '/login'
  ].some(path => pathname.startsWith(path))

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-black dark:text-white text-lg">読み込み中...</div>
      </div>
    )
  }

  // Don't show navigation on auth pages
  if (hideNavigation) {
    return <>{children}</>
  }

  // If user is not authenticated and on a protected route, show loading
  if (!user && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-black dark:text-white text-lg">認証中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Main Content */}
      <main className="pb-20 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation - Only show for authenticated users */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 pb-safe">
          <div className="flex justify-center py-3">
            <div className="w-full max-w-sm">
              <div onClick={(e) => {
                const target = e.target as HTMLElement;
                const button = target.closest('button');
                if (button) {
                  const index = Array.from(button.parentElement?.children || []).indexOf(button);
                  if (index !== -1) {
                    handleMenuItemClick(index, mobileMenuItems[index]?.label || '');
                  }
                }
              }}>
                <InteractiveMenu 
                  items={mobileMenuItems}
                  accentColor="var(--primary)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 