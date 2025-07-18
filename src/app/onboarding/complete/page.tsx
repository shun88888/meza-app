'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<any>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Load profile data from localStorage
    const savedProfile = localStorage.getItem('onboardingProfile')
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile))
    }

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleStartChallenge = () => {
    router.push('/create-challenge')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleTutorial = () => {
    router.push('/welcome/tutorial')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Animation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFAD2F] rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🎉</span>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          設定完了！
        </h1>
        <p className="text-gray-600 mb-8">
          初期設定が完了しました。<br />
          これで起床チャレンジを始める準備ができました！
        </p>

        {/* Setup Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-green-900 mb-3">✅ 完了した設定</h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center text-green-800 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              アカウント作成・認証
            </div>
            <div className="flex items-center text-green-800 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              プロフィール設定
              {profileData && (
                <span className="ml-2 text-xs bg-green-200 px-2 py-0.5 rounded">
                  {profileData.displayName}
                </span>
              )}
            </div>
            <div className="flex items-center text-green-800 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              決済方法設定
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {profileData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">📊 あなたの設定</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-600 font-medium">目標</div>
                <div className="text-blue-800 capitalize">{profileData.goal}</div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">起床時間</div>
                <div className="text-blue-800">{profileData.wakeUpTime}</div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">次のステップ</h2>
          
          <button
            onClick={handleStartChallenge}
            className="w-full bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🏆 初回チャレンジを作成
          </button>
          
          <button
            onClick={handleTutorial}
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            📚 使い方チュートリアル
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
          >
            ホーム画面を見る
          </button>
        </div>

        {/* Auto redirect */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            {countdown}秒後に自動的にホーム画面に移動します
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className="bg-[#FFAD2F] h-1 rounded-full transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-xs">
            ご不明な点がございましたら
            <Link href="/help" className="text-[#FFAD2F] hover:underline ml-1">
              ヘルプセンター
            </Link>
            をご確認ください
          </p>
        </div>
      </div>
    </div>
  )
}