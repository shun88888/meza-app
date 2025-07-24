'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SlideToWake, { SlideToWakeRef } from '@/components/SlideToWake'
import ChallengeLockScreen from '@/components/ChallengeLockScreen'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'

interface ChallengeData {
  id: string
  wakeTime: string
  penaltyAmount: number
  startLocation: { lat: number; lng: number }
  startTime: string
  wakeUpLocation?: {
    lat: number
    lng: number
    address?: string
  }
  paymentMethod?: string
}

export default function ActiveChallengePage() {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [lockMethod, setLockMethod] = useState<'slide' | 'passcode' | 'both'>('both')
  const router = useRouter()
  const slideToWakeRef = useRef<SlideToWakeRef>(null)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])
  
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
    
    // Set background gradient for main content
    document.body.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
    
    // Set status bar gradient to match main background
    document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)')
    
    return () => {
      // Reset theme color and background when component unmounts
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FED7AA')
      }
      document.body.style.background = 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
      document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)')
    }
  }, [])
  


  useEffect(() => {
    const fetchActiveChallenge = async () => {
      try {
        // Try localStorage first for immediate access
        const localChallenge = localStorage.getItem('activeChallenge')
        if (localChallenge) {
          try {
            const parsedChallenge = JSON.parse(localChallenge)
            setChallengeData(parsedChallenge)
            return
          } catch (parseError) {
            console.error('Error parsing local challenge:', parseError)
            localStorage.removeItem('activeChallenge')
          }
        }

        // If no localStorage, try database
        const user = await getCurrentUser()
        if (!user) {
          router.push('/auth/signin')
          return
        }

        const supabase = createClientSideClient()
        if (!supabase) {
          console.error('Failed to create Supabase client')
          router.push('/')
          return
        }
        
        const { data: challenges, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (error) {
          console.error('Database query error:', error)
          router.push('/')
          return
        }

        const challenge = challenges && challenges.length > 0 ? challenges[0] : null

        if (!challenge) {
          console.log('No active challenge found')
          router.push('/')
          return
        }

        // Convert to UI format
        const challengeData: ChallengeData = {
          id: challenge.id,
          wakeTime: challenge.target_time,
          penaltyAmount: challenge.penalty_amount,
          startLocation: {
            lat: challenge.home_lat || challenge.home_latitude,
            lng: challenge.home_lng || challenge.home_longitude
          },
          startTime: challenge.started_at || new Date().toISOString(),
          wakeUpLocation: {
            lat: challenge.target_lat || challenge.target_latitude,
            lng: challenge.target_lng || challenge.target_longitude,
            address: challenge.target_address
          },
          paymentMethod: '登録済みのカード'
        }

        setChallengeData(challengeData)
      } catch (error) {
        console.error('Error fetching active challenge:', error)
        router.push('/')
      }
    }

    fetchActiveChallenge()
  }, [router])

  // ロック解除ハンドラー
  const handleUnlock = () => {
    setIsLocked(false)
    
    // 解除時刻をローカルストレージに保存
    const unlockTime = new Date().toISOString()
    localStorage.setItem('challengeUnlockTime', unlockTime)
  }

  const handleDissolveChallenge = async () => {
    if (!challengeData) return
    
    setIsTracking(true)
    
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
        // Success: Complete the challenge
        try {
          const completeResponse = await fetch(`/api/challenges/${challengeData.id}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              current_lat: currentLocation.lat,
              current_lng: currentLocation.lng,
              current_address: '現在位置',
              distance_to_target: distance,
              is_success: true
            })
          })
          
          if (completeResponse.ok) {
            alert(`チャレンジ成功！${Math.round(distance)}m移動しました。罰金は発生しません。`)
            router.push('/')
          } else {
            throw new Error('Failed to complete challenge')
          }
        } catch (error) {
          console.error('Error completing challenge:', error)
          alert('チャレンジ完了の処理に失敗しました。')
        }
      } else {
        // Failed: Check if this is past wake time, if so trigger completion as failed
        const wakeTime = new Date(challengeData.wakeTime)
        const currentTime = new Date()
        
        if (currentTime > wakeTime) {
          // Challenge failed - complete as failed
          try {
            const completeResponse = await fetch(`/api/challenges/${challengeData.id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                current_lat: currentLocation.lat,
                current_lng: currentLocation.lng,
                current_address: '現在位置',
                distance_to_target: distance,
                is_success: false
              })
            })
            
            if (completeResponse.ok) {
              alert(`チャレンジ失敗：移動距離不足（${Math.round(distance)}m）\nペナルティ決済画面に移動します。`)
              router.push(`/challenge/${challengeData.id}/payment`)
            } else {
              throw new Error('Failed to complete challenge')
            }
          } catch (error) {
            console.error('Error completing challenge:', error)
            alert('チャレンジ完了処理でエラーが発生しました。手動で決済してください。')
            router.push(`/challenge/${challengeData.id}/payment`)
          }
        } else {
          // Still within wake time, continue challenge
          alert(`移動距離が不足しています（${Math.round(distance)}m）。100m以上移動する必要があります。チャレンジは継続中です。`)
          // Reset the slide component to initial state
          slideToWakeRef.current?.reset()
          // チャレンジは継続、画面もそのまま
        }
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
        router.push('/')
      } else {
        // Reset the slide component to initial state when user cancels
        slideToWakeRef.current?.reset()
      }
      // キャンセルした場合はチャレンジ継続
    } finally {
      setIsTracking(false)
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

  const getInitialTime = () => {
    if (!isClient) return '00:00:00'
    const now = new Date()
    return now.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  const [currentTime, setCurrentTime] = useState(getInitialTime())
  
  useEffect(() => {
    if (!isClient) return
    
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [isClient])

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

  // ロック画面を表示
  if (isLocked) {
    return (
      <ChallengeLockScreen
        challengeData={{
          ...challengeData,
          wakeUpLocation: challengeData.wakeUpLocation || null,
          paymentMethod: challengeData.paymentMethod || '登録済みのカード'
        }}
        onUnlock={handleUnlock}
        unlockMethod={lockMethod}
        passcode="1234"
        unlockRestrictions={{
          timeRestriction: true,
          locationRestriction: true,
          minDistance: 100
        }}
      />
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
            {currentTime}
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
          disabled={isTracking}
          className="w-full"
          text="スライドで解除"
          completedText="解除完了!"
        />
        
        {isTracking && (
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