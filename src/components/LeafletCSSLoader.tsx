'use client'

import { useEffect } from 'react'

export default function LeafletCSSLoader() {
  useEffect(() => {
    // 既に読み込まれているかチェック
    if (document.querySelector('link[href*="leaflet.css"]')) {
      return
    }

    // Leaflet CSS を動的に読み込み
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    
    document.head.appendChild(link)
    
    return () => {
      // クリーンアップ時に削除
      const existingLink = document.querySelector(`link[href="${link.href}"]`)
      if (existingLink) {
        existingLink.remove()
      }
    }
  }, [])

  return null
}