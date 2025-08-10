'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  width?: string
  className?: string
  onClick?: (location: { lat: number; lng: number }) => void
  markers?: Array<{
    position: { lat: number; lng: number }
    title?: string
    draggable?: boolean
    onDragEnd?: (location: { lat: number; lng: number }) => void
  }>
}

export default function GoogleMap({
  center = { lat: 35.6762, lng: 139.6503 }, // 東京
  zoom = 18,
  height = '400px',
  width = '100%',
  className = '',
  onClick,
  markers = []
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Google Maps APIを読み込み
  const loadGoogleMaps = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        throw new Error('Google Maps API key is not configured')
      }

      console.log('Google Maps API Key exists:', !!apiKey)
      
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places'],
      })

      console.log('Loading Google Maps...')
      await loader.load()
      console.log('Google Maps loaded successfully')
      setIsLoaded(true)
    } catch (err) {
      console.error('Google Maps loading error:', err)
      setError(`Google Maps の読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // マップ初期化
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !isLoaded) return

    try {
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          // カスタムスタイル（シンプルで見やすく）
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map

      // クリックイベント
      if (onClick) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onClick({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            })
          }
        })
      }

      console.log('Google Maps initialized successfully')
    } catch (err) {
      console.error('Map initialization error:', err)
      setError('マップの初期化に失敗しました')
    }
  }, [center, zoom, onClick, isLoaded])

  // マーカー管理
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return

    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // 新しいマーカーを追加
    markers.forEach((markerData, index) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title || `Marker ${index + 1}`,
        draggable: markerData.draggable || false,
        icon: {
          url: '/marker-target.svg',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40),
        },
        optimized: true,
      })

      // ドラッグイベント
      if (markerData.draggable && markerData.onDragEnd) {
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && markerData.onDragEnd) {
            markerData.onDragEnd({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            })
          }
        })
      }

      markersRef.current.push(marker)
    })
  }, [markers])

  // 初期化処理
  useEffect(() => {
    loadGoogleMaps()
  }, [loadGoogleMaps])

  useEffect(() => {
    if (isLoaded) {
      initializeMap()
    }
  }, [isLoaded, initializeMap])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  // 中心位置更新
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center)
    }
  }, [center])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="text-red-500 text-sm mb-2">⚠️</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-gray-600 text-sm">Google Maps を読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef}
      className={`rounded-lg ${className}`}
      style={{ height, width }}
    />
  )
}