'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MapPicker from '@/components/MapPicker'
import SlideToWake from '@/components/SlideToWake'
import ErrorBoundary from '@/components/ErrorBoundary'

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

export default function ChallengePage() {
  const router = useRouter()
  const params = useParams()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)



  useEffect(() => {
    // Mock challenge data for demo
    const mockChallenge: Challenge = {
      id: params.id as string,
      wakeTime: '2025-07-02T08:00:00',
      penaltyAmount: 300,
      homeLocation: {
        lat: 35.3395,
        lng: 139.6342,
        address: '神奈川県横浜市　金沢区泥亀一丁目'
      },
      targetLocation: {
        lat: 35.3395,
        lng: 139.6342,
        address: '神奈川県横浜市　金沢区泥亀一丁目'
      },
      paymentMethod: '●●●● ●●●● ●●●● 1071',
      status: 'pending'
    }
    
    setChallenge(mockChallenge)
    setLoading(false)
  }, [params.id])

  const handleStartChallenge = async () => {
    if (!challenge) return
    
    try {
      setChallenge(prev => prev ? { ...prev, status: 'active' } : null)
      
      // Store challenge data for persistence
      localStorage.setItem('activeChallenge', JSON.stringify({
        ...challenge,
        startTime: new Date().toISOString(),
        startLocation: challenge.homeLocation
      }))
      
      // Navigate to active challenge instead of complete
      router.push('/active-challenge')
    } catch (error) {
      console.error('Error starting challenge:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const dayOfWeek = days[date.getDay()]
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} (${dayOfWeek}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">チャレンジが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
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
          <h1 className="ml-2 text-lg font-semibold text-gray-800">チャレンジ詳細</h1>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative bg-white">
        <ErrorBoundary 
          fallback={
            <div className="loading-container" style={{ height: '612px' }}>
              <div>地図の読み込みに失敗しました</div>
            </div>
          }
        >
          <MapPicker
            location={challenge.targetLocation}
            onLocationSelect={() => {}} // Read-only for this view
            height="612px"
            className="w-full"
          />
        </ErrorBoundary>
        
        {/* Slide to start overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <SlideToWake
            onSlideComplete={handleStartChallenge}
            disabled={challenge.status !== 'pending'}
            className="mx-4"
          />
        </div>
      </div>

      {/* Challenge Details */}
      <div className="bg-white">
        <div className="p-4 space-y-0">
          
          {/* 起床場所 */}
          <div className="flex items-center h-12 border-b border-gray-200">
            <div className="w-16 text-xs text-gray-500 tracking-wide">起床場所</div>
            <div className="flex-1 text-sm text-gray-800">
              {challenge.homeLocation.address}
            </div>
          </div>

          {/* 目覚時間 */}
          <div className="flex items-center h-12 border-b border-gray-200">
            <div className="w-16 text-xs text-gray-500 tracking-wide">目覚時間</div>
            <div className="flex-1 text-sm text-gray-800">
              {formatDate(challenge.wakeTime)}
            </div>
          </div>

          {/* 覚悟金額 */}
          <div className="flex items-center h-12 border-b border-gray-200">
            <div className="w-16 text-xs text-gray-500 tracking-wide">覚悟金額</div>
            <div className="flex-1 text-sm text-gray-800">
              ￥{challenge.penaltyAmount.toLocaleString()}
            </div>
          </div>

          {/* 支払方法 */}
          <div className="flex items-center h-12 border-b border-gray-200">
            <div className="w-16 text-xs text-gray-500 tracking-wide">支払方法</div>
            <div className="flex-1 flex items-center text-sm text-gray-800">
              {/* Visa icon */}
              <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
                <g fill="none" fillRule="nonzero">
                  <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
                  <path fill="#171E6C" d="M2.788 5.914A7.201 7.201 0 001 5.237l.028-.125h2.737c.371.013.672.125.77.519l.595 2.836.182.854 1.666-4.21h1.799l-2.674 6.167H4.304L2.788 5.914zm7.312 5.37H8.399l1.064-6.172h1.7L10.1 11.284zm6.167-6.021l-.232 1.333-.153-.066a3.054 3.054 0 00-1.268-.236c-.671 0-.972.269-.98.531 0 .29.365.48.96.762.98.44 1.435.979 1.428 1.681-.014 1.28-1.176 2.108-2.96 2.108-.764-.007-1.5-.158-1.898-.328l.238-1.386.224.099c.553.23.917.328 1.596.328.49 0 1.015-.19 1.022-.604 0-.27-.224-.466-.882-.769-.644-.295-1.505-.788-1.491-1.674C11.878 5.84 13.06 5 14.74 5c.658 0 1.19.138 1.526.263zm2.26 3.834h1.415c-.07-.308-.392-1.786-.392-1.786l-.12-.531c-.083.23-.23.604-.223.59l-.68 1.727zm2.1-3.985L22 11.284h-1.575s-.154-.71-.203-.926h-2.184l-.357.926h-1.785l2.527-5.66c.175-.4.483-.512.889-.512h1.316z"/>
                </g>
              </svg>
              {challenge.paymentMethod}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center h-12">
            <div className="w-16 text-xs text-gray-500 tracking-wide">状態</div>
            <div className="flex-1 text-sm">
              <span className={`px-2 py-1 rounded text-xs ${
                challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                challenge.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {challenge.status === 'pending' ? '待機中' :
                 challenge.status === 'active' ? '実行中' :
                 challenge.status === 'completed' ? '完了' : '失敗'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 