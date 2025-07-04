'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SlideToWake, { SlideToWakeRef } from '@/components/SlideToWake'

interface ChallengeData {
  wakeTime: string
  penaltyAmount: number
  startLocation: { lat: number; lng: number }
  startTime: string
}

export default function ActiveChallengePage() {
  const router = useRouter()
  const [isCheckingLocation, setIsCheckingLocation] = useState(false)
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const slideToWakeRef = useRef<SlideToWakeRef>(null)
  
  // Set dark slate theme color and background for active challenge page
  useEffect(() => {
    // Set theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0f172a')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#0f172a'
      document.head.appendChild(meta)
    }
    
    // Set background gradient
    document.body.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
    
    return () => {
      // Reset theme color and background when component unmounts
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FED7AA')
      }
      document.body.style.background = 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
    }
  }, [])
  


  useEffect(() => {
    // Load challenge data from localStorage
    const storedChallenge = localStorage.getItem('activeChallenge')
    if (storedChallenge) {
      try {
        const parsedData = JSON.parse(storedChallenge)
        // Ensure wakeTime has a default value if not set
        if (!parsedData.wakeTime) {
          const defaultWakeTime = new Date()
          defaultWakeTime.setHours(8, 0, 0, 0)
          parsedData.wakeTime = defaultWakeTime.toISOString()
        }
        setChallengeData(parsedData)
      } catch (error) {
        console.error('Error parsing challenge data:', error)
        router.push('/')
      }
    } else {
      // No active challenge, redirect to home
      router.push('/')
    }
  }, [router])

  const handleDissolveChallenge = async () => {
    if (!challengeData) return
    
    setIsCheckingLocation(true)
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      // Calculate distance from start location
      const distance = calculateDistance(
        challengeData.startLocation.lat,
        challengeData.startLocation.lng,
        currentLocation.lat,
        currentLocation.lng
      )

      if (distance >= 100) {
        // Success: Clear the active challenge and go home
        localStorage.removeItem('activeChallenge')
        alert(`チャレンジ成功！${Math.round(distance)}m移動しました。罰金は発生しません。`)
        router.push('/')
      } else {
        // Failed: Stay on the challenge screen, don't clear localStorage
        alert(`移動距離が不足しています（${Math.round(distance)}m）。100m以上移動する必要があります。チャレンジは継続中です。`)
        // Reset the slide component to initial state
        slideToWakeRef.current?.reset()
        // チャレンジは継続、画面もそのまま
      }
    } catch (error) {
      console.error('Location error:', error)
      let errorMessage = '位置情報の取得に失敗しました。'
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS位置情報の許可が必要です。ブラウザの設定で位置情報を許可してください。'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が利用できません。GPS機能が有効か確認してください。'
            break
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。再度お試しください。'
            break
          default:
            errorMessage = '位置情報の取得に失敗しました。設定を確認してください。'
        }
      }
      
      if (confirm(`${errorMessage}\n\nチャレンジを終了しますか？`)) {
        localStorage.removeItem('activeChallenge')
        router.push('/')
      } else {
        // Reset the slide component to initial state when user cancels
        slideToWakeRef.current?.reset()
      }
      // キャンセルした場合はチャレンジ継続
    } finally {
      setIsCheckingLocation(false)
    }
  }

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lng2-lng1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatWakeTime = (wakeTimeString: string) => {
    if (!wakeTimeString) {
      return '08:00'
    }
    try {
      // Handle both ISO string and regular time formats
      let date: Date
      if (wakeTimeString.includes('T') || wakeTimeString.includes('Z')) {
        // ISO string format
        date = new Date(wakeTimeString)
      } else if (wakeTimeString.includes(':')) {
        // Simple time format like "08:00"
        const [hours, minutes] = wakeTimeString.split(':')
        date = new Date()
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      } else {
        // Fallback
        date = new Date(wakeTimeString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '08:00'
      }
      
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting wake time:', error)
      return '08:00'
    }
  }

  if (!challengeData) {
    return (
      <div className="full-screen-safe overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center" style={{ zIndex: 1001 }}>
        <div className="text-gray-400">チャレンジデータを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="full-screen-safe overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col" style={{ zIndex: 1001 }}>
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-safe opacity-0 animate-[fadeIn_0.05s_ease-out_forwards]">
        <div className="text-center mb-12">
          <h1 className="text-xl font-light text-gray-300 mb-2">チャレンジ実行中</h1>
          <div className="w-16 h-1 bg-[#FFAD2F] mx-auto rounded-full"></div>
        </div>

        {/* Current Time */}
        <div className="text-center mb-10">
          <p className="text-base text-gray-400 mb-2">現在の時刻</p>
          <div className="text-5xl font-light">
            {getCurrentTime()}
          </div>
        </div>

        {/* Wake Time */}
        <div className="bg-slate-800/50 rounded-2xl p-5 mb-5 w-full max-w-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">起床時間</span>
            <span className="text-xl font-semibold text-[#FFAD2F]">
              {formatWakeTime(challengeData.wakeTime)}
            </span>
          </div>
        </div>

        {/* Penalty Amount */}
        <div className="bg-slate-800/50 rounded-2xl p-5 mb-12 w-full max-w-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">覚悟金額</span>
            <span className="text-xl font-semibold text-red-400">¥{challengeData.penaltyAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Slide to Dissolve */}
      <div className="px-6 pb-8 pb-safe">
        <div className="mb-3 text-center">
          <p className="text-xs text-gray-400">100m以上移動してチャレンジを解除</p>
        </div>
        
        <SlideToWake
          ref={slideToWakeRef}
          onSlideComplete={handleDissolveChallenge}
          disabled={isCheckingLocation}
          className="w-full"
          text="スライドで解除"
          completedText="解除完了!"
        />
        
        {isCheckingLocation && (
          <div className="mt-4 text-center opacity-0 animate-[fadeIn_0.05s_ease-out_forwards]">
            <div className="inline-flex items-center text-[#FFAD2F] bg-slate-800/50 rounded-lg px-4 py-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              位置情報を確認中...
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
} 