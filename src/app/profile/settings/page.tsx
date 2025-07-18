'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'ja' | 'en'
  soundEnabled: boolean
  vibrationEnabled: boolean
  autoStartChallenges: boolean
  locationAccuracy: 'high' | 'medium' | 'low'
  dataUsage: 'wifi' | 'always' | 'never'
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  hapticFeedback: boolean
  screenTimeout: number
  autoSync: boolean
  backgroundSync: boolean
  pushNotifications: boolean
  emailNotifications: boolean
  weeklyReports: boolean
  achievementNotifications: boolean
  challengeReminders: boolean
  weatherAlerts: boolean
  analyticsEnabled: boolean
  crashReporting: boolean
  betaFeatures: boolean
  debugMode: boolean
}

interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  challengeStart: boolean
  challengeSuccess: boolean
  challengeFailure: boolean
  weeklyReports: boolean
  achievements: boolean
  weatherAlerts: boolean
  maintenanceNotices: boolean
  promotions: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'auto',
    language: 'ja',
    soundEnabled: true,
    vibrationEnabled: true,
    autoStartChallenges: false,
    locationAccuracy: 'high',
    dataUsage: 'wifi',
    fontSize: 'medium',
    reducedMotion: false,
    hapticFeedback: true,
    screenTimeout: 30,
    autoSync: true,
    backgroundSync: true,
    pushNotifications: true,
    emailNotifications: false,
    weeklyReports: true,
    achievementNotifications: true,
    challengeReminders: true,
    weatherAlerts: true,
    analyticsEnabled: true,
    crashReporting: true,
    betaFeatures: false,
    debugMode: false
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: false,
    challengeStart: true,
    challengeSuccess: true,
    challengeFailure: true,
    weeklyReports: true,
    achievements: true,
    weatherAlerts: true,
    maintenanceNotices: true,
    promotions: false
  })
  
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'notifications' | 'advanced' | 'about'>('general')

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('設定を保存しました')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('設定の保存に失敗しました')
    }
  }

  const handleReset = () => {
    if (confirm('設定をリセットしますか？')) {
      setSettings({
        theme: 'auto',
        language: 'ja',
        soundEnabled: true,
        vibrationEnabled: true,
        autoStartChallenges: false,
        locationAccuracy: 'high',
        dataUsage: 'wifi',
        fontSize: 'medium',
        reducedMotion: false,
        hapticFeedback: true,
        screenTimeout: 30,
        autoSync: true,
        backgroundSync: true,
        pushNotifications: true,
        emailNotifications: false,
        weeklyReports: true,
        achievementNotifications: true,
        challengeReminders: true,
        weatherAlerts: true,
        analyticsEnabled: true,
        crashReporting: true,
        betaFeatures: false,
        debugMode: false
      })
      setNotificationSettings({
        pushEnabled: true,
        emailEnabled: false,
        challengeStart: true,
        challengeSuccess: true,
        challengeFailure: true,
        weeklyReports: true,
        achievements: true,
        weatherAlerts: true,
        maintenanceNotices: true,
        promotions: false
      })
      alert('設定をリセットしました')
    }
  }

  const handleExportData = async () => {
    try {
      alert('データをエクスポートしています...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock export data
      const exportData = {
        settings,
        notificationSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `meza-settings-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      alert('設定データをエクスポートしました')
    } catch (error) {
      alert('エクスポートに失敗しました')
    }
  }

  const handleClearCache = async () => {
    if (confirm('キャッシュをクリアしますか？')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('キャッシュをクリアしました')
      } catch (error) {
        alert('キャッシュのクリアに失敗しました')
      }
    }
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
          <h1 className="text-lg font-semibold text-gray-800">アプリ設定</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'general', label: '一般', icon: '⚙️' },
            { id: 'display', label: '表示', icon: '🎨' },
            { id: 'notifications', label: '通知', icon: '🔔' },
            { id: 'advanced', label: '詳細設定', icon: '🔧' },
            { id: 'about', label: 'このアプリについて', icon: 'ℹ️' }
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
      <div className="p-6 space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">⚙️</span>
                  基本設定
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">言語</h3>
                      <p className="text-sm text-gray-500">アプリの表示言語</p>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">音声</h3>
                      <p className="text-sm text-gray-500">効果音とアラーム音</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.soundEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">バイブレーション</h3>
                      <p className="text-sm text-gray-500">触覚フィードバック</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('vibrationEnabled', !settings.vibrationEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.vibrationEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">ハプティックフィードバック</h3>
                      <p className="text-sm text-gray-500">タップ時の振動フィードバック</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('hapticFeedback', !settings.hapticFeedback)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.hapticFeedback ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Settings */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🏃</span>
                  チャレンジ設定
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">自動開始</h3>
                      <p className="text-sm text-gray-500">チャレンジを自動で開始</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('autoStartChallenges', !settings.autoStartChallenges)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.autoStartChallenges ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.autoStartChallenges ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">位置精度</h3>
                      <p className="text-sm text-gray-500">GPS位置情報の精度レベル</p>
                    </div>
                    <select
                      value={settings.locationAccuracy}
                      onChange={(e) => handleSettingChange('locationAccuracy', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="high">高精度（推奨）</option>
                      <option value="medium">中精度</option>
                      <option value="low">低精度</option>
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">天気アラート</h3>
                      <p className="text-sm text-gray-500">悪天候時の警告</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('weatherAlerts', !settings.weatherAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.weatherAlerts ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.weatherAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Usage */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📡</span>
                  データ使用
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">データ使用設定</h3>
                      <p className="text-sm text-gray-500">モバイル通信の使用タイミング</p>
                    </div>
                    <select
                      value={settings.dataUsage}
                      onChange={(e) => handleSettingChange('dataUsage', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="wifi">Wi-Fiのみ</option>
                      <option value="always">常時使用</option>
                      <option value="never">使用しない</option>
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">自動同期</h3>
                      <p className="text-sm text-gray-500">データの自動同期を有効化</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('autoSync', !settings.autoSync)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.autoSync ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.autoSync ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">バックグラウンド同期</h3>
                      <p className="text-sm text-gray-500">アプリが非アクティブ時の同期</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('backgroundSync', !settings.backgroundSync)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.backgroundSync ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.backgroundSync ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <div className="space-y-6">
            {/* Appearance */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🎨</span>
                  外観
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">テーマ</h3>
                      <p className="text-sm text-gray-500">アプリの配色テーマ</p>
                    </div>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="light">ライトモード</option>
                      <option value="dark">ダークモード</option>
                      <option value="auto">システム設定に従う</option>
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">フォントサイズ</h3>
                      <p className="text-sm text-gray-500">文字の表示サイズ</p>
                    </div>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="small">小</option>
                      <option value="medium">標準</option>
                      <option value="large">大</option>
                    </select>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">画面タイムアウト</h3>
                      <p className="text-sm text-gray-500">自動画面オフまでの時間</p>
                    </div>
                    <select
                      value={settings.screenTimeout}
                      onChange={(e) => handleSettingChange('screenTimeout', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={15}>15秒</option>
                      <option value={30}>30秒</option>
                      <option value={60}>1分</option>
                      <option value={120}>2分</option>
                      <option value={300}>5分</option>
                      <option value={0}>なし</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">♿</span>
                  アクセシビリティ
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">アニメーションを減らす</h3>
                      <p className="text-sm text-gray-500">視覚効果とアニメーションを最小限に</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('reducedMotion', !settings.reducedMotion)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.reducedMotion ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Push Notifications */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔔</span>
                  プッシュ通知
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">プッシュ通知を有効化</h3>
                      <p className="text-sm text-gray-500">通知の基本設定</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('pushEnabled')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.pushEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">チャレンジ開始</h3>
                      <p className="text-sm text-gray-500">チャレンジ開始時の通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('challengeStart')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.challengeStart ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.challengeStart ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">チャレンジ成功</h3>
                      <p className="text-sm text-gray-500">チャレンジ成功時の通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('challengeSuccess')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.challengeSuccess ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.challengeSuccess ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">チャレンジ失敗</h3>
                      <p className="text-sm text-gray-500">チャレンジ失敗時の通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('challengeFailure')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.challengeFailure ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.challengeFailure ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">達成・バッジ</h3>
                      <p className="text-sm text-gray-500">バッジ獲得時の通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('achievements')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.achievements ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.achievements ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">天気アラート</h3>
                      <p className="text-sm text-gray-500">悪天候時の警告通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('weatherAlerts')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.weatherAlerts ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.weatherAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📧</span>
                  メール通知
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">メール通知を有効化</h3>
                      <p className="text-sm text-gray-500">メールでの通知受信</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('emailEnabled')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.emailEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">週間レポート</h3>
                      <p className="text-sm text-gray-500">週間統計レポートをメールで受信</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('weeklyReports')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.weeklyReports ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">メンテナンス通知</h3>
                      <p className="text-sm text-gray-500">システムメンテナンス情報</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('maintenanceNotices')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.maintenanceNotices ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.maintenanceNotices ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">プロモーション</h3>
                      <p className="text-sm text-gray-500">キャンペーンやお得情報</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('promotions')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.promotions ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings.promotions ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Privacy & Analytics */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔒</span>
                  プライバシー・解析
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">使用状況データの送信</h3>
                      <p className="text-sm text-gray-500">アプリ改善のための匿名データ</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('analyticsEnabled', !settings.analyticsEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.analyticsEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">クラッシュレポート</h3>
                      <p className="text-sm text-gray-500">アプリ異常終了時の自動レポート送信</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('crashReporting', !settings.crashReporting)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.crashReporting ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.crashReporting ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Experimental Features */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🧪</span>
                  実験的機能
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">ベータ機能</h3>
                      <p className="text-sm text-gray-500">テスト段階の新機能を有効化</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('betaFeatures', !settings.betaFeatures)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.betaFeatures ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.betaFeatures ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">デバッグモード</h3>
                      <p className="text-sm text-gray-500">開発者向けデバッグ情報を表示</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('debugMode', !settings.debugMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.debugMode ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">💾</span>
                  データ管理
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">設定をエクスポート</h3>
                      <p className="text-sm text-gray-500">設定をJSON形式で保存</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      エクスポート
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">キャッシュクリア</h3>
                      <p className="text-sm text-gray-500">アプリのキャッシュデータを削除</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleClearCache}>
                      クリア
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">設定をリセット</h3>
                      <p className="text-sm text-gray-500">すべての設定を初期値に戻す</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleReset}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      リセット
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* App Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📱</span>
                  アプリ情報
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">バージョン</h3>
                      <p className="text-sm text-gray-500">1.0.0 (Build 100)</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">最終更新</h3>
                      <p className="text-sm text-gray-500">2024年1月15日</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">開発者</h3>
                      <p className="text-sm text-gray-500">Meza App Team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📄</span>
                  法的情報
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">利用規約</h3>
                      <p className="text-sm text-gray-500">アプリの利用条件について</p>
                    </div>
                    <Button variant="outline" size="sm">
                      表示
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">プライバシーポリシー</h3>
                      <p className="text-sm text-gray-500">個人情報の取り扱いについて</p>
                    </div>
                    <Button variant="outline" size="sm">
                      表示
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">ライセンス</h3>
                      <p className="text-sm text-gray-500">オープンソースライセンス情報</p>
                    </div>
                    <Button variant="outline" size="sm">
                      表示
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🆘</span>
                  サポート
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">ヘルプセンター</h3>
                      <p className="text-sm text-gray-500">よくある質問とサポート</p>
                    </div>
                    <Button variant="outline" size="sm">
                      開く
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">お問い合わせ</h3>
                      <p className="text-sm text-gray-500">直接サポートチームに連絡</p>
                    </div>
                    <Button variant="outline" size="sm">
                      送信
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">評価・レビュー</h3>
                      <p className="text-sm text-gray-500">App Storeで評価をお願いします</p>
                    </div>
                    <Button variant="outline" size="sm">
                      評価する
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
        >
          設定を保存
        </Button>
      </div>
    </div>
  )
} 