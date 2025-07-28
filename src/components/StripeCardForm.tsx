'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCardFormProps {
  onSuccess?: (paymentMethod: any) => void
  onCancel?: () => void
}

function CardForm({ onSuccess, onCancel }: StripeCardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [cardholderName, setCardholderName] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!cardholderName.trim()) {
      setError('カード名義人を入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('カード情報が入力されていません')
      setIsLoading(false)
      return
    }

    try {
      // PaymentMethodを作成
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'カード情報の処理に失敗しました')
        setIsLoading(false)
        return
      }

      // バックエンドにPaymentMethodを保存
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          cardholder_name: cardholderName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'カード登録に失敗しました')
      }

      const result = await response.json()
      onSuccess?.(result.paymentMethod)

    } catch (error: any) {
      console.error('Card registration error:', error)
      setError(error.message || 'カード登録に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: true,
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] rounded-full flex items-center justify-center">
            <CreditCard size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              新しいカードを追加
            </h2>
            <p className="text-gray-600 text-sm">
              安全にカード情報を登録してください
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* カード名義人 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード名義人
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="YAMADA TARO"
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent"
            required
          />
        </div>

        {/* カード情報 (Stripe Elements) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード情報
          </label>
          <div className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:ring-[#FFAD2F] focus-within:border-transparent">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-colors ${
              !stripe || isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] hover:from-[#FF8A00] hover:to-[#FFAD2F] text-gray-900'
            }`}
          >
            {isLoading ? '登録中...' : 'カードを登録'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* セキュリティ情報 */}
      <div className="mt-6 p-4 bg-[#FFF9E6] rounded-2xl border border-[#FFE72E]/30">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">🔒 セキュリティについて</h3>
        <div className="space-y-1 text-xs text-gray-700">
          <p>• カード情報はStripeが安全に処理します</p>
          <p>• カード番号はアプリサーバーに送信されません</p>
          <p>• PCI DSS準拠の最高レベルのセキュリティ</p>
          <p>• チャレンジ失敗時のみ決済が実行されます</p>
        </div>
      </div>
    </div>
  )
}

export default function StripeCardForm({ onSuccess, onCancel }: StripeCardFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}