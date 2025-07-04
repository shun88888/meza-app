'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Location {
  lat: number
  lng: number
  address?: string
}

export default function CompleteChallengePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  


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

  const handleCompleteChallenge = async () => {
    if (!currentLocation) {
      alert('まず位置情報を取得してください。')
      return
    }

    setIsVerifying(true)
    try {
      // Mock verification delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, just show success and redirect
      alert('チャレンジが正常に完了しました！おめでとうございます！')
      router.push('/')
    } catch (error) {
      console.error('Error completing challenge:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsVerifying(false)
    }
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
                  {currentLocation ? currentLocation.address : '未取得'}
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

            {currentLocation && (
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
            <li>2. 目標地点に到着していることを確認</li>
            <li>3. 「チャレンジ完了」ボタンでチャレンジを完了</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 