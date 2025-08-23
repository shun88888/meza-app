import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import Navigation from '@/components/Navigation'
import DatabaseSetup from '@/components/DatabaseSetup'
import React from 'react'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'Meza - 位置ベースペナルティアラーム',
  description: '朝活をサポートする位置ベースペナルティアラームアプリ - 起床時刻に指定場所に移動しないとペナルティが発生',
  authors: [{ name: 'Meza Team' }],
  manifest: '/manifest.json',
  keywords: ['朝活', 'アラーム', '位置情報', 'ペナルティ', 'PWA', 'モバイル'],
  creator: 'Meza',
  publisher: 'Meza',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meza',
    startupImage: [
      {
        url: '/icon-512x512.png',
        media: '(device-width: 414px) and (device-height: 896px)',
      },
    ],
  },
  openGraph: {
    title: 'Meza - 位置ベースペナルティアラーム',
    description: '朝活をサポートする位置ベースペナルティアラームアプリ',
    siteName: 'Meza',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Meza App',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Meza - 位置ベースペナルティアラーム',
    description: '朝活をサポートする位置ベースペナルティアラームアプリ',
    images: ['/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

// Global error handling setup component
function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    // Setup global error handlers
    React.useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection:', event.reason)
        
        // Handle chunk load errors specifically
        if (event.reason?.name === 'ChunkLoadError' || 
            event.reason?.message?.includes('Loading chunk')) {
          console.log('Chunk load error detected, reloading page...')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      }

      const handleError = (event: ErrorEvent) => {
        console.error('Global error:', event.error)
        
        // Handle chunk load errors
        if (event.error?.name === 'ChunkLoadError' || 
            event.error?.message?.includes('Loading chunk')) {
          console.log('Chunk load error detected, reloading page...')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      }

      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      window.addEventListener('error', handleError)

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        window.removeEventListener('error', handleError)
      }
    }, [])
  }

  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFFFFF" />
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? null : (
          <script dangerouslySetInnerHTML={{__html: "console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');"}} />
        )}
        {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? null : (
          <script dangerouslySetInnerHTML={{__html: "console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');"}} />
        )}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* preload for marker removed to avoid console warnings on non-map pages */}
      </head>
      <body className={`${inter.className} antialiased min-h-screen-mobile touch-manipulation overflow-x-hidden`} style={{scrollBehavior: 'auto'}}>
        <ErrorBoundary>
          <GlobalErrorHandler>
            <DatabaseSetup />
            <Navigation>
              {children}
            </Navigation>
          </GlobalErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  )
} 