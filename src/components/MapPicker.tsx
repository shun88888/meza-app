'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import GoogleMap from './GoogleMap'
import { getAddressFromCoordsDebounced } from '@/lib/googleGeocoding'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface MapPickerProps {
  locations: {
    wakeUp: Location | null
  }
  onLocationSelect: (locationType: 'wakeUp', location: Location) => void
  height?: string
  className?: string
}

export default function MapPicker({ 
  locations, 
  onLocationSelect,
  height = '612px',
  className = '' 
}: MapPickerProps) {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [selectedLocationType, setSelectedLocationType] = useState<'wakeUp'>('wakeUp')

  // 住所取得処理（デバウンシング付きでAPI節約）
  const fetchAddressForLocation = useCallback((
    lat: number, 
    lng: number, 
    locationType: 'wakeUp'
  ) => {
    setIsLoadingAddress(true)
    console.log(`${locationType} 住所取得開始:`, lat, lng)
    
    getAddressFromCoordsDebounced(lat, lng, (address) => {
      const newLocation: Location = {
        lat,
        lng,
        address
      }
      
      console.log(`${locationType} 住所取得完了:`, newLocation)
      onLocationSelect(locationType, newLocation)
      setIsLoadingAddress(false)
    })
  }, [onLocationSelect])

  // 地図クリック時の処理
  const handleMapClick = useCallback((clickLocation: { lat: number; lng: number }) => {
    console.log('地図クリック:', clickLocation, 'タイプ:', selectedLocationType)
    
    // 即座に座標を設定（住所は「取得中...」表示）
    const immediateLocation: Location = {
      ...clickLocation,
      address: '住所を取得中...'
    }
    onLocationSelect(selectedLocationType, immediateLocation)
    
    // 住所を非同期で取得
    fetchAddressForLocation(clickLocation.lat, clickLocation.lng, selectedLocationType)
  }, [fetchAddressForLocation, onLocationSelect, selectedLocationType])

  // マーカードラッグ時の処理
  const handleMarkerDragEnd = useCallback((dragLocation: { lat: number; lng: number }) => {
    console.log('マーカードラッグ:', dragLocation, 'タイプ:', selectedLocationType)
    
    // ドラッグ中の表示
    const draggingLocation: Location = {
      ...dragLocation,
      address: '住所を取得中...'
    }
    onLocationSelect(selectedLocationType, draggingLocation)
    
    // 住所を非同期で取得
    fetchAddressForLocation(dragLocation.lat, dragLocation.lng, selectedLocationType)
  }, [fetchAddressForLocation, onLocationSelect, selectedLocationType])

  // マーカーの準備（メモ化）
  const markers = useMemo(() => {
    if (!locations.wakeUp) return [] as Array<{ position: { lat: number; lng: number }; title: string; draggable: boolean; onDragEnd: (loc: {lat:number; lng:number}) => void }>
    return [{
      position: { lat: locations.wakeUp.lat, lng: locations.wakeUp.lng },
      title: '起床場所',
      draggable: true,
      onDragEnd: handleMarkerDragEnd
    }]
  }, [locations.wakeUp?.lat, locations.wakeUp?.lng, handleMarkerDragEnd])

  // 地図の中心を決定（メモ化）
  const mapCenter = useMemo(() => {
    if (locations.wakeUp) return { lat: locations.wakeUp.lat, lng: locations.wakeUp.lng }
    return { lat: 35.6762, lng: 139.6503 }
  }, [locations.wakeUp?.lat, locations.wakeUp?.lng])

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {/* 上部のカード（説明・住所表示）は非表示化 */}

      {/* Google Map */}
      <GoogleMap
        center={mapCenter}
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
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">住所を取得中...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}