'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'

interface Challenge {
  id: string
  wakeTime: string
  penaltyAmount: number
  status: 'pending' | 'active' | 'completed' | 'failed'
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id'

  useEffect(() => {
    // Mock challenge data - in real app, fetch from Supabase
    const mockChallenge: Challenge = {
      id: params.id as string,
      wakeTime: '2025-07-02T08:00:00',
      penaltyAmount: 300,
      status: 'failed'
    }
    
    setChallenge(mockChallenge)
    setLoading(false)
  }, [params.id])

  const handlePaymentSuccess = () => {
    // Payment success is handled by the PaymentForm component
    // which will redirect to payment-success page
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // You could show a toast or modal here
  }

  const handleCancel = () => {
    router.back()
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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            チャレンジが見つかりません
          </h2>
          <button
            onClick={() => router.push('/')}
            className="bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white font-semibold py-2 px-4 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
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
          <h1 className="ml-2 text-lg font-semibold text-gray-800">ペナルティ支払い</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8">
        {/* Challenge Failed Notice */}
        <div className="max-w-md mx-auto mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-800">チャレンジ失敗</h2>
          </div>
          <p className="text-red-700 mb-4">
            起床チャレンジに失敗しました。事前に設定されたペナルティ料金をお支払いください。
          </p>
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-600 mb-1">設定時刻</p>
            <p className="font-medium text-gray-900">
              {new Date(challenge.wakeTime).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <PaymentForm
          challengeId={challenge.id}
          userId={userId}
          amount={challenge.penaltyAmount}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onCancel={handleCancel}
        />

        {/* Help Text */}
        <div className="max-w-md mx-auto mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 ヒント</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 決済はStripeによって安全に処理されます</li>
            <li>• カード情報は暗号化され保存されません</li>
            <li>• 領収書はメールで送信されます</li>
          </ul>
        </div>
      </div>
    </div>
  )
}