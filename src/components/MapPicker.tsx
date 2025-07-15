'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from './ErrorBoundary'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface MapPickerProps {
  location: Location | null
  onLocationSelect: (location: Location) => void
  height?: string
  className?: string
}

function MapPickerComponent({ location, onLocationSelect, height = '612px', className = '' }: MapPickerProps) {
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
        
        // 成功時はエラー状態をクリア
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

  const orangeIcon = useMemo(() => {
    if (!isClient) return null
    try {
      const L = require('leaflet')
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#FFAD2F;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    } catch (error) {
      console.error('Error creating leaflet icon:', error)
      return null
    }
  }, [isClient])

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
              backgroundColor: '#FFAD2F',
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
        <div>地図を読み込み中...</div>
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

  function LocationMarker({ position, onPositionChange }: { 
    position: Location | null; 
    onPositionChange: (location: Location) => void 
  }) {
    const map = useMapEvents({
      click(e: any) {
        const newLocation = {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }
        onPositionChange(newLocation)
        map.setView(e.latlng, map.getZoom())
      },
    })

    return position === null ? null : (
      <Marker 
        position={[position.lat, position.lng]} 
        icon={orangeIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e: any) => {
            const marker = e.target
            const position = marker.getLatLng()
            onPositionChange({
              lat: position.lat,
              lng: position.lng
            })
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
        <MapContainer
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          preferCanvas={true}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          <LocationMarker position={location} onPositionChange={onLocationSelect} />
        </MapContainer>
      </div>
    )
  } catch (error) {
    console.error('Error rendering map:', error)
    return (
      <div className="loading-container" style={{ height }}>
        <div>地図の表示中にエラーが発生しました</div>
      </div>
    )
  }
}

const MapPicker = dynamic(() => Promise.resolve(MapPickerComponent), {
  ssr: false,
  loading: () => (
    <div className="loading-container" style={{ height: '400px' }}>
      <div>地図を読み込み中...</div>
    </div>
  )
})

export default MapPicker 