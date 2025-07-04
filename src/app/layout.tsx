import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Meza - 位置ベースペナルティアラーム',
  description: '朝活をサポートする位置ベースペナルティアラームアプリ - 起床時刻に指定場所に移動しないとペナルティが発生',
  manifest: '/manifest.json',
  keywords: ['朝活', 'アラーム', '位置情報', 'ペナルティ', 'PWA', 'モバイル'],
  authors: [{ name: 'Meza Team' }],
  creator: 'Meza',
  publisher: 'Meza',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meza',
    startupImage: [
      { url: '/icon-512x512.png', media: '(device-width: 414px) and (device-height: 896px)' }
    ]
  },
  openGraph: {
    type: 'website',
    siteName: 'Meza',
    title: 'Meza - 位置ベースペナルティアラーム',
    description: '朝活をサポートする位置ベースペナルティアラームアプリ',
    images: [{ url: '/icon-512x512.png', width: 512, height: 512, alt: 'Meza App' }]
  },
  twitter: {
    card: 'summary',
    title: 'Meza - 位置ベースペナルティアラーム',
    description: '朝活をサポートする位置ベースペナルティアラームアプリ',
    images: ['/icon-512x512.png']
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  minimumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#FED7AA'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#FED7AA" />
        <meta name="msapplication-navbutton-color" content="#FED7AA" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen-mobile touch-manipulation overflow-x-hidden`}>
        {/* 背景レイヤー - Safe Area全体をカバー */}
        <div className="fixed inset-0 bg-gradient-to-br from-orange-100 to-yellow-100 -z-10" />
        
        {/* メインコンテンツ - Safe Area対応 */}
        <div className="min-h-screen-mobile pt-safe pb-safe w-full overflow-x-hidden relative z-10">
          {children}
        </div>
        
        {/* モバイル最適化されたService Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('✅ Service Worker registered successfully:', registration);
                      
                      // PWAアップデート検出
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('🔄 New app version available! Please refresh.');
                            }
                          });
                        }
                      });
                    })
                    .catch((error) => {
                      console.error('❌ Service Worker registration failed:', error);
                    });
                });
                
                // Service Workerメッセージ受信
                navigator.serviceWorker.addEventListener('message', (event) => {
                  console.log('📩 Message from SW:', event.data);
                });
              }
              
              // モバイル専用初期化
              if (typeof window !== 'undefined') {
                // タッチ遅延防止
                document.addEventListener('touchstart', function() {}, { passive: true });
                
                // 画面向き変更対応
                window.addEventListener('orientationchange', () => {
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                  }, 100);
                });
                
                // iOS PWA対応
                if (window.navigator.standalone) {
                  document.body.classList.add('standalone-app');
                }
                
                // PWAインストール可能性の確認とプロンプト表示
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', (e) => {
                  e.preventDefault();
                  deferredPrompt = e;
                  
                  // モバイルデバイスかつまだインストールしていない場合に通知表示
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
                  
                  if (isMobile && !isStandalone) {
                    setTimeout(() => {
                      console.log('💡 PWAインストール可能: ブラウザメニューから「ホーム画面に追加」してください');
                    }, 3000);
                  }
                });
                
                // PWAインストール完了時
                window.addEventListener('appinstalled', () => {
                  console.log('✅ PWA successfully installed');
                  deferredPrompt = null;
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
} 