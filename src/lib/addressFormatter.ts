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

// シンプルな住所フォーマット関数
export function formatAddress(displayName: string | null): string {
  if (!displayName) {
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
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒に短縮
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja&zoom=18&addressdetails=1`,
      { signal: controller.signal }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      
      // === デバッグログ強化 ===
      console.log('=== Nominatim API Debug Info ===')
      console.log('座標:', lat, lng)
      console.log('display_name:', data.display_name)
      console.log('address object:', data.address)
      
      if (data.address) {
        console.log('address details:')
        console.log('  state:', data.address.state)
        console.log('  city:', data.address.city)
        console.log('  town:', data.address.town)
        console.log('  suburb:', data.address.suburb)
        console.log('  city_district:', data.address.city_district)
        console.log('  neighbourhood:', data.address.neighbourhood)
        console.log('  hamlet:', data.address.hamlet)
        console.log('  quarter:', data.address.quarter)
        console.log('  road:', data.address.road)
        console.log('  house_number:', data.address.house_number)
        console.log('  postcode:', data.address.postcode)
        console.log('  country:', data.address.country)
      }
      console.log('=== End Debug Info ===')
      
      // シンプルな住所構築テスト
      console.log('=== シンプルテスト ===')
      const simpleAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      console.log('シンプル住所:', simpleAddress)
      
      // 現在の複雑な処理も実行（比較用）
      let formattedAddress = ''
      
      if (data.address) {
        const addr = data.address
        const parts: string[] = []
        
        // 都道府県
        if (addr.state) parts.push(addr.state)
        
        // 市
        if (addr.city) {
          parts.push(addr.city)
        } else if (addr.town) {
          parts.push(addr.town)
        }
        
        // 区
        if (addr.suburb) {
          parts.push(addr.suburb)
        } else if (addr.city_district) {
          parts.push(addr.city_district)
        }
        
        // 町丁目
        if (addr.neighbourhood) {
          parts.push(convertKanjiToNumber(addr.neighbourhood))
        } else if (addr.hamlet) {
          parts.push(convertKanjiToNumber(addr.hamlet))
        } else if (addr.quarter) {
          parts.push(convertKanjiToNumber(addr.quarter))
        }
        
        console.log('抽出されたパーツ:', parts)
        
        // フォーマット
        if (parts.length >= 3) {
          const prefectureCity = parts.slice(0, 2).join('')
          const wardTown = parts.slice(2).join('')
          formattedAddress = `${prefectureCity}　${wardTown}`
        } else if (parts.length >= 2) {
          formattedAddress = parts.join('')
        }
      }
      
      console.log('複雑な整形結果:', formattedAddress)
      
      // address detailsからの構築に失敗した場合、従来の方法を使用
      if (!formattedAddress) {
        formattedAddress = formatAddress(data.display_name)
        console.log('formatAddress関数の結果:', formattedAddress)
      }
      
      const finalAddress = formattedAddress || simpleAddress
      console.log('最終的な住所:', finalAddress)
      console.log('=== End シンプルテスト ===')
      
      // キャッシュに保存
      addressCache.set(cacheKey, { address: finalAddress, timestamp: Date.now() })
      
      return finalAddress
    } else {
      console.error('Nominatim API error:', response.status, response.statusText)
      const fallbackAddress = `住所取得失敗 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      addressCache.set(cacheKey, { address: fallbackAddress, timestamp: Date.now() })
      return fallbackAddress
    }
  } catch (error) {
    console.error('住所取得エラー:', error)
    
    // エラーの種類に応じた適切なメッセージ
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