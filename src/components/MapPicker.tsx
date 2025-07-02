'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'

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

  useEffect(() => {
    setIsClient(true)
  }, [])

  const orangeIcon = useMemo(() => {
    if (!isClient) return null
    const L = require('leaflet')
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: #FFAD2F; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }, [isClient])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center bg-gray-100" style={{ height }}>
        <div className="text-gray-500">地図を読み込み中...</div>
      </div>
    )
  }

  // Only import Leaflet on client side
  const { MapContainer, TileLayer, Marker, useMapEvents } = require('react-leaflet')

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
        />
        <LocationMarker position={location} onPositionChange={onLocationSelect} />
      </MapContainer>
    </div>
  )
}

const MapPicker = dynamic(() => Promise.resolve(MapPickerComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100" style={{ height: '400px' }}>
      <div className="text-gray-500">地図を読み込み中...</div>
    </div>
  )
})

export default MapPicker 