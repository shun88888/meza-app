'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft, Shield, Lock, CheckCircle } from 'lucide-react'
import StripeCardForm from '@/components/StripeCardForm'

export default function AddPaymentMethodPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleSuccess = (cardData: any) => {
    console.log('Card registered:', cardData)
    setShowSuccess(true)
    
    setTimeout(() => {
      router.push('/settings/payment')
    }, 2000)
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            カード登録完了
          </h2>
          <p className="text-gray-600 mb-4">
            カードが正常に登録されました。決済設定画面に戻ります。
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>リダイレクト中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="戻る"
              title="戻る"
            >
              <ArrowDownLeft size={20} className="text-gray-600 rotate-45" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">新しいカードを追加</h1>
            <div className="w-8" />
          </div>
        </div>


        {/* Content */}
        <div className="p-4">
          <StripeCardForm
            onSuccess={handleSuccess}
            onCancel={handleBack}
          />
        </div>

        {/* Footer Info */}
        <div className="px-4 pb-6 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>登録されたカードはいつでも削除可能です</p>
            <p>決済は実際にチャレンジで失敗した時のみ実行されます</p>
          </div>
        </div>
      </div>
    </div>
  )
}