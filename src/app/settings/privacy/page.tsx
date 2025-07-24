'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft, Eye, MapPin, Database, Share, FileText } from 'lucide-react'

export default function PrivacyPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    locationTracking: true,
    dataCollection: true,
    analytics: false,
    thirdPartySharing: false,
    profileVisibility: 'private' as 'public' | 'private' | 'friends'
  })
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

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleVisibilityChange = (value: 'public' | 'private' | 'friends') => {
    setSettings(prev => ({
      ...prev,
      profileVisibility: value
    }))
  }

  const handleExportData = () => {
    alert('データのエクスポートを開始します。完了時にメールでお知らせします。')
  }

  const handleDeleteData = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      alert('データの削除を開始します。')
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
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">プライバシー</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* Data Collection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">データの使用</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">位置情報の追跡</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">チャレンジの検証に使用</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('locationTracking')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.locationTracking ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.locationTracking ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Database size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">使用データの収集</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">アプリの改善のため</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('dataCollection')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.dataCollection ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.dataCollection ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Eye size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">解析データの収集</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">匿名の使用統計</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('analytics')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.analytics ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.analytics ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Share size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">第三者との共有</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">パートナー企業との共有</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('thirdPartySharing')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.thirdPartySharing ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.thirdPartySharing ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Visibility */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">プロフィールの公開範囲</h2>
            </div>
            <div className="space-y-3">
              {[
                { value: 'private', label: 'プライベート', desc: '自分のみ表示' },
                { value: 'friends', label: 'フレンド', desc: 'フレンドのみ表示' },
                { value: 'public', label: 'パブリック', desc: 'すべてのユーザーに表示' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVisibilityChange(option.value as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    settings.profileVisibility === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    settings.profileVisibility === option.value
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {settings.profileVisibility === option.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">データの管理</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <FileText size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">データのエクスポート</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">すべてのデータをダウンロード</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleDeleteData}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Database size={20} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-red-600 dark:text-red-400 text-sm">すべてのデータを削除</p>
                    <p className="text-xs text-red-500 dark:text-red-500">この操作は取り消せません</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">プライバシーについて</h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• 収集したデータは暗号化して安全に保存されます</p>
              <p>• 位置情報はチャレンジの検証にのみ使用されます</p>
              <p>• 個人データが第三者に販売されることはありません</p>
              <p>• 詳しくは<span className="underline cursor-pointer">プライバシーポリシー</span>をご確認ください</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}