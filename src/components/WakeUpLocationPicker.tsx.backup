'use client'

import { useState, useEffect, useMemo } from 'react'
import ErrorBoundary from './ErrorBoundary'
import LeafletCSSLoader from './LeafletCSSLoader'
import { getFormattedAddressFromCoords, formatAddress } from '@/lib/addressFormatter'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface WakeUpLocationPickerProps {
  location: Location | null
  onLocationSelect: (location: Location) => void
  height?: string
  className?: string
}

export default function WakeUpLocationPicker({ 
  location, 
  onLocationSelect, 
  height = '400px', 
  className = '' 
}: WakeUpLocationPickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setIsClient(true)
    
    // Leafletのデフォルトアイコンの問題を修正
    if (typeof window !== 'undefined') {
      try {
        const L = require('leaflet')
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png', 
          shadowUrl: '/marker-shadow.png',
        })
        
        setMapError(null)
      } catch (error) {
        console.error('Error setting up Leaflet icons:', error)
        setMapError('地図の初期化に失敗しました')
      }
    }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setMapError(null)
  }

  // 起床場所用のカスタムマーカー（SVG使用）
  const wakeUpIcon = useMemo(() => {
    if (!isClient) return null
    try {
      const L = require('leaflet')
      return L.icon({
        iconUrl: '/marker-target.svg',
        iconSize: [44, 58],
        iconAnchor: [22, 58],
        className: 'leaflet-marker-wakeup'
      })
    } catch (error) {
      console.error('Error creating wake-up icon:', error)
      return null
    }
  }, [isClient])

  // 住所取得機能（フォーマット済み）
  const getAddressFromCoords = async (lat: number, lng: number) => {
    return await getFormattedAddressFromCoords(lat, lng)
  }

  // エラー状態の表示
  if (mapError && retryCount < 3) {
    return (
      <div className="loading-container" style={{ height }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px' }}>{mapError}</div>
          <button 
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            再試行 ({retryCount + 1}/3)
          </button>
        </div>
      </div>
    )
  }

  // リトライ回数が上限に達した場合
  if (mapError && retryCount >= 3) {
    return (
      <div className="loading-container" style={{ height }}>
        <div>地図の読み込みに失敗しました。しばらく後に再度お試しください。</div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="loading-container" style={{ height }}>
        <LeafletCSSLoader />
        <div>起床場所設定地図を読み込み中...</div>
      </div>
    )
  }

  // Only import Leaflet on client side
  let MapContainer: any, TileLayer: any, Marker: any, useMapEvents: any
  try {
    const reactLeaflet = require('react-leaflet')
    MapContainer = reactLeaflet.MapContainer
    TileLayer = reactLeaflet.TileLayer
    Marker = reactLeaflet.Marker
    useMapEvents = reactLeaflet.useMapEvents
  } catch (error) {
    console.error('Error loading react-leaflet:', error)
    return (
      <div className="loading-container" style={{ height }}>
        <div>地図の読み込みに失敗しました</div>
      </div>
    )
  }

  function WakeUpLocationMarker({ position, onPositionChange }: { 
    position: Location | null; 
    onPositionChange: (location: Location) => void 
  }) {
    const map = useMapEvents({
      async click(e: any) {
        // 即座に座標を更新
        const immediateLocation = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address: '住所を取得中...'
        }
        onPositionChange(immediateLocation)
        map.setView(e.latlng, map.getZoom())
        
        // 住所を非同期で取得
        try {
          const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng)
          onPositionChange({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: address
          })
        } catch (error) {
          console.error('住所取得エラー:', error)
        }
      },
    })

    return position === null ? null : (
      <Marker 
        position={[position.lat, position.lng]} 
        icon={wakeUpIcon}
        draggable={true}
        eventHandlers={{
          dragstart: (e: any) => {
            // ドラッグ開始時に即座に「移動中...」表示
            const marker = e.target
            const position = marker.getLatLng()
            onPositionChange({
              lat: position.lat,
              lng: position.lng,
              address: '移動中...'
            })
          },
          dragend: async (e: any) => {
            const marker = e.target
            const position = marker.getLatLng()
            
            // 即座に座標を更新
            onPositionChange({
              lat: position.lat,
              lng: position.lng,
              address: '住所を取得中...'
            })
            
            // 住所を非同期で取得
            try {
              const address = await getAddressFromCoords(position.lat, position.lng)
              onPositionChange({
                lat: position.lat,
                lng: position.lng,
                address: address
              })
            } catch (error) {
              console.error('住所取得エラー:', error)
              onPositionChange({
                lat: position.lat,
                lng: position.lng,
                address: `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
              })
            }
          }
        }}
      />
    )
  }

  const defaultCenter = [35.6762, 139.6503] // Tokyo
  const center = location ? [location.lat, location.lng] : defaultCenter

  try {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <LeafletCSSLoader />
        
        {/* 地図上部の説明 */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000] max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">起床場所</span>
          </div>
          <p className="text-xs text-gray-600">
            地図をタップまたはピンをドラッグして起床場所を設定してください
          </p>
          {location && (
            <div className="mt-2 text-xs text-gray-700">
              <strong>設定済み:</strong> {location.address ? formatAddress(location.address) : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </div>
          )}
        </div>

        <MapContainer
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          preferCanvas={true}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          
          <WakeUpLocationMarker position={location} onPositionChange={onLocationSelect} />
        </MapContainer>
      </div>
    )
  } catch (error) {
    console.error('Error rendering wake-up location map:', error)
    return (
      <div className="loading-container" style={{ height }}>
        <div>起床場所設定地図の表示中にエラーが発生しました</div>
      </div>
    )
  }
}