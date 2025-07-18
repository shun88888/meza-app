'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  last4: string
  brand: string
  isDefault: boolean
  expiryMonth?: number
  expiryYear?: number
}

export default function PaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    // Mock payment methods data
    setPaymentMethods([
      {
        id: 'pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        isDefault: true,
        expiryMonth: 12,
        expiryYear: 2025
      },
      {
        id: 'pm_2',
        type: 'card',
        last4: '5555',
        brand: 'mastercard',
        isDefault: false,
        expiryMonth: 8,
        expiryYear: 2026
      }
    ])
    setLoading(false)
  }, [])

  const handleAddPaymentMethod = () => {
    setShowAddForm(true)
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPaymentMethods(prev => 
        prev.map(pm => ({
          ...pm,
          isDefault: pm.id === paymentMethodId
        }))
      )
      
      alert('デフォルトの決済方法を更新しました')
    } catch (error) {
      console.error('Failed to set default payment method:', error)
      alert('デフォルトの決済方法の更新に失敗しました')
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('この決済方法を削除しますか？')) return
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
      alert('決済方法を削除しました')
    } catch (error) {
      console.error('Failed to delete payment method:', error)
      alert('決済方法の削除に失敗しました')
    }
  }

  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      default:
        return '💳'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">決済設定</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Payment Methods List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">登録済み決済方法</h2>
            <p className="text-sm text-gray-500 mt-1">チャレンジ失敗時のペナルティ決済に使用されます</p>
          </div>
          
          {paymentMethods.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-gray-600 mb-4">登録済みの決済方法がありません</p>
              <Button
                onClick={handleAddPaymentMethod}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                決済方法を追加
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getBrandIcon(paymentMethod.brand)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">
                            {paymentMethod.brand.toUpperCase()} •••• {paymentMethod.last4}
                          </span>
                          {paymentMethod.isDefault && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              デフォルト
                            </span>
                          )}
                        </div>
                        {paymentMethod.expiryMonth && paymentMethod.expiryYear && (
                          <p className="text-sm text-gray-500">
                            有効期限: {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!paymentMethod.isDefault && (
                        <Button
                          onClick={() => handleSetDefault(paymentMethod.id)}
                          variant="outline"
                          size="sm"
                        >
                          デフォルトに設定
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Payment Method */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Button
              onClick={handleAddPaymentMethod}
              variant="outline"
              className="w-full border-dashed border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              決済方法を追加
            </Button>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">決済履歴</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <p>決済履歴はありません</p>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">🔒</div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">セキュリティについて</h3>
              <p className="text-sm text-blue-700">
                決済情報はStripeによって安全に暗号化され、保存されます。
                当社は決済情報に直接アクセスすることはありません。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">決済方法を追加</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                この機能は実装中です。実際のアプリでは、Stripeの決済方法追加フォームが表示されます。
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    alert('決済方法の追加機能は実装中です')
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                >
                  追加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 