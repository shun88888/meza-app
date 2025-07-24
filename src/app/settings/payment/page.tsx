'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft, CreditCard, Plus, Trash2 } from 'lucide-react'

interface PaymentMethod {
  id: string
  type: 'visa' | 'mastercard' | 'jcb' | 'amex'
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export default function PaymentMethodPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2027,
      isDefault: true
    },
    {
      id: '2',
      type: 'mastercard',
      last4: '5555',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ])
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'jcb':
        return '💳'
      case 'amex':
        return '💳'
      default:
        return '💳'
    }
  }

  const getCardName = (type: string) => {
    switch (type) {
      case 'visa':
        return 'Visa'
      case 'mastercard':
        return 'Mastercard'
      case 'jcb':
        return 'JCB'
      case 'amex':
        return 'American Express'
      default:
        return 'クレジットカード'
    }
  }

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    )
  }

  const handleRemove = (id: string) => {
    if (confirm('このカードを削除しますか？')) {
      setPaymentMethods(prev => prev.filter(method => method.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownLeft size={20} className="text-gray-600 dark:text-gray-400 rotate-45" />
            </button>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">決済方法</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* Add Payment Method */}
          <div className="mb-4">
            <button className="w-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">新しいカードを追加</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">クレジットカード・デビットカード</p>
                </div>
              </div>
            </button>
          </div>

          {/* Payment Methods */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">登録済みカード</h2>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <CreditCard size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {getCardName(method.type)} •••• {method.last4}
                        {method.isDefault && (
                          <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs rounded">
                            デフォルト
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        有効期限: {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        デフォルトに設定
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(method.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">決済について</h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• チャレンジに失敗した場合のみ、設定したペナルティ金額が決済されます</p>
              <p>• 成功し続ける限り、費用は発生しません</p>
              <p>• 決済情報はStripeを通じて安全に処理されます</p>
              <p>• カード情報は暗号化されて保存されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}