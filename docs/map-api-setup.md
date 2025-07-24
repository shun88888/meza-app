# マップAPI設定ガイド

## 概要
MezaアプリではOpenStreetMap (OSM) + Nominatimを使用してマップ表示と住所取得を行っています。これらのサービスは基本的に無料で使用でき、APIキーは不要です。

## 現在の設定

### 1. マッププロバイダー
- **タイルサーバー**: OpenStreetMap
- **URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **ライブラリ**: React Leaflet

### 2. ジオコーディングサービス
- **プロバイダー**: Nominatim (OpenStreetMap)
- **URL**: `https://nominatim.openstreetmap.org/reverse`
- **制限**: 1秒間に1リクエスト（利用規約）

## 設定手順

### 1. 環境変数（不要）
OpenStreetMapとNominatimはAPIキーが不要なため、`.env.local`に追加する必要はありません。

### 2. 利用規約の遵守
```javascript
// User-Agentヘッダーの設定（推奨）
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?...`,
  {
    headers: {
      'User-Agent': 'Meza-App/1.0 (your-email@example.com)'
    }
  }
)
```

### 3. レート制限の実装
```javascript
// リクエスト間隔制御
let lastRequestTime = 0
const MIN_INTERVAL = 1000 // 1秒

export async function getFormattedAddressFromCoords(lat: number, lng: number) {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  
  if (elapsed < MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - elapsed))
  }
  
  lastRequestTime = Date.now()
  // API呼び出し...
}
```

## 代替サービス（有料）

### Google Maps Geocoding API
必要になった場合の設定方法：

```bash
# .env.localに追加
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

```javascript
// 実装例
export async function getAddressFromGoogle(lat: number, lng: number) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ja`
  )
  const data = await response.json()
  return data.results[0]?.formatted_address || ''
}
```

### Mapbox Geocoding API
```bash
# .env.localに追加
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

```javascript
// 実装例
export async function getAddressFromMapbox(lat: number, lng: number) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&language=ja`
  )
  const data = await response.json()
  return data.features[0]?.place_name || ''
}
```

## パフォーマンス最適化

### 1. キャッシュ機能
```javascript
// 現在の実装
const addressCache = new Map<string, { address: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分間

export async function getFormattedAddressFromCoords(lat: number, lng: number) {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = addressCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.address
  }
  
  // API呼び出し...
}
```

### 2. デバウンス機能
```javascript
import { debounce } from 'lodash'

const debouncedGeocode = debounce(async (lat: number, lng: number) => {
  return await getFormattedAddressFromCoords(lat, lng)
}, 500) // 500ms待機
```

### 3. エラーハンドリング
```javascript
export async function getFormattedAddressFromCoords(lat: number, lng: number) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    // レスポンス処理...
  } catch (error) {
    if (error.name === 'AbortError') {
      return `住所取得タイムアウト (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    }
    return `住所取得失敗 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  }
}
```

## 監視とログ

### 1. API使用量の監視
```javascript
// APIコール数の記録
let apiCallCount = 0
let lastResetTime = Date.now()

function trackApiCall() {
  apiCallCount++
  
  // 1時間ごとにリセット
  const now = Date.now()
  if (now - lastResetTime > 3600000) {
    console.log(`過去1時間のAPI呼び出し数: ${apiCallCount}`)
    apiCallCount = 0
    lastResetTime = now
  }
}
```

### 2. エラー率の監視
```javascript
let successCount = 0
let errorCount = 0

function trackApiResult(success: boolean) {
  if (success) {
    successCount++
  } else {
    errorCount++
  }
  
  const total = successCount + errorCount
  if (total % 100 === 0) {
    const errorRate = (errorCount / total) * 100
    console.log(`API成功率: ${(100 - errorRate).toFixed(1)}%`)
  }
}
```

## トラブルシューティング

### 1. よくある問題

#### ネットワークエラー
```javascript
// CORS問題の回避（サーバーサイドでプロキシ）
// pages/api/geocode.ts
export default async function handler(req, res) {
  const { lat, lng } = req.query
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'Meza-App/1.0 (support@meza-app.com)'
        }
      }
    )
    
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Geocoding failed' })
  }
}
```

#### レート制限に引っかかる
```javascript
// 指数バックオフによるリトライ
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.status === 429) {
        // Too Many Requests
        const delay = Math.pow(2, i) * 1000 // 1秒, 2秒, 4秒
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
}
```

### 2. デバッグ方法

#### ログの有効化
```javascript
const DEBUG_GEOCODING = process.env.NODE_ENV === 'development'

if (DEBUG_GEOCODING) {
  console.log('Geocoding request:', { lat, lng })
  console.log('Geocoding response:', data)
}
```

#### テスト用の座標
```javascript
// 東京駅: 35.6812, 139.7671
// 大阪駅: 34.7024, 135.4959
// 札幌駅: 43.0642, 141.3469

const testCoordinates = [
  { lat: 35.6812, lng: 139.7671, expected: '東京都千代田区丸の内' },
  { lat: 34.7024, lng: 135.4959, expected: '大阪府大阪市北区梅田' },
]
```

## 本番環境での考慮事項

### 1. User-Agentの設定
```javascript
const USER_AGENT = process.env.NODE_ENV === 'production' 
  ? 'Meza-App/1.0 (support@meza-app.com)'
  : 'Meza-App-Dev/1.0'
```

### 2. フォールバック戦略
```javascript
const geocodingProviders = [
  { name: 'nominatim', fn: getNominatimAddress },
  { name: 'google', fn: getGoogleAddress },
  { name: 'mapbox', fn: getMapboxAddress }
]

export async function getAddressWithFallback(lat: number, lng: number) {
  for (const provider of geocodingProviders) {
    try {
      const address = await provider.fn(lat, lng)
      if (address && !address.includes('失敗')) {
        return address
      }
    } catch (error) {
      console.warn(`${provider.name} geocoding failed:`, error)
    }
  }
  
  return `座標: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
}
```

## セキュリティ考慮事項

### 1. レート制限の実装
```javascript
// IP別のレート制限（Redis使用例）
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `geocoding:${ip}`
  const current = await redis.get(key)
  
  if (current && parseInt(current) >= 60) { // 1時間に60回まで
    return false
  }
  
  await redis.incr(key)
  await redis.expire(key, 3600) // 1時間
  
  return true
}
```

### 2. 入力値の検証
```javascript
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  )
}
```

## まとめ

現在のOpenStreetMap + Nominatim構成は：
- ✅ 無料で利用可能
- ✅ APIキー不要
- ✅ 十分な精度
- ⚠️ レート制限あり（1秒/1リクエスト）
- ⚠️ 商用サポートなし

スケールアップ時は有料サービスへの移行を検討してください。