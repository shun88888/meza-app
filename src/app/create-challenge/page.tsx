'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import CountdownScreen from '@/components/CountdownScreen'

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">地図を読み込み中...</div>
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
  
  // Set white theme color and background for create challenge page
  useEffect(() => {
    if (!showCountdown) {
      // Set theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff')
      }
      
      // Set background gradient for body
      const originalBackground = document.body.style.background
      document.body.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
      
      // Update status bar area background
      const statusBarStyle = document.createElement('style')
      statusBarStyle.textContent = `
        body::before {
          background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%) !important;
        }
      `
      document.head.appendChild(statusBarStyle)
      
      return () => {
        // Reset when component unmounts
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#FED7AA')
        }
        document.body.style.background = originalBackground
        document.head.removeChild(statusBarStyle)
      }
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

  const handleStartChallenge = () => {
    // Validate required fields
    if (!challengeData.targetLocation) {
      alert('目標地点を選択してください')
      return
    }

    // Save challenge data to localStorage
    localStorage.setItem('activeChallenge', JSON.stringify(challengeData))
    
    // Show countdown before starting
    setShowCountdown(true)
  }

  const handleCountdownComplete = () => {
    // Navigate to active challenge page
    router.push('/active-challenge')
  }

  const handleCountdownCancel = () => {
    setShowCountdown(false)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    return `${month}/${day} ${hours}:${minutes.toString().padStart(2, '0')}`
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
    <div className="bg-gradient-map min-h-screen-mobile p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">チャレンジ作成</h1>
          <p className="text-gray-600">起床時刻と目標地点を設定してください</p>
        </div>

        {/* Wake Time Setting */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">起床時刻</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">明日の起床時刻</span>
            <input
              type="datetime-local"
              value={challengeData.wakeTime.slice(0, 16)}
              onChange={(e) => setChallengeData(prev => ({
                ...prev,
                wakeTime: new Date(e.target.value).toISOString()
              }))}
              className="text-lg font-semibold text-orange-600 bg-transparent border-none outline-none"
              aria-label="起床時刻"
            />
          </div>
        </div>

        {/* Penalty Amount */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ペナルティ金額</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">失敗時の支払い額</span>
            <select
              value={challengeData.penaltyAmount}
              onChange={(e) => setChallengeData(prev => ({
                ...prev,
                penaltyAmount: parseInt(e.target.value)
              }))}
              className="text-lg font-semibold text-orange-600 bg-transparent border-none outline-none"
              aria-label="ペナルティ金額"
            >
              <option value={300}>¥300</option>
              <option value={500}>¥500</option>
              <option value={1000}>¥1,000</option>
              <option value={2000}>¥2,000</option>
              <option value={5000}>¥5,000</option>
            </select>
          </div>
        </div>

        {/* Target Location */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">目標地点</h2>
          <p className="text-gray-600 mb-4">起床時刻に到達する必要がある場所を選択してください</p>
          
          <div className="h-64 rounded-lg overflow-hidden">
            <MapPicker
              location={challengeData.targetLocation}
              onLocationSelect={handleLocationSelect}
            />
          </div>
          
          {challengeData.targetLocation && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                📍 {challengeData.targetLocation.address || '選択された地点'}
              </p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">支払い方法</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">登録済みカード</span>
            <span className="text-lg font-mono text-gray-900">
              {challengeData.paymentMethod}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-orange-50 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">チャレンジ概要</h3>
          <div className="space-y-2 text-sm text-orange-800">
            <p>⏰ 起床時刻: {formatDateTime(challengeData.wakeTime)}</p>
            <p>💰 ペナルティ: ¥{challengeData.penaltyAmount.toLocaleString()}</p>
            <p>📍 目標地点: {challengeData.targetLocation?.address || '未設定'}</p>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartChallenge}
          disabled={!challengeData.targetLocation}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-4 text-lg rounded-xl transition-colors"
        >
          チャレンジを開始
        </Button>
      </div>
    </div>
  )
} 