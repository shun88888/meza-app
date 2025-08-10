'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { getPaymentMethods, PaymentMethodInfo } from '@/lib/stripe'
import { ArrowDownLeft, CreditCard, Plus, Trash2 } from 'lucide-react'

// Remove custom interface, use the one from stripe lib

export default function PaymentMethodPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([])
  const router = useRouter()

  const loadPaymentMethods = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        // 新しいAPIエンドポイントを使用
        try {
          const response = await fetch('/api/payment-methods')
          if (response.ok) {
            const data = await response.json()
            setPaymentMethods(data.paymentMethods)
          } else {
            // フォールバック: 既存のAPIを使用
            const methods = await getPaymentMethods(currentUser.id)
            setPaymentMethods(methods.paymentMethods)
          }
        } catch {
          // フォールバック: 既存のAPIを使用
          const methods = await getPaymentMethods(currentUser.id)
          setPaymentMethods(methods.paymentMethods)
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  // ページがフォーカスされたときにデータを再読み込み
  useEffect(() => {
    const handleFocus = () => {
      loadPaymentMethods()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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

  const getCardName = (brand: string) => {
    switch (brand?.toLowerCase()) {
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

  const handleSetDefault = async (id: string) => {
    try {
      const resp = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id, setAsDefault: true })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to set default')
      }
      alert('デフォルトカードを更新しました')
      loadPaymentMethods()
    } catch (e: any) {
      console.error('Set default error:', e)
      alert(e?.message || 'デフォルトカードの更新に失敗しました')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('このカードを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/payment-methods?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert('カードを削除しました')
        // データを再読み込み
        loadPaymentMethods()
      } else {
        const error = await response.json()
        alert(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('Payment method deletion error:', error)
      alert('カードの削除に失敗しました')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="戻る"
              title="戻る"
            >
              <ArrowDownLeft size={20} className="text-gray-600 rotate-45" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">決済方法</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* Add Payment Method */}
          <div className="mb-4">
            <button 
              onClick={() => router.push('/settings/payment/add')}
              className="w-full flex items-center justify-center p-4 bg-[#FFF9E6] hover:bg-[#FFE72E]/20 rounded-2xl transition-colors border border-[#FFE72E]/30"
              aria-label="新しいカードを追加"
              title="新しいカードを追加"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-gray-800" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">新しいカードを追加</p>
                  <p className="text-xs text-gray-700">クレジットカード・デビットカード</p>
                </div>
              </div>
            </button>
          </div>

          {/* Payment Methods */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">登録済みカード</h2>
            </div>
            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">登録済みのカードがありません</p>
                  <p className="text-sm text-gray-400 mt-1">上のボタンから新しいカードを追加してください</p>
                </div>
              ) : (
                paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                      <CreditCard size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {getCardName(method.card?.brand || '')} •••• {method.card?.last4}
                        {method.id && (
                          <span className="ml-2 inline-flex items-center text-xs text-gray-500">
                            {/* best-effort default indicator: first item considered default when API lacks flag */}
                            {paymentMethods[0]?.id === method.id ? '（デフォルト）' : ''}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        有効期限: {method.card?.exp_month?.toString().padStart(2, '0')}/{method.card?.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-xs text-[#FFAD2F] hover:text-[#FF8A00] font-medium"
                      aria-label="デフォルトに設定"
                      title="デフォルトに設定"
                    >
                      デフォルトに設定
                    </button>
                    <button
                      onClick={() => handleRemove(method.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      aria-label="カードを削除"
                      title="カードを削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>


          {/* Payment Info */}
          <div className="bg-[#FFF9E6] rounded-2xl p-4 border border-[#FFE72E]/30">
            <h3 className="font-semibold text-gray-900 mb-2">決済について</h3>
            <div className="space-y-2 text-sm text-gray-700">
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