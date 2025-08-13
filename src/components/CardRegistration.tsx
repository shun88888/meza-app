'use client'

import { useState, useEffect } from 'react'
import { loadStripe, PaymentMethodResult } from '@stripe/stripe-js'
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { getPaymentMethods, PaymentMethodInfo } from '@/lib/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CardRegistrationProps {
  userId: string
  onSuccess?: (paymentMethod: PaymentMethodInfo) => void
  onError?: (error: string) => void
  onCancel?: () => void
  isRequired?: boolean
}

function CardRegistrationForm({ 
  userId, 
  onSuccess, 
  onError, 
  onCancel,
  isRequired = false,
  existingPaymentMethods = []
}: CardRegistrationProps & { existingPaymentMethods: PaymentMethodInfo[] }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      setError('Stripe初期化中です。しばらくお待ちください。')
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      setError('カード情報を入力してください。')
      return
    }

    setIsLoading(true)
    setError(null)
    setProcessingStep('カード情報を検証しています...')

    try {
      // Create payment method
      const { paymentMethod, error: pmError }: PaymentMethodResult = await stripe.createPaymentMethod({
        type: 'card',
        card,
      })

      if (pmError) {
        setError(pmError.message || 'カード情報の検証に失敗しました')
        setIsLoading(false)
        setProcessingStep('')
        return
      }

      if (!paymentMethod) {
        setError('カード情報の作成に失敗しました')
        setIsLoading(false)
        setProcessingStep('')
        return
      }

      setProcessingStep('ユーザープロファイルを確認しています...')

      // Setup payment method
      console.log('Setting up payment method for user:', userId)
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          cardholder_name: undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Payment method setup failed:', {
          status: response.status,
          statusText: response.statusText,
          result
        })
        
        // Handle authentication errors
        if (response.status === 401) {
          setError('認証エラーが発生しました。ログインし直してください。')
          setIsLoading(false)
          setProcessingStep('')
          return
        }

        // Handle permission errors
        if (response.status === 403) {
          setError('アクセス権限がありません。')
          setIsLoading(false)
          setProcessingStep('')
          return
        }

        // Show more detailed error information
        const errorMessage = result.error || 'カード登録に失敗しました'
        const details = result.details ? ` (詳細: ${result.details})` : ''
        throw new Error(errorMessage + details)
      }

      // Success
      setProcessingStep('カード登録が完了しました!')
      const newPaymentMethod: PaymentMethodInfo = {
        id: result.paymentMethod.id,
        type: result.paymentMethod.type,
        card: result.paymentMethod.card
      }

      onSuccess?.(newPaymentMethod)

    } catch (error) {
      console.error('Card registration error:', error)
      const errorMessage = (error as Error).message
      
      // Provide user-friendly error messages
      if (errorMessage.includes('認証')) {
        setError('認証エラーが発生しました。ログインし直してください。')
      } else if (errorMessage.includes('アクセス権限')) {
        setError('アクセス権限がありません。')
      } else if (errorMessage.includes('Stripe')) {
        setError('決済サービスとの連携に失敗しました。しばらくしてからお試しください。')
      } else {
        setError(errorMessage)
      }
      
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      setProcessingStep('')
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {existingPaymentMethods.length > 0 ? 'カード情報を追加' : 'カード情報を登録'}
        </h2>
        <p className="text-gray-600">
          {isRequired 
            ? 'チャレンジを開始するには、カード情報の登録が必要です。'
            : 'チャレンジ失敗時の自動決済のため、カード情報を登録してください。'
          }
        </p>
      </div>

      {/* Existing payment methods */}
      {existingPaymentMethods.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">登録済みカード</h3>
          <div className="space-y-2">
            {existingPaymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {pm.card?.brand}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      •••• •••• •••• {pm.card?.last4}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {pm.card?.exp_month}/{pm.card?.exp_year}
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  登録済み
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>

        {/* Processing step indicator */}
        {processingStep && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {processingStep}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white'
            }`}
          >
            {isLoading ? '処理中...' : 'カードを登録'}
          </button>

          {!isRequired && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>🔒 カード情報はStripeによって安全に暗号化されます</p>
        <p>カード番号は弊社のサーバーには保存されません</p>
      </div>
    </div>
  )
}

export default function CardRegistration(props: CardRegistrationProps) {
  const [existingPaymentMethods, setExistingPaymentMethods] = useState<PaymentMethodInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExistingPaymentMethods = async () => {
      try {
        const response = await getPaymentMethods(props.userId)
        setExistingPaymentMethods(response.paymentMethods)
      } catch (error) {
        console.error('Failed to load existing payment methods:', error)
        setError('既存のカード情報の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadExistingPaymentMethods()
  }, [props.userId])

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CardRegistrationForm {...props} existingPaymentMethods={existingPaymentMethods} />
    </Elements>
  )
}