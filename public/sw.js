const CACHE_NAME = 'meza-app-v1.3.0-mobile-optimized';
const STATIC_CACHE_NAME = 'meza-static-v1.3.0';
const DYNAMIC_CACHE_NAME = 'meza-dynamic-v1.3.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/login',
  '/create-challenge',
  '/active-challenge',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/marker-icon.png',
  '/marker-icon-2x.png',
  '/marker-shadow.png'
];

// CSS専用キャッシュパターン
const CSS_CACHE_PATTERNS = [
  /\/_next\/static\/css\//,
  /\/css\//,
  /leaflet.*\.css/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// API キャッシュ除外リスト
const EXCLUDE_CACHE = [
  '/api/',
  '/_next/webpack-hmr',
  '/socket.io/',
  'chrome-extension://',
  'safari-extension://'
];

// インストール時
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// アクティベート時
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// フェッチイベント（モバイル最適化）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // キャッシュ除外チェック
  if (EXCLUDE_CACHE.some(path => url.pathname.includes(path))) {
    return;
  }

  // モバイル専用キャッシュ戦略
  if (request.method === 'GET') {
    // CSS ファイルに対する特別な処理
    const isCSS = CSS_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // CSSファイルの場合はキャッシュ優先
          if (cachedResponse && isCSS) {
            // CSSは安定性重視でキャッシュを優先
            return cachedResponse;
          }
          
          // キャッシュがある場合（CSS以外）
          if (cachedResponse) {
            // ネットワーク優先でバックグラウンド更新
            fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  const responseClone = response.clone();
                  const cacheName = isCSS ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;
                  caches.open(cacheName)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    });
                }
              })
              .catch(() => {
                // ネットワークエラーは無視（オフライン対応）
              });
            
            return cachedResponse;
          }

          // キャッシュがない場合：ネットワークを試行
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // レスポンスをキャッシュ（CSSは静的キャッシュ、それ以外は動的キャッシュ）
              const responseToCache = response.clone();
              const cacheName = isCSS ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;
              caches.open(cacheName)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // オフライン時のフォールバック
              if (url.pathname.includes('.html') || url.pathname === '/') {
                return caches.match('/');
              }
              return new Response('Offline - リソースが利用できません', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// プッシュ通知（モバイル専用）
self.addEventListener('push', (event) => {
  console.log('📨 Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Mezaアプリからの通知',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'meza-notification',
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Meza', options)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// バックグラウンド同期（モバイル専用）
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync');
  
  if (event.tag === 'challenge-sync') {
    event.waitUntil(
      // チャレンジデータの同期処理
      syncChallengeData()
    );
  }
});

// チャレンジデータ同期関数
async function syncChallengeData() {
  try {
    // オフライン時に蓄積されたデータを同期
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const pendingRequests = await cache.keys();
    
    for (const request of pendingRequests) {
      if (request.url.includes('/api/challenges')) {
        await fetch(request);
      }
    }
    
    console.log('✅ Service Worker: Challenge data synced');
  } catch (error) {
    console.error('❌ Service Worker: Sync failed', error);
  }
}

// メッセージ処理（モバイル専用機能）
self.addEventListener('message', (event) => {
  console.log('📩 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🎯 Service Worker: Mobile-optimized version loaded'); 