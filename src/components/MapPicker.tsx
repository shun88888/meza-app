'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import ErrorBoundary from './ErrorBoundary'
import LeafletCSSLoader from './LeafletCSSLoader'
import { getFormattedAddressFromCoords } from '@/lib/addressFormatter'

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
  homeLocation?: Location | null
  targetLocation?: Location | null
  showBothPins?: boolean
  wakeUpLocation?: Location | null
  showPins?: boolean
  readOnly?: boolean
}

export default function MapPicker({ 
  location, 
  onLocationSelect, 
  height = '612px', 
  className = '', 
  homeLocation = null,
  targetLocation = null,
  showBothPins = false,
  wakeUpLocation = null,
  showPins = false,
  readOnly = false
}: MapPickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

    // クリーンアップ関数でマップを破棄
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
          mapRef.current = null
        } catch (error) {
          console.error('Error cleaning up map:', error)
        }
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

  const homeIcon = useMemo(() => {
    if (!isClient) return null
    try {
      const L = require('leaflet')
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#3B82F6;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:12px;">🏠</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    } catch (error) {
      console.error('Error creating home icon:', error)
      return null
    }
  }, [isClient])

  const targetIcon = useMemo(() => {
    if (!isClient) return null
    try {
      const L = require('leaflet')
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#EF4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:12px;">📍</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    } catch (error) {
      console.error('Error creating target icon:', error)
      return null
    }
  }, [isClient])

  // SVGアイコンを使用した起床場所マーカー
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
        <LeafletCSSLoader />
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
        if (readOnly) return // 読み取り専用モードではクリックを無効化
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
        draggable={!readOnly} // 読み取り専用モードではドラッグを無効化
        eventHandlers={{
          dragend: (e: any) => {
            if (readOnly) return
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

  function WakeUpMapClickHandler({ onLocationSelect }: { 
    onLocationSelect: (location: Location) => void 
  }) {
    const map = useMapEvents({
      async click(e: any) {
        if (readOnly) return
        try {
          const address = await getFormattedAddressFromCoords(e.latlng.lat, e.latlng.lng)
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: address
          })
          map.setView(e.latlng, map.getZoom())
        } catch (error) {
          console.error('住所取得エラー:', error)
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          })
          map.setView(e.latlng, map.getZoom())
        }
      },
    })

    return null
  }

  const defaultCenter = [35.6762, 139.6503] // Tokyo
  
  // 地図の中心を決定（起床場所がある場合は起床場所を優先）
  const center = wakeUpLocation ? [wakeUpLocation.lat, wakeUpLocation.lng] :
                location ? [location.lat, location.lng] : 
                homeLocation ? [homeLocation.lat, homeLocation.lng] :
                targetLocation ? [targetLocation.lat, targetLocation.lng] : defaultCenter

  try {
    return (
      <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
        <LeafletCSSLoader />
        <MapContainer
          key={`map-${retryCount}-${wakeUpLocation?.lat || 0}-${wakeUpLocation?.lng || 0}`}
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          className="z-0 leaflet-retina leaflet-fade-anim leaflet-grab leaflet-touch-drag"
          preferCanvas={true}
          zoomControl={false}
          attributionControl={true}
          ref={mapRef}
          whenReady={(map: any) => {
            mapRef.current = map
            console.log('Map ready successfully')
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          
          {/* 起床場所ピン表示（readOnlyモード用） */}
          {wakeUpLocation && readOnly && (
            <Marker 
              position={[wakeUpLocation.lat, wakeUpLocation.lng]} 
              icon={wakeUpIcon || targetIcon}
              key={`wakeup-readonly-${wakeUpLocation.lat}-${wakeUpLocation.lng}`}
            />
          )}

          {/* 複数ピン表示時 */}
          {showBothPins && (
            <>
              {/* 睡眠場所マーカー */}
              {homeLocation && (
                <Marker 
                  position={[homeLocation.lat, homeLocation.lng]} 
                  icon={homeIcon}
                  key={`home-${homeLocation.lat}-${homeLocation.lng}`}
                />
              )}
              
              {/* 目標場所マーカー */}
              {targetLocation && (
                <Marker 
                  position={[targetLocation.lat, targetLocation.lng]} 
                  icon={targetIcon}
                  key={`target-${targetLocation.lat}-${targetLocation.lng}`}
                />
              )}
              
              {/* クリック可能なマーカー */}
              {!readOnly && (
                <LocationMarker position={location} onPositionChange={onLocationSelect} />
              )}
            </>
          )}

          {/* 通常のマーカー（編集可能時） */}
          {!showBothPins && !readOnly && !wakeUpLocation && (
            <LocationMarker position={location} onPositionChange={onLocationSelect} />
          )}

          {/* 起床場所設定可能なマーカー（編集可能時） */}
          {!showBothPins && !readOnly && wakeUpLocation && (
            <>
              <Marker 
                position={[wakeUpLocation.lat, wakeUpLocation.lng]} 
                icon={wakeUpIcon || targetIcon}
                draggable={true}
                key={`wakeup-editable-${wakeUpLocation.lat}-${wakeUpLocation.lng}`}
                eventHandlers={{
                  dragend: async (e: any) => {
                    const marker = e.target
                    const position = marker.getLatLng()
                    try {
                      const address = await getFormattedAddressFromCoords(position.lat, position.lng)
                      onLocationSelect({
                        lat: position.lat,
                        lng: position.lng,
                        address: address
                      })
                    } catch (error) {
                      console.error('住所取得エラー:', error)
                      onLocationSelect({
                        lat: position.lat,
                        lng: position.lng
                      })
                    }
                  }
                }}
              />
              <WakeUpMapClickHandler onLocationSelect={onLocationSelect} />
            </>
          )}
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

 