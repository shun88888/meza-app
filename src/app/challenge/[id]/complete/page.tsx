'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createPaymentIntent, confirmPayment } from '@/lib/stripe'
import { loadStripe } from '@stripe/stripe-js'
import { formatAddress } from '@/lib/addressFormatter'
import CompletionScreen from '@/components/CompletionScreen'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface Challenge {
  id: string
  wakeTime: string
  penaltyAmount: number
  homeLocation: Location
  targetLocation: Location
  paymentMethod: string
  status: 'pending' | 'active' | 'completed' | 'failed'
}

export default function CompleteChallengePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [showPenaltyPayment, setShowPenaltyPayment] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [showFailureScreen, setShowFailureScreen] = useState(false)
  


  const getCurrentLocation = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: '現在の位置'
          })
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('位置情報の取得に失敗しました。設定を確認してください。')
          setLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      alert('このブラウザは位置情報をサポートしていません。')
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenges/${params.id}`)
        if (response.ok) {
          const { challenge: apiChallenge } = await response.json()
          // Convert API format to UI format
          const uiChallenge: Challenge = {
            id: apiChallenge.id,
            wakeTime: apiChallenge.target_time,
            penaltyAmount: apiChallenge.penalty_amount,
            homeLocation: {
              lat: apiChallenge.home_lat || apiChallenge.home_latitude,
              lng: apiChallenge.home_lng || apiChallenge.home_longitude,
              address: apiChallenge.home_address
            },
            targetLocation: {
              lat: apiChallenge.target_lat || apiChallenge.target_latitude,
              lng: apiChallenge.target_lng || apiChallenge.target_longitude,
              address: apiChallenge.target_address
            },
            paymentMethod: '●●●● ●●●● ●●●● 1071',
            status: apiChallenge.status
          }
          setChallenge(uiChallenge)
        } else {
          console.error('Failed to fetch challenge')
        }
      } catch (error) {
        console.error('Error fetching challenge:', error)
      }
    }
    
    if (params.id) {
      fetchChallenge()
    }
  }, [params.id])

  const handleCompleteChallenge = async () => {
    if (!currentLocation || !challenge) {
      alert('まず位置情報を取得してください。')
      return
    }
    setIsVerifying(true)
    try {
      // Calculate distance to target
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        challenge.targetLocation.lat,
        challenge.targetLocation.lng
      )
      
      // Get current address
      let currentAddress = currentLocation.address
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}`)
        if (response.ok) {
          const data = await response.json()
          currentAddress = formatAddress(data.display_name)
        }
      } catch (addressError) {
        console.error('Error getting address:', addressError)
      }
      
      // Call completion API
      const isSuccess = distance <= 100
      const completeResponse = await fetch(`/api/challenges/${challenge.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_lat: currentLocation.lat,
          current_lng: currentLocation.lng,
          current_address: currentAddress,
          distance_to_target: distance,
          is_success: isSuccess
        })
      })
      
      if (completeResponse.ok) {
        const result = await completeResponse.json()
        if (isSuccess) {
          setShowSuccessScreen(true)
        } else {
          setShowFailureScreen(true)
        }
      } else {
        throw new Error('Failed to complete challenge')
      }
    } catch (error) {
      console.error('Error completing challenge:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePenaltyPayment = async () => {
    if (!challenge) return
    setPaymentProcessing(true)
    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent(
        challenge.penaltyAmount,
        challenge.id,
        'demo-user-id' // In real app, get from auth
      )
      // Load Stripe
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }
      // Confirm payment
      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/challenge/${challenge.id}/complete?payment_intent_id=${paymentIntentId}`,
        },
      })
      if (error) {
        throw error
      }
      // Payment successful
      await confirmPayment(paymentIntentId)
      alert('ペナルティ決済が完了しました。')
      router.push('/')
    } catch (error) {
      console.error('Payment error:', error)
      alert('決済に失敗しました。もう一度お試しください。')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleRetryChallenge = () => {
    setShowPenaltyPayment(false)
    setCurrentLocation(null)
  }

  // Success Screen
  if (showSuccessScreen) {
    return (
      <CompletionScreen
        isSuccess={true}
        title="チャレンジ成功！"
        message="おめでとうございます！目標地点に時間内に到着しました。素晴らしい早起きでした！"
        primaryButtonText="ホームに戻る"
        onPrimaryAction={() => router.push('/')}
        showConfetti={true}
        autoRedirect={{
          url: '/',
          delay: 10000
        }}
      />
    )
  }

  // Failure Screen
  if (showFailureScreen) {
    return (
      <CompletionScreen
        isSuccess={false}
        title="チャレンジ失敗"
        message="目標時間内に到着できませんでした。ペナルティ決済が必要です。"
        penaltyAmount={challenge?.penaltyAmount}
        primaryButtonText="ペナルティを支払う"
        secondaryButtonText="再チャレンジ"
        onPrimaryAction={() => setShowPenaltyPayment(true)}
        onSecondaryAction={() => {
          setShowFailureScreen(false)
          setCurrentLocation(null)
        }}
      />
    )
  }

  if (showPenaltyPayment) {
    return (
      <div className="h-screen-mobile w-full max-w-full overflow-hidden bg-gray-50 fixed inset-0">
        {/* Header */}
        <div className="bg-gray-50/95 border-b border-gray-200 p-4">
          <div className="flex items-center">
            <button
              onClick={() => setShowPenaltyPayment(false)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-800">ペナルティ決済</h1>
          </div>
        </div>
        {/* Content */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="red">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">チャレンジ失敗</h2>
              <p className="text-gray-600 mb-4">
                指定時間内に目標地点に到着できませんでした。
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-lg font-bold text-red-800">
                  ￥{challenge?.penaltyAmount.toLocaleString()} のペナルティ
                </div>
                <div className="text-sm text-red-600 mt-1">
                  決済方法: {challenge?.paymentMethod}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePenaltyPayment}
                disabled={paymentProcessing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
              >
                {paymentProcessing ? '決済処理中...' : 'ペナルティを支払う'}
              </Button>
              <Button
                onClick={handleRetryChallenge}
                variant="outline"
                className="w-full"
              >
                再チャレンジ
              </Button>
            </div>
          </div>
          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">ペナルティについて</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 指定時間内に目標地点に到着できなかった場合のペナルティです</li>
              <li>• 決済は安全なStripeで処理されます</li>
              <li>• 再チャレンジで再度挑戦できます</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen-mobile w-full max-w-full overflow-hidden bg-gray-50 fixed inset-0">
      {/* Header */}
      <div className="bg-gray-50/95 border-b border-gray-200 p-4">
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
          <h1 className="ml-2 text-lg font-semibold text-gray-800">チャレンジ完了</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">目標地点に到着</h2>
            <p className="text-gray-600">
              位置情報を確認して、チャレンジを完了しましょう！
            </p>
          </div>

          {/* Location Status */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">現在の位置</div>
                <div className="text-sm text-gray-600">
                  {currentLocation ? formatAddress(currentLocation.address || null) : '未取得'}
                </div>
              </div>
              <Button
                onClick={getCurrentLocation}
                disabled={loading}
                variant="outline"
                className="min-w-[80px]"
              >
                {loading ? '取得中...' : '位置取得'}
              </Button>
            </div>

            {challenge && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">チャレンジ情報</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>ペナルティ金額: ￥{challenge.penaltyAmount.toLocaleString()}</div>
                  <div>目標地点: {formatAddress(challenge.targetLocation.address || null)}</div>
                  <div>判定範囲: 100m以内</div>
                </div>
              </div>
            )}
            {currentLocation && challenge && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="green" className="mr-2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span className="text-green-800 font-medium">位置情報が取得されました</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  緯度: {currentLocation.lat.toFixed(6)}, 経度: {currentLocation.lng.toFixed(6)}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  目標地点までの距離: {calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    challenge.targetLocation.lat,
                    challenge.targetLocation.lng
                  ).toFixed(0)}m
                </div>
              </div>
            )}
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleCompleteChallenge}
            disabled={!currentLocation || isVerifying}
            className="w-full bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] hover:from-[#FF8A00] hover:to-[#FFAD2F] text-white font-semibold py-3 text-lg"
          >
            {isVerifying ? '確認中...' : 'チャレンジ完了'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">完了方法</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 「位置取得」ボタンで現在の位置を確認</li>
            <li>2. 目標地点から100m以内にいることを確認</li>
            <li>3. 「チャレンジ完了」ボタンでチャレンジを完了</li>
            <li>4. 失敗した場合はペナルティ決済が必要です</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 