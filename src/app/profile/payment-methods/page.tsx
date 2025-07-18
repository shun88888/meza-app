'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CardRegistration from '@/components/CardRegistration'
import { getPaymentMethods, PaymentMethodInfo } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/supabase'

interface PaymentHistory {
  id: string
  date: string
  amount: number
  status: 'completed' | 'failed' | 'pending'
  challengeId: string
  challengeLocation: string
  paymentMethodLast4: string
  failureReason?: string
}

interface PaymentSettings {
  autoPayEnabled: boolean
  defaultPaymentMethodId: string
  maxDailyAmount: number
  monthlyLimit: number
  notificationPreferences: {
    paymentSuccess: boolean
    paymentFailure: boolean
    monthlyStatement: boolean
  }
}

export default function PaymentMethodsPage() {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCardRegistration, setShowCardRegistration] = useState(false)
  const [activeTab, setActiveTab] = useState<'cards' | 'history' | 'settings'>('cards')
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    autoPayEnabled: true,
    defaultPaymentMethodId: '',
    maxDailyAmount: 5000,
    monthlyLimit: 50000,
    notificationPreferences: {
      paymentSuccess: true,
      paymentFailure: true,
      monthlyStatement: false
    }
  })
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setUserId(user.id)
      await loadPaymentData(user.id)
    } catch (error) {
      console.error('Error initializing user:', error)
      setError('ユーザー情報の取得に失敗しました')
      setLoading(false)
    }
  }

  const loadPaymentData = async (userIdParam: string) => {
    try {
      setLoading(true)
      
      // Load payment methods
      const response = await getPaymentMethods(userIdParam)
      setPaymentMethods(response.paymentMethods)
      
      // Load mock payment history
      setPaymentHistory([
        {
          id: '1',
          date: '2024-01-15',
          amount: 500,
          status: 'completed',
          challengeId: 'ch_001',
          challengeLocation: '渋谷駅',
          paymentMethodLast4: '4242'
        },
        {
          id: '2',
          date: '2024-01-14',
          amount: 1000,
          status: 'completed',
          challengeId: 'ch_002',
          challengeLocation: '新宿駅',
          paymentMethodLast4: '4242'
        },
        {
          id: '3',
          date: '2024-01-13',
          amount: 750,
          status: 'failed',
          challengeId: 'ch_003',
          challengeLocation: '池袋駅',
          paymentMethodLast4: '4242',
          failureReason: 'カード残高不足'
        },
        {
          id: '4',
          date: '2024-01-10',
          amount: 500,
          status: 'completed',
          challengeId: 'ch_004',
          challengeLocation: '品川駅',
          paymentMethodLast4: '4242'
        }
      ])
      
    } catch (error) {
      console.error('Error loading payment data:', error)
      setError('支払い情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCardRegistrationSuccess = (paymentMethod: PaymentMethodInfo) => {
    setPaymentMethods(prev => [...prev, paymentMethod])
    setShowCardRegistration(false)
  }

  const handleCardRegistrationError = (error: string) => {
    setError(error)
  }

  const handleCardRegistrationCancel = () => {
    setShowCardRegistration(false)
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    // In real app, call API to delete payment method
    setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
  }

  const handleUpdateSettings = async (newSettings: Partial<PaymentSettings>) => {
    // In real app, call API to update settings
    setPaymentSettings(prev => ({ ...prev, ...newSettings }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了'
      case 'failed':
        return '失敗'
      case 'pending':
        return '保留中'
      default:
        return '不明'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">支払い情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">認証が必要です</h1>
          <p className="text-gray-600 mb-6">ログインしてください</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  if (showCardRegistration) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => setShowCardRegistration(false)}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>
          </div>
          
          <CardRegistration
            userId={userId}
            onSuccess={handleCardRegistrationSuccess}
            onError={handleCardRegistrationError}
            onCancel={handleCardRegistrationCancel}
            isRequired={false}
          />
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
          <h1 className="text-lg font-semibold text-gray-800">支払い方法</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'cards', label: 'カード', icon: '💳' },
            { id: 'history', label: '履歴', icon: '📋' },
            { id: 'settings', label: '設定', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {/* Add Card Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">登録済みカード</h2>
                <button
                  onClick={() => setShowCardRegistration(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  カードを追加
                </button>
              </div>

              {/* Payment Methods List */}
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    カードが登録されていません
                  </h3>
                  <p className="text-gray-600 mb-6">
                    チャレンジを開始するには、カード情報を登録してください。
                  </p>
                  <button
                    onClick={() => setShowCardRegistration(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    カードを登録
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-900 capitalize mr-2">
                            {pm.card?.brand}
                          </span>
                          <span className="text-gray-600">
                            •••• •••• •••• {pm.card?.last4}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          有効期限: {pm.card?.exp_month}/{pm.card?.exp_year}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pm.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            デフォルト
                          </span>
                        )}
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Period Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">支払い履歴</h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-label="期間選択"
                >
                  <option value="week">過去1週間</option>
                  <option value="month">過去1ヶ月</option>
                  <option value="year">過去1年</option>
                </select>
              </div>

              {/* Payment History List */}
              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    支払い履歴がありません
                  </h3>
                  <p className="text-gray-600">
                    チャレンジを開始すると、支払い履歴がここに表示されます。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {payment.challengeLocation}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.date} • •••• {payment.paymentMethodLast4}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${getStatusColor(payment.status)}`}>
                              {getStatusLabel(payment.status)}
                            </div>
                          </div>
                        </div>
                        {payment.failureReason && (
                          <div className="text-sm text-red-600 mt-2">
                            {payment.failureReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Payment Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">支払い設定</h2>
              
              <div className="space-y-4">
                {/* Auto Payment */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">自動支払い</div>
                    <div className="text-sm text-gray-500">
                      チャレンジ失敗時に自動的に支払いを実行
                    </div>
                  </div>
                                     <label htmlFor="autoPayEnabled" className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       id="autoPayEnabled"
                       checked={paymentSettings.autoPayEnabled}
                       onChange={(e) => handleUpdateSettings({ autoPayEnabled: e.target.checked })}
                       className="sr-only peer"
                       aria-label="自動支払いを有効にする"
                     />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {/* Max Daily Amount */}
                <div>
                  <label htmlFor="maxDailyAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    1日の最大支払い額
                  </label>
                  <input
                    type="number"
                    id="maxDailyAmount"
                    value={paymentSettings.maxDailyAmount}
                    onChange={(e) => handleUpdateSettings({ maxDailyAmount: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Monthly Limit */}
                <div>
                  <label htmlFor="monthlyLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    月間支払い上限
                  </label>
                  <input
                    type="number"
                    id="monthlyLimit"
                    value={paymentSettings.monthlyLimit}
                    onChange={(e) => handleUpdateSettings({ monthlyLimit: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">通知設定</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">支払い成功通知</div>
                    <div className="text-sm text-gray-500">
                      支払いが成功した際に通知を受け取る
                    </div>
                  </div>
                                     <label htmlFor="paymentSuccess" className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       id="paymentSuccess"
                       checked={paymentSettings.notificationPreferences.paymentSuccess}
                       onChange={(e) => handleUpdateSettings({ 
                         notificationPreferences: { 
                           ...paymentSettings.notificationPreferences,
                           paymentSuccess: e.target.checked 
                         }
                       })}
                       className="sr-only peer"
                       aria-label="支払い成功通知を有効にする"
                     />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">支払い失敗通知</div>
                    <div className="text-sm text-gray-500">
                      支払いが失敗した際に通知を受け取る
                    </div>
                  </div>
                                     <label htmlFor="paymentFailure" className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       id="paymentFailure"
                       checked={paymentSettings.notificationPreferences.paymentFailure}
                       onChange={(e) => handleUpdateSettings({ 
                         notificationPreferences: { 
                           ...paymentSettings.notificationPreferences,
                           paymentFailure: e.target.checked 
                         }
                       })}
                       className="sr-only peer"
                       aria-label="支払い失敗通知を有効にする"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                   </label>
                 </div>

                 <div className="flex items-center justify-between">
                   <div>
                     <div className="font-medium text-gray-900">月次レポート</div>
                     <div className="text-sm text-gray-500">
                       月次の支払いレポートを受け取る
                     </div>
                   </div>
                   <label htmlFor="monthlyStatement" className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       id="monthlyStatement"
                       checked={paymentSettings.notificationPreferences.monthlyStatement}
                       onChange={(e) => handleUpdateSettings({ 
                         notificationPreferences: { 
                           ...paymentSettings.notificationPreferences,
                           monthlyStatement: e.target.checked 
                         }
                       })}
                       className="sr-only peer"
                       aria-label="月次レポートを有効にする"
                     />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}