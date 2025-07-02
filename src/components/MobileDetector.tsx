'use client'

import { useEffect, useState } from 'react'

export interface MobileInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  userAgent: string
  platform: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  touchSupport: boolean
  orientation: 'portrait' | 'landscape' | 'unknown'
  isStandalone: boolean
  isIOS: boolean
  isAndroid: boolean
  canInstallPWA: boolean
}

interface MobileDetectorProps {
  children: (mobileInfo: MobileInfo) => React.ReactNode
}

export default function MobileDetector({ children }: MobileDetectorProps) {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    platform: '',
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    touchSupport: false,
    orientation: 'unknown',
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    canInstallPWA: false
  })

  useEffect(() => {
    const detectMobileInfo = () => {
      const userAgent = window.navigator.userAgent
      const platform = window.navigator.platform || ''
      
      // モバイル/タブレット検出
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent)
      const isDesktop = !isMobile && !isTablet
      
      // OS検出
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      
      // 画面情報
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const pixelRatio = window.devicePixelRatio || 1
      
      // タッチサポート
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // 向き検出
      let orientation: 'portrait' | 'landscape' | 'unknown' = 'unknown'
      if (screenHeight > screenWidth) {
        orientation = 'portrait'
      } else if (screenWidth > screenHeight) {
        orientation = 'landscape'
      }
      
      // スタンドアロンモード（PWA）
      const isStandalone = (window.navigator as any).standalone === true ||
                          window.matchMedia('(display-mode: standalone)').matches
      
      // PWAインストール可能性
      const canInstallPWA = 'serviceWorker' in navigator && 
                           'PushManager' in window &&
                           !isStandalone
      
      setMobileInfo({
        isMobile,
        isTablet, 
        isDesktop,
        userAgent,
        platform,
        screenWidth,
        screenHeight,
        pixelRatio,
        touchSupport,
        orientation,
        isStandalone,
        isIOS,
        isAndroid,
        canInstallPWA
      })
    }

    // 初期検出
    detectMobileInfo()
    
    // 向き変更監視
    const handleOrientationChange = () => {
      setTimeout(detectMobileInfo, 100) // 向き変更後の遅延
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  return <>{children(mobileInfo)}</>
}

// モバイル専用フック
export function useMobileInfo(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    platform: '',
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1,
    touchSupport: false,
    orientation: 'unknown',
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    canInstallPWA: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectMobileInfo = () => {
      const userAgent = window.navigator.userAgent
      const platform = window.navigator.platform || ''
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent)
      const isDesktop = !isMobile && !isTablet
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const pixelRatio = window.devicePixelRatio || 1
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      let orientation: 'portrait' | 'landscape' | 'unknown' = 'unknown'
      if (screenHeight > screenWidth) {
        orientation = 'portrait'
      } else if (screenWidth > screenHeight) {
        orientation = 'landscape'
      }
      
      const isStandalone = (window.navigator as any).standalone === true ||
                          window.matchMedia('(display-mode: standalone)').matches
      
      const canInstallPWA = 'serviceWorker' in navigator && 
                           'PushManager' in window &&
                           !isStandalone

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        platform,
        screenWidth,
        screenHeight,
        pixelRatio,
        touchSupport,
        orientation,
        isStandalone,
        isIOS,
        isAndroid,
        canInstallPWA
      })
    }

    detectMobileInfo()
    
    const handleChange = () => setTimeout(detectMobileInfo, 100)
    window.addEventListener('orientationchange', handleChange)
    window.addEventListener('resize', handleChange)
    
    return () => {
      window.removeEventListener('orientationchange', handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  return mobileInfo
} 