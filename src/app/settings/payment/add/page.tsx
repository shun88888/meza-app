'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft } from 'lucide-react'
import StripeCardForm from '@/components/StripeCardForm'

export default function AddPaymentMethodPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
    // カード登録成功時の処理
    console.log('Card registered:', cardData)
    router.push('/settings/payment')
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
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <StripeCardForm
            onSuccess={handleSuccess}
            onCancel={handleBack}
          />
        </div>
      </div>
    </div>
  )
}