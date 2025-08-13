'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StripeCardForm from '@/components/StripeCardForm'
import { PaymentMethodInfo } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/supabase'

export default function OnboardingPaymentPage() {
  const router = useRouter()
  const [isSkipped, setIsSkipped] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      const user = await getCurrentUser()
      if (user) setUserId(user.id)
    }
    fetchUserId()
  }, [])

  const handleRegistrationSuccess = async (paymentMethod: PaymentMethodInfo) => {
    if (!userId) return
    // Registration successful, proceed to complete
    router.push('/onboarding/complete')
  }

  const handleRegistrationError = (error: string) => {
    console.error('Payment registration error:', error)
    // Handle error (show toast, etc.)
  }

  const handleSkip = () => {
    setIsSkipped(true)
    // In real app, mark onboarding as partially complete
    router.push('/onboarding/complete')
  }

  const handleGoBack = () => {
    router.push('/onboarding/profile')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">決済方法設定</h1>
          <p className="text-gray-700">
            チャレンジ失敗時の自動決済用<br />
            クレジットカードを登録します
          </p>
          
          {/* Progress */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs mr-2">✓</span>
              <span className="mr-2">プロフィール</span>
              <span className="text-gray-400">→</span>
              <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold ml-2 mr-2">2</span>
              <span className="mr-2">決済設定</span>
              <span className="text-gray-400">→</span>
              <span className="ml-2">完了</span>
            </div>
          </div>
        </div>

        {/* Why This Step */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">💡 なぜ決済方法が必要？</h2>
          <ul className="text-gray-700 text-sm space-y-1">
            <li>• チャレンジ失敗時に自動でペナルティ料金を徴収</li>
            <li>• 成功した場合は一切料金は発生しません</li>
            <li>• 事前登録により確実な責任感を醸成</li>
            <li>• セキュアな暗号化で安全に管理</li>
          </ul>
        </div>

        {/* Card Registration Component (unified with settings/add) */}
        <div className="bg-white rounded-2xl p-4">
          <StripeCardForm onSuccess={handleRegistrationSuccess} onCancel={handleGoBack} />
        </div>

        {/* Skip Option */}
        <div className="mt-6 text-center">
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-sm">
              ⚠️ 決済方法を登録せずにスキップすることも可能ですが、チャレンジ開始前に設定が必要になります。
            </p>
          </div>
          
          <button
            onClick={handleSkip}
            className="text-gray-700 hover:text-gray-900 text-sm underline"
          >
            決済設定をスキップ
          </button>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleGoBack}
            className="text-gray-700 hover:text-gray-900 text-sm"
          >
            ← プロフィール設定に戻る
          </button>
          
          <div className="text-gray-400 text-xs">
            ステップ 2/3
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-gray-900 font-medium">セキュリティ</h3>
          </div>
          <ul className="text-gray-700 text-xs space-y-1">
            <li>• カード情報はStripeで暗号化保存</li>
            <li>• 弊社サーバーにカード番号は保存されません</li>
            <li>• PCI DSS準拠の最高水準セキュリティ</li>
          </ul>
        </div>
      </div>
    </div>
  )
}