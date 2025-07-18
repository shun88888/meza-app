'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { formatAddress, getFormattedAddressFromCoords } from '@/lib/addressFormatter'

// Dynamic import to avoid SSR issues - use direct import path
const WakeUpLocationPicker = dynamic(() => import('../../../components/WakeUpLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div>起床場所設定地図を読み込み中...</div>
    </div>
  )
})

interface Location {
  lat: number
  lng: number
  address?: string
}

export default function LocationSettingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [wakeUpLocation, setWakeUpLocation] = useState<Location | null>(() => {
    const wakeUpLat = searchParams.get('wakeUpLat')
    const wakeUpLng = searchParams.get('wakeUpLng')
    const wakeUpAddress = searchParams.get('wakeUpAddress')
    
    if (wakeUpLat && wakeUpLng) {
      return {
        lat: parseFloat(wakeUpLat),
        lng: parseFloat(wakeUpLng),
        address: wakeUpAddress || undefined
      }
    }
    return null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleLocationSelect = (location: Location) => {
    setWakeUpLocation(location)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // Geocoding APIを使用して住所から座標を取得
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=jp&limit=1`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data && data.length > 0) {
          const result = data[0]
          const location: Location = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: formatAddress(result.display_name)
          }
          handleLocationSelect(location)
        } else {
          alert('住所が見つかりませんでした')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        alert('検索がタイムアウトしました。もう一度お試しください。')
      } else {
        alert('住所の検索に失敗しました')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = () => {
    const params = new URLSearchParams()
    
    if (wakeUpLocation) {
      params.set('wakeUpLat', wakeUpLocation.lat.toString())
      params.set('wakeUpLng', wakeUpLocation.lng.toString())
      if (wakeUpLocation.address) {
        params.set('wakeUpAddress', wakeUpLocation.address)
      }
    }
    
    router.push(`/create-challenge?${params.toString()}`)
  }

  const getCurrentLocation = () => {
    if (!navigator?.geolocation) {
      alert('位置情報がサポートされていません')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // 即座に座標を設定
          const immediateLocation: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: '住所を取得中...'
          }
          handleLocationSelect(immediateLocation)
          
          // 住所を非同期で取得
          getFormattedAddressFromCoords(position.coords.latitude, position.coords.longitude)
            .then(address => {
              const finalLocation: Location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                address: address
              }
              handleLocationSelect(finalLocation)
            })
            .catch(error => {
              console.error('住所取得エラー:', error)
              const fallbackLocation: Location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
              }
              handleLocationSelect(fallbackLocation)
            })
        } catch (error) {
          console.error('現在地処理エラー:', error)
          alert('現在地の取得に失敗しました')
        }
      },
      (error) => {
        console.error('Location error:', error)
        let message = '現在地の取得に失敗しました'
        switch (error.code) {
          case 1:
            message = '位置情報へのアクセスが拒否されました'
            break
          case 2:
            message = '位置情報が取得できませんでした'
            break
          case 3:
            message = '位置情報の取得がタイムアウトしました'
            break
        }
        alert(message)
      },
      {
        enableHighAccuracy: false, // 高速取得のためfalseに変更
        timeout: 5000, // タイムアウトを5秒に短縮
        maximumAge: 300000 // 5分間キャッシュを延長
      }
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-800">起床場所設定</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={!wakeUpLocation}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300"
          >
            決定
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>📍</span>
            <span className="font-medium text-red-900">起床場所を設定</span>
          </div>
          <div className="text-sm text-red-700">
            チャレンジ時にこの場所にいる必要があります
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="住所を検索（例：東京駅、渋谷区神南1-1-1）"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            {isSearching ? '検索中...' : '検索'}
          </button>
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            現在地
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <ErrorBoundary fallback={
          <div className="h-full flex items-center justify-center">
            <div>地図の読み込みに失敗しました</div>
          </div>
        }>
          <WakeUpLocationPicker
            location={wakeUpLocation}
            onLocationSelect={handleLocationSelect}
            height="100%"
            className="w-full h-full"
          />
        </ErrorBoundary>
      </div>

      {/* Bottom Info Panel */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="space-y-3">
          {/* Wake Up Location */}
          {wakeUpLocation && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span>📍</span>
                <span className="font-medium text-red-900">起床場所</span>
              </div>
              <div className="text-sm text-red-800">
                {wakeUpLocation.address ? formatAddress(wakeUpLocation.address) : `${wakeUpLocation.lat.toFixed(4)}, ${wakeUpLocation.lng.toFixed(4)}`}
              </div>
            </div>
          )}

          {!wakeUpLocation && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 text-center">
                地図をタップまたは住所を検索して起床場所を設定してください
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500">
            地図をタップして起床場所を選択してください。ピンをドラッグして微調整も可能です。
          </div>
        </div>
      </div>
    </div>
  )
}