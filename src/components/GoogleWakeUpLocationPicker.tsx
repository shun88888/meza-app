'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GoogleMap from './GoogleMap'
import { getAddressFromCoordsDebounced } from '@/lib/googleGeocoding'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface GoogleWakeUpLocationPickerProps {
  location: Location | null
  onLocationSelect: (location: Location) => void
  height?: string
  className?: string
  // 初回の住所取得でキャッシュを使わない
  initialNoCache?: boolean
}

export default function GoogleWakeUpLocationPicker({ 
  location, 
  onLocationSelect, 
  height = '400px', 
  className = '',
  initialNoCache = false
}: GoogleWakeUpLocationPickerProps) {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const initialAddressResolvedRef = useRef(false)

  // 住所取得処理（デバウンシング付きでAPI節約）
  const fetchAddressForLocation = useCallback((
    lat: number, 
    lng: number,
    options?: { noCache?: boolean }
  ) => {
    setIsLoadingAddress(true)
    console.log('住所取得開始:', lat, lng)
    
    getAddressFromCoordsDebounced(lat, lng, (address) => {
      const newLocation: Location = {
        lat,
        lng,
        address
      }
      
      console.log('住所取得完了:', newLocation)
      onLocationSelect(newLocation)
      setIsLoadingAddress(false)
    }, { noCache: options?.noCache })
  }, [onLocationSelect])

  // 地図クリック時の処理
  const handleMapClick = useCallback((clickLocation: { lat: number; lng: number }) => {
    console.log('地図クリック:', clickLocation)
    
    // 即座に座標を設定（住所は「取得中...」表示）
    const immediateLocation: Location = {
      ...clickLocation,
      address: '住所を取得中...'
    }
    onLocationSelect(immediateLocation)
    
    // 住所を非同期で取得
    fetchAddressForLocation(clickLocation.lat, clickLocation.lng)
  }, [fetchAddressForLocation, onLocationSelect])

  // マーカードラッグ時の処理
  const handleMarkerDragEnd = useCallback((dragLocation: { lat: number; lng: number }) => {
    console.log('マーカードラッグ:', dragLocation)
    
    // ドラッグ中の表示
    const draggingLocation: Location = {
      ...dragLocation,
      address: '住所を取得中...'
    }
    onLocationSelect(draggingLocation)
    
    // 住所を非同期で取得
    fetchAddressForLocation(dragLocation.lat, dragLocation.lng)
  }, [fetchAddressForLocation, onLocationSelect])

  // 初回、location が座標のみで住所未設定の場合は自動で住所取得
  useEffect(() => {
    if (!location) return
    const needsResolve = !location.address || location.address === '住所を取得中...'
    if (needsResolve && !initialAddressResolvedRef.current) {
      initialAddressResolvedRef.current = true
      fetchAddressForLocation(location.lat, location.lng, { noCache: initialNoCache })
    }
  }, [location, fetchAddressForLocation, initialNoCache])

  // マーカーの準備
  const markers = location ? [
    {
      position: { lat: location.lat, lng: location.lng },
      title: '起床場所',
      draggable: true,
      onDragEnd: handleMarkerDragEnd
    }
  ] : []

  return (
    <div className={`relative ${className}`}>
      {/* 地図上部の説明パネル */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm font-medium">起床場所</span>
        </div>
        
        <p className="text-xs text-gray-600 mb-3">
          地図をタップまたはピンをドラッグして起床場所を設定してください
        </p>
        
        {location && (
          <div className="space-y-2">
            <div className="text-xs">
              <strong>住所:</strong>
              {isLoadingAddress ? (
                <span className="inline-flex items-center gap-1 ml-1">
                  <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
                  取得中...
                </span>
              ) : (
                <span className="ml-1">{location.address || '取得できませんでした'}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Google Map */}
      <GoogleMap
        center={location ? { lat: location.lat, lng: location.lng } : { lat: 35.6762, lng: 139.6503 }}
        zoom={18}
        height={height}
        onClick={handleMapClick}
        markers={markers}
        className="rounded-lg"
      />
      
      {/* 読み込み中のオーバーレイ */}
      {isLoadingAddress && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">住所を取得中...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}