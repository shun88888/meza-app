'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import SlideToWake from '@/components/SlideToWake'
import CountdownScreen from '@/components/CountdownScreen'
import ErrorBoundary from '@/components/ErrorBoundary'

// Dynamic import to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="loading-container" style={{ height: '612px' }}>
      <div>地図を読み込み中...</div>
    </div>
  )
})

interface Location {
  lat: number
  lng: number
  address?: string
}

interface ChallengeData {
  wakeTime: string
  penaltyAmount: number
  homeLocation: Location | null
  targetLocation: Location | null
  paymentMethod: string
}

export default function CreateChallengePage() {
  const router = useRouter()
  const [showCountdown, setShowCountdown] = useState(false)
  
  // Optimize theme changes - only update when needed
  useEffect(() => {
    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      const themeColor = showCountdown ? '#FED7AA' : '#ffffff'
      const bgGradient = showCountdown 
        ? 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
      
      if (!metaThemeColor) {
        const meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
        metaThemeColor = meta
      }
      
      metaThemeColor.setAttribute('content', themeColor)
      document.body.style.background = bgGradient
      document.documentElement.style.setProperty('--status-bar-gradient', bgGradient)
      
      return () => {
        try {
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#FED7AA')
          }
          document.body.style.background = 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
          document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)')
        } catch (error) {
          console.error('Error resetting theme:', error)
        }
      }
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }, [showCountdown])
  

  
  // Set default wake time to tomorrow at 8:00 AM
  const getDefaultWakeTime = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)
    return tomorrow.toISOString()
  }
  
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    wakeTime: getDefaultWakeTime(),
    penaltyAmount: 300,
    homeLocation: null,
    targetLocation: null,
    paymentMethod: '●●●● ●●●● ●●●● 1071'
  })

  const handleLocationSelect = (location: Location) => {
    setChallengeData(prev => ({
      ...prev,
      targetLocation: location
    }))
  }

  const handleSlideComplete = () => {
    // Save start location for later use
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const startLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          // Store challenge data with start location
          localStorage.setItem('activeChallenge', JSON.stringify({
            ...challengeData,
            startLocation,
            startTime: new Date().toISOString()
          }))
          
          // Show countdown
          setShowCountdown(true)
        },
        (error) => {
          console.error('Error getting start location:', error)
          // Use mock location if GPS fails
          localStorage.setItem('activeChallenge', JSON.stringify({
            ...challengeData,
            startLocation: { lat: 35.6762, lng: 139.6503 },
            startTime: new Date().toISOString()
          }))
          setShowCountdown(true)
        }
      )
    } else {
      // Use mock location if geolocation not supported
      localStorage.setItem('activeChallenge', JSON.stringify({
        ...challengeData,
        startLocation: { lat: 35.6762, lng: 139.6503 },
        startTime: new Date().toISOString()
      }))
      setShowCountdown(true)
    }
  }

  const handleCountdownComplete = () => {
    router.push('/active-challenge')
  }

  const handleCountdownCancel = () => {
    setShowCountdown(false)
    localStorage.removeItem('activeChallenge')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '未設定'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '未設定'
      }
      const days = ['日', '月', '火', '水', '木', '金', '土']
      const dayOfWeek = days[date.getDay()]
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} (${dayOfWeek}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } catch (error) {
      console.error('Error formatting date:', error)
      return '未設定'
    }
  }

  if (showCountdown) {
    return (
      <CountdownScreen
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
        duration={3}
      />
    )
  }

  return (
    <div className="full-screen-safe overflow-hidden bg-gray-50 relative" style={{ zIndex: 1001 }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 p-4 pt-safe">
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
          <h1 className="ml-2 text-lg font-semibold text-gray-800">チャレンジを作成</h1>
        </div>
      </div>

      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary 
          fallback={
            <div className="loading-container" style={{ height: '100%' }}>
              <div>地図コンポーネントのエラーが発生しました</div>
            </div>
          }
        >
          <MapPicker
            location={challengeData.targetLocation}
            onLocationSelect={handleLocationSelect}
            height="100%"
            className="w-full h-full"
          />
        </ErrorBoundary>
      </div>

      {/* Bottom Overlay with Settings */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
        <div className="p-4 pb-safe">
          {/* Settings Cards Container */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            
            {/* 起床場所 */}
            <div className="flex items-center h-12 px-4 border-b border-gray-100">
              <div className="w-16 text-xs text-gray-500 tracking-wide">起床場所</div>
              <div className="flex-1 text-sm text-gray-800">
                神奈川県横浜市　金沢区泥亀一丁目
              </div>
            </div>

            {/* 目覚時間 */}
            <button 
              className="w-full flex items-center h-12 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                // Cycle through different wake times
                const currentDate = new Date(challengeData.wakeTime)
                const currentHour = currentDate.getHours()
                const hours = [6, 7, 8, 9, 10]
                const currentIndex = hours.indexOf(currentHour)
                const nextIndex = (currentIndex + 1) % hours.length
                
                const newWakeTime = new Date(currentDate)
                newWakeTime.setHours(hours[nextIndex], 0, 0, 0)
                
                setChallengeData(prev => ({
                  ...prev,
                  wakeTime: newWakeTime.toISOString()
                }))
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">目覚時間</div>
              <div className="flex-1 text-sm text-gray-800 text-left">
                {formatDate(challengeData.wakeTime)}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>

            {/* 覚悟金額 */}
            <button 
              className="w-full flex items-center h-12 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                const amounts = [100, 300, 500, 1000, 3000, 5000]
                const currentIndex = amounts.indexOf(challengeData.penaltyAmount)
                const nextIndex = (currentIndex + 1) % amounts.length
                setChallengeData(prev => ({
                  ...prev,
                  penaltyAmount: amounts[nextIndex]
                }))
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">覚悟金額</div>
              <div className="flex-1 text-sm text-gray-800 text-left">
                ￥{challengeData.penaltyAmount.toLocaleString()}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>

            {/* 支払方法 */}
            <button className="w-full flex items-center h-12 px-4 hover:bg-gray-50 transition-colors duration-50">
              <div className="w-16 text-xs text-gray-500 tracking-wide">支払方法</div>
              <div className="flex-1 flex items-center text-sm text-gray-800">
                {/* Visa icon */}
                <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
                  <g fill="none" fillRule="nonzero">
                    <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
                    <path fill="#171E6C" d="M2.788 5.914A7.201 7.201 0 001 5.237l.028-.125h2.737c.371.013.672.125.77.519l.595 2.836.182.854 1.666-4.21h1.799l-2.674 6.167H4.304L2.788 5.914zm7.312 5.37H8.399l1.064-6.172h1.7L10.1 11.284zm6.167-6.021l-.232 1.333-.153-.066a3.054 3.054 0 00-1.268-.236c-.671 0-.972.269-.98.531 0 .29.365.48.96.762.98.44 1.435.979 1.428 1.681-.014 1.28-1.176 2.108-2.96 2.108-.764-.007-1.5-.158-1.898-.328l.238-1.386.224.099c.553.23.917.328 1.596.328.49 0 1.015-.19 1.022-.604 0-.27-.224-.466-.882-.769-.644-.295-1.505-.788-1.491-1.674C11.878 5.84 13.06 5 14.74 5c.658 0 1.19.138 1.526.263zm2.26 3.834h1.415c-.07-.308-.392-1.786-.392-1.786l-.12-.531c-.083.23-.23.604-.223.59l-.68 1.727zm2.1-3.985L22 11.284h-1.575s-.154-.71-.203-.926h-2.184l-.357.926h-1.785l2.527-5.66c.175-.4.483-.512.889-.512h1.316z"/>
                  </g>
                </svg>
                {challengeData.paymentMethod}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Slide to confirm */}
          <SlideToWake
            onSlideComplete={handleSlideComplete}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
} 