'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPayment } from '@/lib/stripe'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface PaymentFormProps {
  challengeId: string
  userId: string
  amount: number
  onPaymentSuccess?: () => void
  onPaymentError?: (error: string) => void
  onCancel?: () => void
}

interface CheckoutFormProps extends PaymentFormProps {
  clientSecret?: string
}

function CheckoutForm({ 
  challengeId, 
  userId, 
  amount, 
  clientSecret,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('カード情報が入力されていません')
      }

      let currentClientSecret = clientSecret
      let currentPaymentIntentId = paymentIntentId

      // Create payment intent if not provided
      if (!currentClientSecret) {
        const paymentIntent = await createPaymentIntent(amount, challengeId, userId)
        currentClientSecret = paymentIntent.clientSecret
        currentPaymentIntentId = paymentIntent.paymentIntentId
        setPaymentIntentId(currentPaymentIntentId)
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        currentClientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message || '決済に失敗しました')
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on server
        const confirmation = await confirmPayment(paymentIntent.id)
        
        if (confirmation.success) {
          onPaymentSuccess?.()
          router.push(`/challenge/${challengeId}/payment-success`)
        } else {
          throw new Error(confirmation.message || '決済確認に失敗しました')
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      onPaymentError?.(errorMessage)
    } finally {
      setIsLoading(false)
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
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
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
        <h2 className="text-xl font-semibold text-gray-800 mb-2">決済情報</h2>
        <p className="text-gray-600">
          チャレンジ失敗のため、ペナルティ料金をお支払いください。
        </p>
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-800 font-medium">
            支払金額: ¥{amount.toLocaleString()}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>

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
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isLoading ? '処理中...' : `¥${amount.toLocaleString()}を支払う`}
          </button>

          {onCancel && (
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
        <p>🔒 この決済はStripeによって安全に処理されます</p>
        <p>カード情報は暗号化され、弊社のサーバーには保存されません</p>
      </div>
    </div>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Pre-create payment intent for better UX
    const initializePayment = async () => {
      try {
        const paymentIntent = await createPaymentIntent(
          props.amount,
          props.challengeId,
          props.userId
        )
        setClientSecret(paymentIntent.clientSecret)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初期化に失敗しました'
        setError(errorMessage)
        props.onPaymentError?.(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [props.amount, props.challengeId, props.userId, props.onPaymentError])

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">決済を準備中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            決済の準備に失敗しました
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {props.onCancel && (
            <button
              onClick={props.onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              戻る
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} clientSecret={clientSecret ?? undefined} />
    </Elements>
  )
}