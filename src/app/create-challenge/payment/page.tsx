'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { getPaymentMethods, PaymentMethodsResponse } from '@/lib/stripe'

export default function PaymentSettingPage() {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsResponse | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/auth/signin')
          return
        }

        const methods = await getPaymentMethods(user.id)
        setPaymentMethods(methods)
        
        if (methods.paymentMethods.length > 0) {
          setSelectedMethodId(methods.paymentMethods[0].id)
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [router])

  const handleSave = () => {
    if (selectedMethodId) {
      router.push(`/create-challenge?paymentMethodId=${selectedMethodId}`)
    } else if (paymentMethods?.hasPaymentMethod) {
      router.push('/create-challenge')
    } else {
      // 支払い方法が未登録の場合は登録ページへ
      router.push('/onboarding/payment')
    }
  }

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <path fill="#171E6C" d="M2.788 5.914A7.201 7.201 0 001 5.237l.028-.125h2.737c.371.013.672.125.77.519l.595 2.836.182.854 1.666-4.21h1.799l-2.674 6.167H4.304L2.788 5.914zm7.312 5.37H8.399l1.064-6.172h1.7L10.1 11.284zm6.167-6.021l-.232 1.333-.153-.066a3.054 3.054 0 00-1.268-.236c-.671 0-.972.269-.98.531 0 .29.365.48.96.762.98.44 1.435.979 1.428 1.681-.014 1.28-1.176 2.108-2.96 2.108-.764-.007-1.5-.158-1.898-.328l.238-1.386.224.099c.553.23.917.328 1.596.328.49 0 1.015-.19 1.022-.604 0-.27-.224-.466-.882-.769-.644-.295-1.505-.788-1.491-1.674C11.878 5.84 13.06 5 14.74 5c.658 0 1.19.138 1.526.263zm2.26 3.834h1.415c-.07-.308-.392-1.786-.392-1.786l-.12-.531c-.083.23-.23.604-.223.59l-.68 1.727zm2.1-3.985L22 11.284h-1.575s-.154-.71-.203-.926h-2.184l-.357.926h-1.785l2.527-5.66c.175-.4.483-.512.889-.512h1.316z"/>
            </g>
          </svg>
        )
      case 'mastercard':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <circle cx="9" cy="8" r="4" fill="#EB001B"/>
              <circle cx="15" cy="8" r="4" fill="#F79E1B"/>
              <path fill="#FF5F00" d="M12 4.5c-.78 0-1.5.31-2.04.81A3.97 3.97 0 0 1 12 8c.78 0 1.5-.31 2.04-.81A3.97 3.97 0 0 0 12 4.5z"/>
            </g>
          </svg>
        )
      case 'jcb':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <text x="12" y="10" textAnchor="middle" fill="#007B3F" fontSize="8" fontFamily="Arial, sans-serif" fontWeight="bold">JCB</text>
            </g>
          </svg>
        )
      default:
        return (
          <div className="w-6 h-4 bg-gray-300 rounded mr-3 flex items-center justify-center">
            <span className="text-xs text-gray-600">💳</span>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
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
            <h1 className="ml-2 text-lg font-semibold text-gray-800">支払い方法設定</h1>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            決定
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                支払い方法について
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>チャレンジに失敗した場合に、設定した覚悟金額が自動的に決済されます。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 登録済み支払い方法 */}
        {paymentMethods?.hasPaymentMethod ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">登録済み支払い方法</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {paymentMethods.paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedMethodId === method.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {method.card && getCardBrandIcon(method.card.brand)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {method.card ? (
                          <>
                            {method.card.brand.toUpperCase()} •••• {method.card.last4}
                          </>
                        ) : (
                          '支払い方法'
                        )}
                      </div>
                      {method.card && (
                        <div className="text-sm text-gray-500">
                          有効期限: {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                        </div>
                      )}
                    </div>
                    {selectedMethodId === method.id && (
                      <div className="ml-2">
                        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 支払い方法未登録 */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-900">支払い方法未登録</h2>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  支払い方法を登録してください
                </h3>
                <p className="text-gray-600 mb-6">
                  チャレンジを作成するには、支払い方法の登録が必要です。
                </p>
                <button
                  onClick={() => router.push('/onboarding/payment')}
                  className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  支払い方法を追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* セキュリティ情報 */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                セキュリティについて
              </h3>
              <div className="mt-1 text-sm text-gray-600">
                <p>支払い情報はStripeにより暗号化されて安全に保存されます。カード情報は当社サーバーには保存されません。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}