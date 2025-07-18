'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPaymentMethods, checkAutoCharge } from '@/lib/stripe'
import { createClientSideClient, getCurrentUser, signOut } from '@/lib/supabase'
import { subscribeToPushNotifications, notificationManager } from '@/lib/notifications'

export default function ProfilePage() {
  const router = useRouter()
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const user = await getCurrentUser()
      setUser(user)
      if (user) {
        // プロフィール情報を取得
        const supabase = createClientSideClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (!error) {
          setProfile(data)
        }
        await loadPaymentMethodStatus(user.id)
        await loadUserSettings(user.id)
      } else {
        setLoading(false)
      }
    }
    fetchUserAndProfile()
  }, [])

  const loadPaymentMethodStatus = async (userId: string) => {
    try {
      const response = await getPaymentMethods(userId)
      setHasPaymentMethod(response.hasPaymentMethod)
      if (response.hasPaymentMethod && response.paymentMethods.length > 0) {
        const pm = response.paymentMethods[0]
        setPaymentMethodInfo(`${pm.card?.brand} •••• ${pm.card?.last4}`)
      }
    } catch (error) {
      console.error('Failed to load payment method status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserSettings = async (userId: string) => {
    try {
      const supabase = createClientSideClient()
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        setUserSettings(data)
        setNotificationsEnabled(data.push_notifications_enabled)
      } else if (error && error.code === 'PGRST116') {
        // No settings found, create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            push_notifications_enabled: false,
            reminder_enabled: true,
            reminder_minutes_before: 10,
            theme: 'light',
            timezone: 'Asia/Tokyo'
          })
          .select()
          .single()

        if (!createError && newSettings) {
          setUserSettings(newSettings)
          setNotificationsEnabled(newSettings.push_notifications_enabled)
        }
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  const toggleNotifications = async () => {
    if (!user || !userSettings) return

    try {
      if (!notificationsEnabled) {
        // Enable notifications
        const subscription = await subscribeToPushNotifications()
        if (subscription) {
          const supabase = createClientSideClient()
          const { error } = await supabase
            .from('user_settings')
            .update({ push_notifications_enabled: true })
            .eq('user_id', user.id)

          if (!error) {
            setNotificationsEnabled(true)
            setUserSettings((prev: any) => ({ ...prev, push_notifications_enabled: true }))
          }
        }
      } else {
        // Disable notifications
        await notificationManager.unsubscribeFromPush()
        const supabase = createClientSideClient()
        const { error } = await supabase
          .from('user_settings')
          .update({ push_notifications_enabled: false })
          .eq('user_id', user.id)

        if (!error) {
          setNotificationsEnabled(false)
          setUserSettings((prev: any) => ({ ...prev, push_notifications_enabled: false }))
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
    }
  }

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!user) return

    setExportLoading(true)
    try {
      const response = await fetch(`/api/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = format === 'csv' ? `meza-challenges-${user.id}.csv` : `meza-data-${user.id}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました。もう一度お試しください。')
    } finally {
      setExportLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // デモユーザーデータも削除
      localStorage.removeItem('demo-user')
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ログインが必要です</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white font-semibold py-2 px-4 rounded-lg"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
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
          <h1 className="ml-2 text-lg font-semibold text-gray-800">プロフィール</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* User Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-[#FFAD2F] rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl font-semibold">
                {(profile?.display_name || user.email || 'U').charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile?.display_name || user.email}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">{profile?.created_at ? `${new Date(profile.created_at).toLocaleDateString()}から利用開始` : ''}</p>
            </div>
          </div>
        </div>

        {/* Payment Method Status */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">決済設定</h3>
          </div>
          <div className="p-4">
            <button
              onClick={() => router.push('/profile/payment-methods')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">支払い方法</div>
                  {loading ? (
                    <div className="text-sm text-gray-500">読み込み中...</div>
                  ) : hasPaymentMethod ? (
                    <div className="text-sm text-gray-500">{paymentMethodInfo}</div>
                  ) : (
                    <div className="text-sm text-red-600">未設定</div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {!loading && !hasPaymentMethod && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-2">
                    要設定
                  </span>
                )}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0V9a6 6 0 00-12 0v8" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">プッシュ通知</div>
                  <div className="text-sm text-gray-500">チャレンジ開始やリマインダーを受信</div>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-[#FFAD2F]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">設定</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => router.push('/history')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">チャレンジ履歴</div>
                  <div className="text-sm text-gray-500">過去のチャレンジを確認</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/stats')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">統計</div>
                  <div className="text-sm text-gray-500">成功率や傾向を確認</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="py-3 px-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">データエクスポート</div>
                  <div className="text-sm text-gray-500">チャレンジデータをダウンロード</div>
                </div>
              </div>
              <div className="flex space-x-2 ml-13">
                <button
                  onClick={() => handleExportData('json')}
                  disabled={exportLoading}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {exportLoading ? '処理中...' : 'JSON'}
                </button>
                <button
                  onClick={() => handleExportData('csv')}
                  disabled={exportLoading}
                  className="flex-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {exportLoading ? '処理中...' : 'CSV'}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-red-600">ログアウト</div>
                  <div className="text-sm text-gray-500">アカウントからサインアウト</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning for missing payment method */}
        {!loading && !hasPaymentMethod && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  支払い方法が未設定です
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  チャレンジを開始するには、クレジットカードの登録が必要です。
                </p>
                <button
                  onClick={() => router.push('/profile/payment-methods')}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  今すぐ設定する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}