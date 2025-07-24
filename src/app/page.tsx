'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStart = () => {
    router.push('/create-challenge')
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-black dark:text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Meza
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              位置ベースペナルティアラーム
            </p>
          </div>

          {/* Simple time display */}
          <div className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-3xl p-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                {new Date().toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                現在の時刻
              </div>
            </div>
          </div>

          {/* Start button */}
          <div className="text-center">
            <button
              onClick={handleStart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
            >
              チャレンジを開始
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                🎯 確実な起床
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                指定時刻に指定場所に移動しないとペナルティが発生
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💰 自動決済
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                失敗時のみペナルティ料金が発生します
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                📍 位置確認
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GPSで正確な位置を確認し、二度寝を防止
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 