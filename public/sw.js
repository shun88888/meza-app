const CACHE_NAME = 'meza-app-v1.5.0-with-notifications';
const STATIC_CACHE_NAME = 'meza-static-v1.5.0';
const DYNAMIC_CACHE_NAME = 'meza-dynamic-v1.5.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/login',
  '/create-challenge',
  '/active-challenge',
  '/profile/settings',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/marker-icon.png',
  '/marker-icon-2x.png',
  '/marker-shadow.png'
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
  console.log('🔄 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// プッシュ通知受信
self.addEventListener('push', event => {
  console.log('📬 Push notification received');
  
  let notificationData = {
    title: 'Meza',
    body: 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // 既存のタブがあれば、そこにフォーカス
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // なければ新しいタブを開く
      return clients.openWindow('/');
    })
  );
});

// フェッチイベント（キャッシュ戦略）
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API リクエストはキャッシュしない
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあれば返す
        if (response) {
          return response;
        }
        
        // なければネットワークから取得
        return fetch(event.request)
          .then((response) => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 動的キャッシュに保存
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // ネットワークエラー時はオフラインページを返す
            return caches.match('/');
          });
      })
  );
});