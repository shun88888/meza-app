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
  const [isLocked, setIsLocked] = useState(false) // Temporarily disabled for testing
  const [lockMethod, setLockMethod] = useState<'slide' | 'passcode' | 'both'>('both')
  const [hasAutoCharged, setHasAutoCharged] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  
  const router = useRouter()
  const slideToWakeRef = useRef<SlideToWakeRef>(null)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Set theme color and background to white
  useEffect(() => {
    // Set theme color to white
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#ffffff'
      document.head.appendChild(meta)
    }
    
    // Force white background on all elements
    document.body.style.background = '#ffffff'
    document.body.style.backgroundColor = '#ffffff'
    document.documentElement.style.background = '#ffffff'
    document.documentElement.style.backgroundColor = '#ffffff'
    document.documentElement.style.setProperty('--status-bar-gradient', '#ffffff')
    
    // Override any potential CSS classes
    document.body.classList.remove('dark')
    document.documentElement.classList.remove('dark')
    
    return () => {
      // Keep white background when component unmounts
      document.body.style.background = '#ffffff'
      document.body.style.backgroundColor = '#ffffff'
      document.documentElement.style.background = '#ffffff'
      document.documentElement.style.backgroundColor = '#ffffff'
      document.documentElement.style.setProperty('--status-bar-gradient', '#ffffff')
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

        // Enhanced logging for database challenge data
        console.log('=== RAW CHALLENGE DATA FROM DATABASE ===')
        console.log('Raw challenge object:', challenge)
        console.log('target_time field:', challenge.target_time)
        console.log('wake_time field:', challenge.wake_time)
        console.log('started_at field:', challenge.started_at)
        console.log('status field:', challenge.status)
        
        // Convert to UI format with better fallback logic
        const wakeTimeValue = challenge.target_time || challenge.wake_time
        if (!wakeTimeValue) {
          console.error('❌ No wake time found in challenge data!')
          console.log('Available fields:', Object.keys(challenge))
        }
        
        const challengeData: ChallengeData = {
          id: challenge.id,
          wakeTime: wakeTimeValue,
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

        console.log('=== PROCESSED CHALLENGE DATA ===')
        console.log('Processed challengeData:', challengeData)
        console.log('wakeTime value:', challengeData.wakeTime)
        console.log('wakeTime type:', typeof challengeData.wakeTime)
        
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

  const handleAutoCharge = async () => {
    console.log('🔥 handleAutoCharge called!')
    console.log('Challenge data:', challengeData)
    
    if (!challengeData || !challengeData.id) {
      console.error('❌ Challenge data or ID is missing:', challengeData)
      return
    }
    
    console.log('✅ Starting auto-charge process for challenge:', challengeData.id)
    setIsTracking(true)
    
    try {
      // First complete the challenge as failed
      const completeResponse = await fetch(`/api/challenges/${challengeData.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_lat: challengeData.startLocation.lat,
          current_lng: challengeData.startLocation.lng,
          current_address: '起床時間経過のため自動失敗',
          distance_to_target: 0,
          is_success: false,
          auto_charge: true
        })
      })
      
      if (!completeResponse.ok) {
        throw new Error('Failed to complete challenge')
      }

      // Then process auto-charge
      const autoChargeResponse = await fetch('/api/auto-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challengeData.id,
          amount: challengeData.penaltyAmount
        })
      })

      const autoChargeResult = await autoChargeResponse.json()

      if (autoChargeResult.success) {
        // Store failure data for the failed page
        localStorage.setItem('failedChallengeData', JSON.stringify({
          penaltyAmount: challengeData.penaltyAmount,
          reason: '起床時間を過ぎました',
          timestamp: new Date().toISOString()
        }))
        
        localStorage.removeItem('activeChallenge')
        router.push('/challenge-failed')
      } else {
        throw new Error(autoChargeResult.error || 'Auto charge failed')
      }
    } catch (error) {
      console.error('Auto charge error:', error)
      
      // Even if auto-charge fails, still show failure screen with manual payment option
      localStorage.setItem('failedChallengeData', JSON.stringify({
        penaltyAmount: challengeData.penaltyAmount,
        reason: '起床時間を過ぎました（決済処理が必要です）',
        timestamp: new Date().toISOString(),
        needsManualPayment: true,
        challengeId: challengeData.id
      }))
      
      localStorage.removeItem('activeChallenge')
      router.push('/challenge-failed')
    } finally {
      setIsTracking(false)
    }
  }

  const handleDissolveChallenge = async () => {
    if (!challengeData) return
    
    // Check if wake time has already passed
    const now = new Date()
    const wakeTime = new Date(challengeData.wakeTime)
    
    if (now > wakeTime) {
      // Force auto-charge if wake time has passed
      handleAutoCharge()
      return
    }
    
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
          if (slideToWakeRef.current) {
            slideToWakeRef.current.reset()
          }
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
        if (slideToWakeRef.current) {
          slideToWakeRef.current.reset()
        }
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
      
      // Fast time check for auto-charge
      if (challengeData && challengeData.wakeTime && challengeData.id && !hasAutoCharged && !isTracking) {
        try {
          const wakeTime = new Date(challengeData.wakeTime)
          
          // Lightweight time comparison for speed
          if (!isNaN(wakeTime.getTime()) && now > wakeTime) {
            console.log('🚨 WAKE TIME PASSED! Immediate auto-failure!')
            console.log('Time difference:', now.getTime() - wakeTime.getTime(), 'ms')
            
            // Set states immediately
            setIsTimeUp(true)
            setHasAutoCharged(true)
            
            // Start auto-charge process with highest priority
            setTimeout(() => handleAutoCharge(), 0)
          }
        } catch (error) {
          console.error('Error in time check:', error)
        }
      }
    }
    
    // Run immediately and then every 100ms for faster response
    updateTime()
    const interval = setInterval(updateTime, 100)
    return () => clearInterval(interval)
  }, [isClient, challengeData, isTracking, hasAutoCharged, isTimeUp])

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-lg">読み込み中...</div>
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
    <div 
      className="fixed inset-0 overflow-hidden bg-white text-black" 
      style={{ 
        height: 'calc(var(--vh, 1vh) * 100)'
      }}
    >
      {/* Main Content */}
      <main className="h-full flex flex-col items-center justify-between px-6 py-safe-offset">
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold mb-3 text-black">チャレンジ実行中</h1>
            <div className="w-16 h-1 bg-yellow-400 mx-auto rounded-full"></div>
            
            {/* Debug Buttons - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    console.log('=== MANUAL TEST: Forcing time up ===')
                    setIsTimeUp(true)
                    setHasAutoCharged(true)
                    handleAutoCharge() // Immediate execution
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white text-sm rounded"
                >
                  Test Time Up
                </button>
                <button
                  onClick={() => {
                    if (challengeData) {
                      console.log('=== CHALLENGE DEBUG INFO ===')
                      console.log('Challenge Data:', challengeData)
                      console.log('Current Time:', new Date().toISOString())
                      console.log('Wake Time Raw:', challengeData.wakeTime)
                      console.log('Wake Time Parsed:', new Date(challengeData.wakeTime).toISOString())
                      console.log('Time Comparison:', new Date() > new Date(challengeData.wakeTime))
                      console.log('State:', { hasAutoCharged, isTracking, isTimeUp })
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded"
                >
                  Debug Info
                </button>
                <button
                  onClick={() => {
                    if (challengeData) {
                      const pastTime = new Date(Date.now() - 10000) // 10 seconds ago
                      console.log('=== SETTING WAKE TIME TO PAST ===')
                      console.log('Old wake time:', challengeData.wakeTime)
                      console.log('New wake time:', pastTime.toISOString())
                      setChallengeData({ ...challengeData, wakeTime: pastTime.toISOString() })
                      setHasAutoCharged(false) // Reset to allow auto-charge to trigger
                      setIsTimeUp(false)
                    }
                  }}
                  className="w-full px-4 py-2 bg-orange-500 text-white text-sm rounded"
                >
                  Set Wake Time to Past
                </button>
              </div>
            )}
          </div>

          {/* Current Time */}
          <div className="w-full mb-6">
            <div className={`bg-white rounded-3xl p-6 shadow-lg ${isTimeUp ? 'ring-4 ring-red-500 ring-opacity-50' : ''}`}>
              <div className="text-center">
                <p className={`text-sm mb-3 font-medium ${isTimeUp ? 'text-red-600' : 'text-gray-600'}`}>
                  {isTimeUp ? '時間切れ！' : '現在の時刻'}
                </p>
                <div className={`text-5xl font-light tracking-wider ${isTimeUp ? 'text-red-600' : 'text-black'}`}>
                  {currentTime}
                </div>
                {isTimeUp && (
                  <p className="text-red-500 text-sm mt-2 font-medium">起床時間を過ぎました</p>
                )}
              </div>
            </div>
          </div>

          {/* Wake Time & Penalty */}
          <div className="w-full mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-lg space-y-4">
              {/* Wake Time */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">起床時間</span>
                  <span className="text-xl font-semibold text-yellow-500">
                    {formatWakeTime(challengeData.wakeTime)}
                  </span>
                </div>
              </div>

              {/* Penalty Amount */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">覚悟金額</span>
                  <span className="text-xl font-semibold text-red-500">¥{challengeData.penaltyAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide to Wake */}
          <div className="w-full">
            <SlideToWake
              ref={slideToWakeRef}
              onSlideComplete={handleDissolveChallenge}
              disabled={isTracking || isTimeUp}
              className="w-full"
              text={isTimeUp ? "時間切れです" : "スライドで解除"}
              completedText="解除完了!"
            />
            
            {isTracking && (
              <div className="mt-4 text-center opacity-0 animate-[fadeIn_0.05s_ease-out_forwards]">
                <div className="inline-flex items-center text-yellow-500 bg-gray-50 rounded-lg px-4 py-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  位置情報を確認中...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spacer for safe area */}
        <div className="w-full max-w-sm pb-safe"></div>
      </main>

      {/* Time Up Overlay */}
      {isTimeUp && (
        <div className="fixed inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" className="text-white">
                <path 
                  fill="currentColor" 
                  d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">時間切れ！</h1>
            <p className="text-xl mb-2">起床時間を過ぎました</p>
            <p className="text-lg opacity-90">自動決済処理中...</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        
        /* Force white background for active challenge page */
        html, body {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
        
        html.dark, body.dark {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  )
} 