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

// シンプルな住所フォーマット関数
export function formatAddress(displayName: string | null): string {
  if (!displayName) {
    return ''
  }

  // 不適切な入力をチェック
  if (displayName.includes('取得中') || 
      displayName.includes('失敗') || 
      displayName.includes('タイムアウト') ||
      displayName.includes('エラー')) {
    console.log('formatAddress: 不適切な入力をスキップ:', displayName)
    return ''
  }

  try {
    console.log('=== formatAddress 開始 ===')
    console.log('元の住所:', displayName)
    
    // 郵便番号と「日本」を除去
    const cleanedAddress = displayName
      .replace(/〒?\d{3}-?\d{4}/g, '') // 郵便番号を除去
      .replace(/[,\s]*日本[,\s]*/g, '') // 「日本」を除去
      .trim()
    
    console.log('クリーンアップ後:', cleanedAddress)
    
    // まずはシンプルにカンマで分割
    const addressParts = cleanedAddress.split(',').map(part => part.trim()).filter(part => part.length > 0)
    console.log('分割された住所パーツ:', addressParts)
    
    // シンプルな基本戦略：最初の3-4個の有効な部分を取得
    const validParts = addressParts.filter(part => 
      part.length >= 2 && 
      !/^[0-9-]+$/.test(part) && // 番地を除外
      !/株式会社|有限会社|学校|病院|郵便局|駅/.test(part) // 施設名を除外
    ).slice(0, 4) // 最初の4つまで
    
    console.log('有効な部分:', validParts)
    
    // 都道府県を探す
    const prefecture = validParts.find(part => 
      /(県|都|府|北海道)$/.test(part)
    )
    
    // 市を探す
    const city = validParts.find(part => 
      /市$/.test(part) && part !== prefecture
    )
    
    // 区を探す
    const ward = validParts.find(part => 
      /区$/.test(part) && part !== prefecture && part !== city
    )
    
    // 町丁目を探す
    const town = validParts.find(part => 
      part !== prefecture && part !== city && part !== ward &&
      (/丁目/.test(part) || /町$/.test(part) || /[東西南北]/.test(part))
    )
    
    console.log('抽出結果:', { prefecture, city, ward, town })
    
    // 基本的な住所構成
    const components = [prefecture, city, ward, town].filter(Boolean)
    console.log('住所コンポーネント:', components)
    
    if (components.length >= 3) {
      // 都道府県+市+区+町丁目の形式
      const prefectureCity = components.slice(0, 2).join('')
      const wardTown = components.slice(2).join('')
      const result = `${prefectureCity}　${wardTown}`
      console.log('フォーマット結果:', result)
      console.log('=== formatAddress 終了 ===')
      return result
    } else if (components.length >= 2) {
      // 都道府県+市の形式
      const result = components.join('')
      console.log('フォーマット結果:', result)
      console.log('=== formatAddress 終了 ===')
      return result
    } else {
      // 最初の有効な部分を返す
      const result = validParts[0] || addressParts[0] || ''
      console.log('フォールバック結果:', result)
      console.log('=== formatAddress 終了 ===')
      return result.length > 30 ? result.substring(0, 30) + '...' : result
    }
    
  } catch (error) {
    console.error('住所フォーマットエラー:', error)
    // エラー時は最初のカンマまでの部分を返す
    const shortAddress = displayName.split(',')[0].trim()
    return shortAddress.length > 30 ? shortAddress.substring(0, 30) + '...' : shortAddress
  }
}

// 座標から住所を取得し、フォーマットする関数
// 高速住所取得用のキャッシュ
const addressCache = new Map<string, { address: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分間

export async function getFormattedAddressFromCoords(lat: number, lng: number): Promise<string> {
  // 座標を四捨五入してキャッシュキーとする
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = addressCache.get(cacheKey)
  
  // キャッシュが有効な場合はそれを返す
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('住所キャッシュヒット:', cached.address)
    return cached.address
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒に延長
    
    const params = new URLSearchParams({
      'format': 'json',
      'lat': lat.toString(),
      'lon': lng.toString(),
      'accept-language': 'ja,en',
      'zoom': '18', // 18レベル
      'addressdetails': '1',
    })
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { signal: controller.signal }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      
      console.log('=== 住所取得結果 ===')
      console.log('座標:', lat, lng)
      console.log('display_name:', data.display_name)
      console.log('address object:', data.address)
      
      let formattedAddress = ''
      
      // スマートフォーマットを試す
      if (data.address) {
        formattedAddress = smartFormatAddress(data.address)
        console.log('スマートフォーマット結果:', formattedAddress)
      }
      
      // スマートフォーマットが失敗した場合はdisplay_nameを直接フォーマット
      if (!formattedAddress && data.display_name) {
        formattedAddress = formatAddress(data.display_name)
        console.log('display_nameフォーマット結果:', formattedAddress)
      }
      
      // 最終的にはdisplay_nameをそのまま使用
      const finalAddress = formattedAddress || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      console.log('最終住所:', finalAddress)
      
      // キャッシュに保存
      addressCache.set(cacheKey, { address: finalAddress, timestamp: Date.now() })
      
      return finalAddress
    } else {
      console.error('Nominatim API error:', response.status, response.statusText)
      throw new Error(`API Error: ${response.status}`)
    }
  } catch (error) {
    console.error('住所取得エラー:', error)
    
    let errorMessage = '住所取得失敗'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '住所取得タイムアウト'
      } else if (error.message.includes('network')) {
        errorMessage = 'ネットワークエラー'
      }
    }
    
    const fallbackAddress = `${errorMessage} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    addressCache.set(cacheKey, { address: fallbackAddress, timestamp: Date.now() })
    return fallbackAddress
  }
}