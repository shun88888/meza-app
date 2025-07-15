import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
// CSS読み込み順序を最適化 - leafletを先に読み込み
import 'leaflet/dist/leaflet.css'
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
  },
  other: {
    'msapplication-navbutton-color': '#FED7AA',
    'apple-mobile-web-app-status-bar-style': 'default'
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
        {/* Critical CSS - FOUC防止のため最優先で読み込み */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical Base Styles */
            *, *::before, *::after { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
            body { 
              font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.5; 
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              overflow-x: hidden;
              background: linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%);
            }
            
            /* Critical Leaflet Styles */
            .leaflet-container {
              height: 100% !important;
              width: 100% !important;
              position: relative;
              background: #ddd;
            }
            .leaflet-tile-pane { z-index: 1; }
            .leaflet-map-pane { z-index: 1; position: relative; }
            .leaflet-tile { width: 256px; height: 256px; }
            
            /* Critical Loading Styles */
            .loading-container {
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f3f4f6;
              color: #6b7280;
              font-size: 14px;
            }
            
            /* Critical Safe Area */
            .pt-safe { padding-top: env(safe-area-inset-top); }
            .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            .min-h-screen-mobile { 
              min-height: 100vh; 
              min-height: 100dvh; 
            }
            
            /* Critical Touch Optimization */
            button, a, [role="button"] {
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }
          `
        }} />
        
        {/* CSS Preloading */}
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        <link rel="preload" href="/_next/static/css/app/globals.css" as="style" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen-mobile touch-manipulation overflow-x-hidden`}>
        {/* 背景レイヤー - Safe Area全体をカバー */}
        <div className="fixed inset-0 bg-gradient-to-br from-orange-100 to-yellow-100 -z-10" />
        
        {/* メインコンテンツ - Safe Area対応 */}
        <div className="min-h-screen-mobile pt-safe pb-safe w-full overflow-x-hidden relative z-10">
          {children}
        </div>
        
        {/* CSS読み込み監視とフォールバック */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // CSS読み込み失敗検知とフォールバック
              (function() {
                const cssLoadTimeout = 5000; // 5秒タイムアウト
                const checkCSSLoad = () => {
                  const links = document.querySelectorAll('link[rel="stylesheet"]');
                  let loadedCount = 0;
                  let totalCount = links.length;
                  
                  if (totalCount === 0) return;
                  
                  const fallbackCSS = \`
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
                    .loading-container { 
                      display: flex; align-items: center; justify-content: center; 
                      background: #f3f4f6; color: #6b7280; padding: 20px; 
                    }
                    .leaflet-container { background: #ddd; position: relative; }
                  \`;
                  
                  const applyFallback = () => {
                    const style = document.createElement('style');
                    style.textContent = fallbackCSS;
                    document.head.appendChild(style);
                    console.warn('CSS読み込み失敗 - フォールバックスタイルを適用');
                  };
                  
                  links.forEach(link => {
                    link.addEventListener('load', () => {
                      loadedCount++;
                      if (loadedCount === totalCount) {
                        console.log('すべてのCSSが正常に読み込まれました');
                      }
                    });
                    
                    link.addEventListener('error', () => {
                      console.warn('CSS読み込み失敗:', link.href);
                      applyFallback();
                    });
                  });
                  
                  // タイムアウト監視
                  setTimeout(() => {
                    if (loadedCount < totalCount) {
                      console.warn('CSS読み込みタイムアウト - フォールバックを適用');
                      applyFallback();
                    }
                  }, cssLoadTimeout);
                };
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', checkCSSLoad);
                } else {
                  checkCSSLoad();
                }
              })();
            `
          }}
        />
        
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