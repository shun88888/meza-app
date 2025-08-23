'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard, AlertTriangle } from 'lucide-react'

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// Trusted Types policy for secure string handling
const createTrustedPolicy = () => {
  if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      return window.trustedTypes.createPolicy('stripe-policy', {
        createHTML: (string: string) => string,
        createScript: (string: string) => string,
        createScriptURL: (string: string) => string,
      })
    } catch (e) {
      console.warn('Trusted Types policy creation failed:', e)
      return null
    }
  }
  return null
}

const trustedPolicy = createTrustedPolicy()

// Secure stripe promise with validation
const stripePromise = pk && pk.startsWith('pk_') ? loadStripe(pk) : Promise.resolve(null)

interface StripeCardFormProps {
  onSuccess?: (paymentMethod: any) => void
  onCancel?: () => void
}

interface CardFormProps extends StripeCardFormProps {
  clientSecret: string
}

function CardForm({ onSuccess, onCancel, clientSecret }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [cardholderName, setCardholderName] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isCardholderValid, setIsCardholderValid] = useState(false)

  // Validate cardholder name with enhanced security checks
  const validateCardholderName = useCallback((name: string) => {
    // Basic validation
    if (!name.trim()) return false
    
    // Security checks - prevent potential XSS or injection attempts
    const suspiciousPatterns = [
      /<[^>]*>/g, // HTML tags
      /javascript:/i, // JS protocol
      /on\w+\s*=/i, // Event handlers
      /\bscript\b/i, // Script tag
      /[<>'"&]/g, // Potentially dangerous characters
    ]
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(name))
    if (hasSuspiciousContent) {
      console.warn('Suspicious content detected in cardholder name')
      return false
    }
    
    // Length and character validation
    return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s\-'\.]*$/.test(name)
  }, [])

  useEffect(() => {
    setIsCardholderValid(validateCardholderName(cardholderName))
  }, [cardholderName, validateCardholderName])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Stripeキーが未設定のため、カード登録ができません')
      return
    }

    if (!isCardholderValid) {
      setError('有効なカード名義人を入力してください（2-100文字、英字・スペース・ハイフンのみ）')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create payment method with individual card elements
      const cardElement = elements.getElement(CardNumberElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
          email: 'user@example.com',
          address: {
            country: 'JP',
          },
        },
      })

      if (paymentMethodError) {
        throw paymentMethodError
      }

      // Attach payment method to customer via setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      )

      if (confirmError) {
        // Enhanced error handling with retry logic
        const isRetryableError = confirmError.code === 'card_declined' || 
                                confirmError.code === 'incomplete_card' ||
                                confirmError.code === 'processing_error'
        
        if (isRetryableError && retryCount < 2) {
          setRetryCount(prev => prev + 1)
          setError(`${confirmError.message} (${retryCount + 1}/3回目の試行)`)
        } else {
          setError(confirmError.message || 'カード認証に失敗しました')
        }
        setIsLoading(false)
        return
      }

      // Success - payment method is now attached to customer via SetupIntent
      onSuccess?.(setupIntent.payment_method)

    } catch (error: any) {
      console.error('Card registration error:', error)
      
      // Enhanced error classification
      let userMessage = 'カード登録に失敗しました。もう一度お試しください。'
      
      if (error.code === 'network_error') {
        userMessage = 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
      } else if (error.code === 'api_key_expired') {
        userMessage = 'システムエラーが発生しました。管理者にお問い合わせください。'
      } else if (error.message?.includes('rate_limit')) {
        userMessage = 'しばらく時間をおいてから再度お試しください。'
      }
      
      setError(userMessage)
    } finally {
      setIsLoading(false)
    }
  }


  // Common element options matching mezamee's styling
  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-6">クレジットカード</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Card Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            カード番号
          </label>
          <div className="flex items-center bg-white border border-gray-300 rounded-md p-3 shadow-sm">
            <CreditCard className="w-6 h-6 text-gray-400 mr-3" />
            <div className="flex-1">
              <CardNumberElement 
                options={{
                  ...elementOptions,
                  placeholder: '1234 1234 1234 1234'
                }}
              />
            </div>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            有効期限
          </label>
          <div className="bg-white border border-gray-300 rounded-md p-3 shadow-sm">
            <CardExpiryElement
              options={{
                ...elementOptions,
                placeholder: '月 / 年'
              }}
            />
          </div>
        </div>

        {/* CVC */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            CVC
          </label>
          <div className="bg-white border border-gray-300 rounded-md p-3 shadow-sm">
            <CardCvcElement
              options={{
                ...elementOptions,
                placeholder: 'セキュリティコード'
              }}
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            カード名義人
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="YAMADA TARO"
              className={`w-full px-3 py-3 border rounded-md shadow-sm focus:ring-2 focus:border-transparent transition-colors ${
                cardholderName && !isCardholderValid
                  ? 'border-red-300 focus:ring-red-200'
                  : cardholderName && isCardholderValid
                  ? 'border-green-300 focus:ring-green-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
              required
              maxLength={100}
              autoComplete="cc-name"
            />
            {cardholderName && !isCardholderValid && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            )}
          </div>
          {cardholderName && !isCardholderValid && (
            <p className="text-xs text-red-600 mt-1">
              英字・スペース・ハイフンのみ使用可能です（2-100文字）
            </p>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Register Button - Centered like mezamee */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!stripe || isLoading || !isCardholderValid}
            className={`px-8 py-3 rounded-full font-medium shadow-lg transition-colors ${
              !stripe || isLoading || !isCardholderValid
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-400 hover:bg-orange-500 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>登録中...</span>
              </div>
            ) : '登録する'}
          </button>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default function StripeCardForm({ onSuccess, onCancel }: StripeCardFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize SetupIntent when component mounts
  const initializeSetup = async () => {
    try {
      const response = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const { clientSecret } = await response.json()
        setClientSecret(clientSecret)
      }
    } catch (error) {
      console.error('Failed to initialize payment setup:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    initializeSetup()
  }, [])

  if (isInitializing || !clientSecret) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">決済フォームを準備中...</p>
      </div>
    )
  }

  const options = {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '16px',
      }
    },
  }

  // Pass clientSecret through props to CardForm component
  return (
    <Elements 
      stripe={stripePromise} 
      options={options}
    >
      <CardForm 
        onSuccess={onSuccess} 
        onCancel={onCancel}
        clientSecret={clientSecret}
      />
    </Elements>
  )
}