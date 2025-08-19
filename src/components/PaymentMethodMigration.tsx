'use client'

import { useState, useEffect } from 'react'
import { CreditCard, AlertTriangle, X } from 'lucide-react'
import StripeCardForm from './StripeCardForm'

interface LegacyPaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
}

interface PaymentMethodMigrationProps {
  userId?: string
}

export default function PaymentMethodMigration({ userId }: PaymentMethodMigrationProps) {
  const [legacyMethods, setLegacyMethods] = useState<LegacyPaymentMethod[]>([])
  const [showMigration, setShowMigration] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkForLegacyMethods()
  }, [])

  const checkForLegacyMethods = async () => {
    try {
      // Get all payment methods from Supabase
      const supabaseResponse = await fetch('/api/payment-methods', {
        method: 'GET'
      })
      
      // Get Stripe payment methods
      const stripeResponse = await fetch('/api/payment/methods', {
        method: 'GET'
      })

      if (supabaseResponse.ok && stripeResponse.ok) {
        const supabaseData = await supabaseResponse.json()
        const stripeData = await stripeResponse.json()

        // Find methods that exist in Supabase but not in Stripe
        const supabaseMethods = supabaseData.paymentMethods || []
        const stripePmIds = new Set(stripeData.paymentMethods?.map((pm: any) => pm.id) || [])

        const legacyMethods = supabaseMethods.filter((pm: any) => 
          !pm.stripe_payment_method_id || !stripePmIds.has(pm.stripe_payment_method_id)
        )

        if (legacyMethods.length > 0) {
          setLegacyMethods(legacyMethods)
          setShowMigration(true)
        }
      }
    } catch (error) {
      console.error('Failed to check for legacy payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowMigration(false)
    // Store dismissal in localStorage to avoid showing repeatedly
    localStorage.setItem('paymentMigrationDismissed', 'true')
  }

  const handleMigrateSuccess = () => {
    setShowCardForm(false)
    setShowMigration(false)
    // Optionally refresh the page or update parent component
    window.location.reload()
  }

  // Don't show if loading or no legacy methods
  if (loading || !showMigration) {
    return null
  }

  // Check if user has already dismissed
  if (typeof window !== 'undefined' && localStorage.getItem('paymentMigrationDismissed')) {
    return null
  }

  return (
    <>
      {/* Migration Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">
              🔒 セキュリティ向上のためカード情報の再登録が必要です
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              より安全な決済システムに移行しました。既存のカード情報をより安全な方法で再登録してください（約1分で完了）。
            </p>
            
            {/* Legacy cards display */}
            <div className="space-y-2 mb-3">
              {legacyMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-100 rounded px-2 py-1">
                  <CreditCard size={14} />
                  <span className="capitalize">{method.brand}</span>
                  <span>•••• {method.last4}</span>
                  <span>{method.exp_month}/{method.exp_year}</span>
                  <span className="text-red-600">→ 再登録が必要</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowCardForm(true)}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition-colors"
              >
                今すぐ再登録する
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-amber-700 text-sm hover:bg-amber-100 rounded transition-colors"
              >
                後で再登録する
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-amber-500 hover:text-amber-700 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Card Registration Modal */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  安全なカード再登録
                </h2>
                <button
                  onClick={() => setShowCardForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <StripeCardForm
                onSuccess={handleMigrateSuccess}
                onCancel={() => setShowCardForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}