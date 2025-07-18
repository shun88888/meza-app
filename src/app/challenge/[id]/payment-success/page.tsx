'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          決済が完了しました
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          ペナルティ料金の支払いが正常に処理されました。<br />
          チャレンジは失敗となりましたが、次回はがんばりましょう！
        </p>

        {/* Challenge ID */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">チャレンジID</p>
          <p className="font-mono text-gray-800">{params.id}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
          
          <button
            onClick={() => router.push('/history')}
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            履歴を見る
          </button>
        </div>

        {/* Auto redirect notice */}
        <p className="text-xs text-gray-400 mt-6">
          3秒後に自動的にホームページに戻ります
        </p>
      </div>
    </div>
  )
}