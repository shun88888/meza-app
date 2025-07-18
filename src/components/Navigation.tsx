'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/supabase'

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

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
      '/help',
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
    { href: '/stats', label: '統計', icon: '📊' },
    { href: '/history', label: '履歴', icon: '📋' },
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/profile', label: 'プロフィール', icon: '👤' },
  ]

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">読み込み中...</div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">認証中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
        <div className="px-4 py-3 pt-safe">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-semibold">Meza</span>
            </Link>

            {/* Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="メニューを開く"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-800 z-50 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 pt-safe">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-semibold">メニュー</h2>
            <button
              onClick={closeMenu}
              className="p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="メニューを閉じる"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{user.email}</p>
                  <p className="text-slate-400 text-sm">ログイン中</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {user ? (
              <>
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                
                {/* Divider */}
                <div className="border-t border-slate-600 my-4" />
                
                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300 w-full"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-medium">ログアウト</span>
                </button>
              </>
            ) : (
              <>
                {authMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pb-20 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation - Only show for authenticated users */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 pb-safe">
          <div className="flex items-center justify-around px-4 py-2">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'text-orange-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
} 