// Address formatting – rebuilt from scratch for correctness and simplicity

type OsmAddress = {
  country_code?: string
  country?: string
  state?: string
  province?: string
  municipality?: string
  city?: string
  town?: string
  village?: string
  city_district?: string
  suburb?: string
  borough?: string
  neighbourhood?: string
  quarter?: string
  hamlet?: string
  residential?: string
  road?: string
}

// Cache (4-decimal ~11m precision; 3 minutes)
const addressCache = new Map<string, { address: string; timestamp: number }>()
const CACHE_MS = 3 * 60 * 1000

function pick<T extends string>(obj: Record<string, any>, keys: T[]): string | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

function buildJapaneseAddress(addr: OsmAddress): string {
  const prefecture = pick(addr as any, ['state', 'province']) || ''
  const city = pick(addr as any, ['city', 'town', 'village', 'municipality']) || ''
  const ward = pick(addr as any, ['city_district', 'suburb', 'borough']) || ''
  let locality = pick(addr as any, ['neighbourhood', 'quarter', 'hamlet', 'residential']) || ''

  // If locality is empty or equals city, fallback to road
  if (!locality || locality === city) {
    const r = (addr.road || '').trim()
    // avoid numeric-only (house numbers)
    if (r && !/^[0-9-]+$/.test(r)) locality = r
  }

  // Remove duplicates while preserving order
  const parts = [prefecture, city, ward, locality].filter((p, i, arr) => p && arr.indexOf(p) === i) as string[]
  if (parts.length === 0) return ''

  // Display without prefecture for brevity: City + (ideographic space) + Ward/Locality
  if (parts.length >= 3) {
    const cityPart = parts[1]
    const tail = parts.slice(2).join('')
    return `${cityPart}　${tail}`
  }

  if (parts.length === 2) {
    return parts[1]
  }

  return parts.join('')
}

export async function getFormattedAddressFromCoords(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = addressCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_MS) return cached.address

  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    'accept-language': 'ja,en',
    zoom: '18',
    addressdetails: '1',
  })

  try {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { signal: controller.signal })
    clearTimeout(to)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()

    let result = ''
    if (json?.address && (json.address.country_code === 'jp' || json.address.country === '日本')) {
      result = buildJapaneseAddress(json.address as OsmAddress)
    }
    if (!result && typeof json?.display_name === 'string') {
      // Fallback: take first two comma-separated tokens
      const t = json.display_name.split(',').map((s: string) => s.trim()).filter(Boolean)
      result = (t[1] ? `${t[1]}　${t[0]}` : t[0]) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
    result = result || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

    addressCache.set(key, { address: result, timestamp: Date.now() })
    return result
  } catch (err) {
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    addressCache.set(key, { address: fallback, timestamp: Date.now() })
    return fallback
  }
}

// For UI that wants to show the already-formatted string unchanged
export function formatAddress(displayName: string | null): string { return displayName || '' }

// 漢数字を算用数字に変換する関数
function convertKanjiToNumber(text: string): string {
  const kanjiToNumber: { [key: string]: string } = {
    '一': '1',
    '二': '2', 
    '三': '3',
    '四': '4',
    '五': '5',
    '六': '6',
    '七': '7',
    '八': '8',
    '九': '9',
    '十': '10'
  }
  
  let result = text
  for (const [kanji, number] of Object.entries(kanjiToNumber)) {
    result = result.replace(new RegExp(kanji, 'g'), number)
  }
  return result
}

// 改善された住所解析関数
function smartFormatAddress(addressData: any): string {
  console.log('=== smartFormatAddress 開始 ===')
  console.log('入力データ:', addressData)
  
  const parts: string[] = []
  
  // 1. 都道府県（必須）
  if (addressData.state) {
    parts.push(addressData.state)
    console.log('都道府県:', addressData.state)
  }
  
  // 2. 市区町村の優先順位付き選択
  const cityOptions = [
    addressData.city,
    addressData.town,
    addressData.village,
    addressData.municipality
  ].filter(Boolean)
  
  if (cityOptions.length > 0) {
    // 「市」「町」「村」で終わるものを優先
    const properCity = cityOptions.find(city => /(市|町|村)$/.test(city)) || cityOptions[0]
    parts.push(properCity)
    console.log('市区町村:', properCity)
  }
  
  // 3. 区・地区の優先順位付き選択
  const districtOptions = [
    addressData.city_district,
    addressData.suburb,
    addressData.borough
  ].filter(Boolean)
  
  if (districtOptions.length > 0) {
    // 「区」で終わるものを優先
    const properDistrict = districtOptions.find(district => /区$/.test(district)) || districtOptions[0]
    parts.push(properDistrict)
    console.log('区:', properDistrict)
  }
  
  // 4. 町丁目・地域の優先順位付き選択
  const localityOptions = [
    addressData.neighbourhood,
    addressData.hamlet,
    addressData.quarter,
    addressData.residential,
    addressData.road
  ].filter(Boolean)
  
  if (localityOptions.length > 0) {
    // 番地や数字のみの部分を除外
    const validLocality = localityOptions.find(locality => 
      locality.length > 1 && 
      !/^[0-9-]+$/.test(locality) &&
      !/^[0-9]+番地?$/.test(locality)
    )
    
    if (validLocality) {
      // 漢数字を数字に変換
      const convertedLocality = convertKanjiToNumber(validLocality)
      parts.push(convertedLocality)
      console.log('町丁目:', convertedLocality)
    }
  }
  
  console.log('全パーツ:', parts)
  
  // 住所の構築
  let result = ''
  
  if (parts.length >= 4) {
    // 都道府県+市+区+町丁目
    const prefectureCity = parts.slice(0, 2).join('')
    const districtLocality = parts.slice(2).join('')
    result = `${prefectureCity}　${districtLocality}`
  } else if (parts.length >= 3) {
    // 都道府県+市+区 or 都道府県+市+町丁目
    const prefectureCity = parts.slice(0, 2).join('')
    const remaining = parts.slice(2).join('')
    result = `${prefectureCity}　${remaining}`
  } else if (parts.length >= 2) {
    // 都道府県+市
    result = parts.join('')
  } else if (parts.length === 1) {
    // 都道府県のみ
    result = parts[0]
  }
  
  console.log('構築された住所:', result)
  console.log('=== smartFormatAddress 終了 ===')
  
  return result
}

// (legacy formatAddress removed)

// 日本向けの短縮表示（都道府県を省略し、市区町村〜町丁目を優先）
export function formatJapaneseAddressShort(displayName: string | null): string {
  if (!displayName) return ''
  try {
    let s = displayName
      .replace(/〒?\d{3}-?\d{4}/g, '')
      .replace(/[、,\s]*日本[、,\s]*/g, '')
      .trim()

    // 全角スペースを半角に正規化して処理しやすく
    s = s.replace(/\u3000/g, ' ')

    // 先頭の都道府県を除去（北海道/都/道/府/県で終わる文字列まで）
    s = s.replace(/^[^\s]*?(?:都|道|府|県)\s*/, '')

    // 余計な連続スペースの圧縮
    s = s.replace(/\s{2,}/g, ' ')

    // 再び全角スペースで見栄えを調整（市の後で分割して区以下を後段に）
    const cityMatch = s.match(/^(.*?市)(.*)$/)
    if (cityMatch) {
      return `${cityMatch[1]}　${cityMatch[2].trim()}`
    }
    // 市が含まれない場合はそのまま返す
    return s
  } catch {
    return displayName!
  }
}

// remove legacy duplicate block below (purged)