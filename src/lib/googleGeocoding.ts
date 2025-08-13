/**
 * Google Geocoding API を使用した高精度住所取得
 */

export interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface GoogleGeocodeResult {
  address_components: GoogleAddressComponent[]
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
    location_type: string
  }
  place_id: string
  types: string[]
}

// 高速住所取得用のキャッシュ（API節約のため）
const addressCache = new Map<string, { address: string; timestamp: number }>()
// 同一座標への同時リクエストを合流するための in-flight 管理
const inflightRequests = new Map<string, Promise<string>>()
// 初期の誤った住所が残り続けないよう、キャッシュ寿命を短縮
const CACHE_DURATION = 10 * 60 * 1000 // 10分

// キャッシュクリーンアップ（メモリ節約）- ブラウザのみで実行
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    addressCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        expiredKeys.push(key)
      }
    })
    
    expiredKeys.forEach(key => addressCache.delete(key))
  }, 10 * 60 * 1000) // 10分ごとにクリーンアップ
}

// デバウンシング用のタイマー
const debounceTimers = new Map<string, NodeJS.Timeout>()
const DEBOUNCE_DELAY = 500 // 500ms


/**
 * API節約のためのヘルパー関数
 */
function roundCoordinates(lat: number, lng: number, precision: number = 4): { lat: number, lng: number } {
  const factor = Math.pow(10, precision)
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor
  }
}


/**
 * 座標から日本語住所を取得（API節約機能付き）
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  return getAddressFromCoordsWithOptions(lat, lng, { noCache: false })
}

export async function getAddressFromCoordsWithOptions(
  lat: number,
  lng: number,
  options?: { noCache?: boolean }
): Promise<string> {
  // 座標を丸めてAPI節約
  const rounded = roundCoordinates(lat, lng, 4)
  const cacheKey = `${rounded.lat},${rounded.lng}`
  
  // キャッシュチェック
  if (!options?.noCache) {
    const cached = addressCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Google住所キャッシュヒット:', cached.address)
      return cached.address
    }
  }

  // 進行中の同一キーのリクエストがあればそこに合流
  const inflight = inflightRequests.get(cacheKey)
  if (inflight) {
    console.log('Google住所取得: 進行中のリクエストに合流 ->', cacheKey)
    return inflight
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured')
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${rounded.lat},${rounded.lng}&key=${apiKey}&language=ja&result_type=street_address|premise|sublocality`
    
    console.log('=== Google Geocoding API 呼び出し ===')
    console.log('元座標:', lat, lng)
    console.log('丸め座標:', rounded.lat, rounded.lng)

    const request = (async () => {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
      
      if (data.status !== 'OK') {
        console.error('Google Geocoding API error:', data.status, data.error_message)
        throw new Error(`Geocoding failed: ${data.status}`)
      }
  
      if (!data.results || data.results.length === 0) {
        throw new Error('No address results found')
      }
  
      // 町丁目レベルの結果を優先選択
      let result: GoogleGeocodeResult
      
      // 「丁目」「町」「大字」を含む住所を探す
      const townLevelResult = data.results.find((r: GoogleGeocodeResult) => 
        r.formatted_address.includes('丁目') || 
        r.formatted_address.includes('町') ||
        r.formatted_address.includes('大字')
      )
      
      if (townLevelResult) {
        console.log('町丁目レベルの結果を選択:', townLevelResult.formatted_address)
        result = townLevelResult
      } else {
        // 町丁目レベルがなければ最初の結果
        result = data.results[0] as GoogleGeocodeResult
      }
      
      console.log('Google API結果:', result)
      
      // 日本語住所のフォーマット
      const formattedAddress = formatJapaneseAddress(result)
      
      console.log('フォーマット済み住所:', formattedAddress)
      console.log('=== Google Geocoding API 完了 ===')
      
      // キャッシュに保存（新鮮な結果で上書き）
      addressCache.set(cacheKey, { address: formattedAddress, timestamp: Date.now() })
      
      return formattedAddress
    })()

    inflightRequests.set(cacheKey, request)
    try {
      return await request
    } finally {
      inflightRequests.delete(cacheKey)
    }

  } catch (error) {
    console.error('Google住所取得エラー:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const fallbackAddress = `住所取得エラー: ${errorMessage} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    
    // エラーもキャッシュ（短時間）
    addressCache.set(cacheKey, { address: fallbackAddress, timestamp: Date.now() })
    
    return fallbackAddress
  }
}

/**
 * Google APIの結果を日本語住所形式にフォーマット
 */
function formatJapaneseAddress(result: GoogleGeocodeResult): string {
  console.log('=== 日本語住所フォーマット開始 ===')
  console.log('元の住所:', result.formatted_address)
  
  let address = result.formatted_address
  
  // 基本的な前処理
  address = address
    .replace(/^日本、?\s*/, '') // 先頭の「日本、」を削除
    .replace(/〒\d{3}-?\d{4}\s*/, '') // 郵便番号を削除
    .trim()

  // 住所レベルに応じた処理
  if (address.includes('丁目') || address.includes('町')) {
    // 町丁目レベルの場合：番地のみ除去
    address = address
      // 丁目後の番地を削除（「泥亀１丁目２８−D」→「泥亀１丁目」）
      .replace(/(丁目|町)\s*[０-９\d]+(−|－|ー)[０-９A-Za-zＡ-Ｚａ-ｚ\d]*(\s+[A-Za-zＡ-Ｚａ-ｚ]+)?/g, '$1')
      // 丁目後の番地（番・号形式）を削除
      .replace(/(丁目|町)\s*[０-９\d]+番地?[０-９\d]*号?/g, '$1')
      // 丁目後の単純な数字を削除
      .replace(/(丁目|町)\s*[０-９\d]+[０-９\d\s]*$/g, '$1')
      // 末尾の建物情報を削除
      .replace(/\s+[０-９\d]+$/, '')
      .replace(/\s+[A-Za-zＡ-Ｚａ-ｚ]+$/, '')
      .trim()
  } else {
    // 町丁目がない場合：区レベルまでを維持
    address = address
      .replace(/\s*[０-９\d]+(−|－|ー)[０-９A-Za-z\d]+.*$/, '') // 番地以降を削除
      .replace(/\s*[０-９\d]+番地?.*$/, '') // 番地以降を削除
      .replace(/\s*[０-９\d]+.*$/, '') // 数字以降を削除
      .trim()
  }

  // 最終クリーンアップ
  address = address
    .replace(/\s+/g, '') // 空白を削除
    .replace(/,$/, '') // 末尾のカンマを削除
    .trim()

  console.log('処理後住所:', address)
  console.log('=== 日本語住所フォーマット終了 ===')

  return address || result.formatted_address
}

/**
 * address_componentsから指定されたタイプの要素を検索
 */
function findComponent(components: GoogleAddressComponent[], types: string[]): GoogleAddressComponent | undefined {
  return components.find(component => 
    types.some(type => component.types.includes(type))
  )
}

/**
 * デバウンシング付き住所取得（連続したクリック/ドラッグでAPI節約）
 */
export function getAddressFromCoordsDebounced(
  lat: number, 
  lng: number, 
  callback: (address: string) => void,
  options?: { noCache?: boolean }
): void {
  const rounded = roundCoordinates(lat, lng, 4)
  const debounceKey = `${rounded.lat},${rounded.lng}`
  
  // 既存のタイマーをクリア
  const existingTimer = debounceTimers.get(debounceKey)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }
  
  // 新しいタイマーをセット
  const timer = setTimeout(async () => {
    try {
      const address = await getAddressFromCoordsWithOptions(lat, lng, { noCache: options?.noCache })
      callback(address)
    } catch (error) {
      console.error('デバウンシング住所取得エラー:', error)
      callback(`住所取得エラー (${rounded.lat.toFixed(4)}, ${rounded.lng.toFixed(4)})`)
    } finally {
      debounceTimers.delete(debounceKey)
    }
  }, DEBOUNCE_DELAY)
  
  debounceTimers.set(debounceKey, timer)
}

/**
 * 住所から座標を取得（逆ジオコーディング）
 */
export async function getCoordsFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured')
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&language=ja`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null
    }

    const location = data.results[0].geometry.location
    return {
      lat: location.lat,
      lng: location.lng
    }

  } catch (error) {
    console.error('住所から座標取得エラー:', error)
    return null
  }
}