'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ChevronLeft, Bell, Clock, Volume2, Smartphone, Mail } from 'lucide-react'

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    pushNotifications: true,
    challengeReminder: true,
    challengeStart: true,
    challengeSuccess: true,
    challengeFailure: true,
    weeklyReport: false,
    emailNotifications: false,
    reminderTime: 30, // minutes before
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '07:00'
  })
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        // Load user notification settings here
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

  const handleReminderTimeChange = (minutes: number) => {
    setSettings(prev => ({
      ...prev,
      reminderTime: minutes
    }))
  }

  const handleTimeChange = (key: 'quietStart' | 'quietEnd', value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    try {
      // Save settings to database
      alert('設定を保存しました')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('設定の保存に失敗しました')
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
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">通知設定</h1>
            <button 
              onClick={saveSettings}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Push Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Bell size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">プッシュ通知</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">アプリからの通知を受け取る</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">プッシュ通知を有効にする</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">すべての通知のマスタースイッチ</p>
                </div>
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Challenge Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Smartphone size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">チャレンジ通知</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">チャレンジ関連の通知</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">チャレンジ開始前のリマインダー</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">設定時間前にお知らせ</p>
                </div>
                <button
                  onClick={() => handleToggle('challengeReminder')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.challengeReminder ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.challengeReminder ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.challengeReminder && (
                <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">リマインダー時間</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 120].map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => handleReminderTimeChange(minutes)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          settings.reminderTime === minutes
                            ? 'bg-primary-500 text-black'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {minutes}分前
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">チャレンジ開始通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">チャレンジ開始時刻にお知らせ</p>
                </div>
                <button
                  onClick={() => handleToggle('challengeStart')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.challengeStart ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.challengeStart ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">チャレンジ成功通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">チャレンジ成功時にお知らせ</p>
                </div>
                <button
                  onClick={() => handleToggle('challengeSuccess')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.challengeSuccess ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.challengeSuccess ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">チャレンジ失敗通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">チャレンジ失敗時にお知らせ</p>
                </div>
                <button
                  onClick={() => handleToggle('challengeFailure')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.challengeFailure ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.challengeFailure ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Volume2 size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">サイレント時間</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">指定時間は通知を停止</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">サイレント時間を有効にする</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">指定した時間帯は通知しない</p>
                </div>
                <button
                  onClick={() => handleToggle('quietHours')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.quietHours ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.quietHours ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.quietHours && (
                <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">開始時刻</label>
                    <input
                      type="time"
                      value={settings.quietStart}
                      onChange={(e) => handleTimeChange('quietStart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">終了時刻</label>
                    <input
                      type="time"
                      value={settings.quietEnd}
                      onChange={(e) => handleTimeChange('quietEnd', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Other Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Mail size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">その他の通知</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">レポートやお知らせ</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">週間レポート</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">毎週の成果をお知らせ</p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReport')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.weeklyReport ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">メール通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">重要なお知らせをメールで受信</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}