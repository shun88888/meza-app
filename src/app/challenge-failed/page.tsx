'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ChallengeFailedPage() {
  const [mounted, setMounted] = useState(false)
  const [challengeData, setChallengeData] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    
    // Get challenge data from URL params or localStorage
    const amount = searchParams.get('amount')
    const reason = searchParams.get('reason')
    
    if (amount) {
      setChallengeData({
        penaltyAmount: parseInt(amount),
        reason: reason || '起床時間を過ぎました'
      })
    } else {
      // Try to get from localStorage
      const storedData = localStorage.getItem('failedChallengeData')
      if (storedData) {
        try {
          setChallengeData(JSON.parse(storedData))
          localStorage.removeItem('failedChallengeData')
        } catch (error) {
          console.error('Error parsing stored challenge data:', error)
        }
      }
    }
  }, [searchParams])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleViewHistory = () => {
    router.push('/history')
  }

  const handleManualPayment = () => {
    // リクエスト: 手動で完了ボタンでホームへ戻る
    router.push('/')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-black text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Failed Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" className="text-white">
              <path 
                fill="currentColor" 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">チャレンジ失敗</h1>
          <p className="text-gray-600">
            {challengeData?.reason || '起床時間を過ぎました'}
          </p>
        </div>

        {/* Penalty Amount */}
        {challengeData?.penaltyAmount && (
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">ペナルティ金額</p>
              <div className="text-4xl font-bold text-red-500 mb-2">
                ¥{challengeData.penaltyAmount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">自動決済完了</p>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              次回はがんばりましょう！
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              チャレンジは失敗しましたが、また新しいチャレンジに挑戦することができます。
              失敗から学んで、次回はより良い結果を目指しましょう。
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {challengeData?.needsManualPayment && (
            <button
              onClick={handleManualPayment}
              className="w-full h-14 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-3xl transition-all duration-200"
            >
              ホームに戻る
            </button>
          )}
          
          <button
            onClick={handleGoHome}
            className="w-full h-14 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-lg rounded-3xl transition-all duration-200"
          >
            新しいチャレンジを作成
          </button>
          
          <button
            onClick={handleViewHistory}
            className="w-full h-14 text-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white shadow-lg rounded-3xl transition-all duration-200"
          >
            履歴を確認
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">💡 成功のコツ</h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• 前日の夜は早めに就寝しましょう</li>
            <li>• スマホは手の届かない場所に置きましょう</li>
            <li>• 目覚まし時間を少し早めに設定してみましょう</li>
          </ul>
        </div>
      </div>
    </div>
  )
}