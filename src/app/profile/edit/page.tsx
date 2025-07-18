'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  displayName: string
  avatar: string
  timezone: string
  bio: string
  goal: string
  wakeUpTime: string
  challengeLevel: 'beginner' | 'intermediate' | 'advanced'
  notificationSettings: {
    email: boolean
    push: boolean
    sms: boolean
    challengeReminder: boolean
    weeklyReport: boolean
  }
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private'
    showProgress: boolean
    showStats: boolean
  }
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'auto'
    currency: string
  }
}

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getCurrentUser()
      if (!user) {
        setLoading(false)
        return
      }
      const supabase = createClientSideClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (!error) {
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  // profileがnullのときのローディングや未ログイン表示を追加
  if (loading) {
    return <div>読み込み中...</div>
  }
  if (!profile) {
    return <div>ログインが必要です</div>
  }

  // Validation function
  const validateProfile = () => {
    const errors: Record<string, string> = {}
    
    if (!profile.displayName.trim()) {
      errors.displayName = '表示名は必須です'
    } else if (profile.displayName.length < 2) {
      errors.displayName = '表示名は2文字以上で入力してください'
    }
    
    if (profile.bio.length > 200) {
      errors.bio = '自己紹介は200文字以内で入力してください'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Track changes
  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    setHasChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    if (!validateProfile()) {
      return
    }
    
    setSaving(true)
    try {
      // Mock API call - in real app, update via API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHasChanges(false)
      alert('プロフィールを更新しました')
      router.push('/profile')
    } catch (error) {
      console.error('Profile update failed:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/profile')
  }

  const handleNotificationChange = (type: keyof Profile['notificationSettings']) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [type]: !prev.notificationSettings[type]
        }
      };
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">プロフィール編集</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'basic', label: '基本情報', icon: '👤' },
            { id: 'goals', label: '目標設定', icon: '🎯' },
            { id: 'notifications', label: '通知', icon: '🔔' },
            { id: 'privacy', label: 'プライバシー', icon: '🔒' },
            { id: 'preferences', label: '設定', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      <div className="p-6 pb-32">
        {/* Changes Indicator */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-blue-800 font-medium">未保存の変更があります</span>
            </div>
          </div>
        )}

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🖼️</span>
                プロフィール画像
              </h2>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Button variant="outline" className="mb-2">
                    画像を変更
                  </Button>
                  <p className="text-sm text-gray-500">JPG, PNG 形式、最大 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                基本情報
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => handleProfileChange('displayName', e.target.value)}
                    placeholder="表示名を入力"
                    className={`w-full ${validationErrors.displayName ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.displayName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.displayName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">メールアドレスは変更できません</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    placeholder="あなたの目標や趣味について教えてください..."
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${validationErrors.bio ? 'border-red-500' : ''}`}
                  />
                  <div className="flex justify-between mt-1">
                    {validationErrors.bio && (
                      <p className="text-red-500 text-sm">{validationErrors.bio}</p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">{profile.bio.length}/200</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイムゾーン
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => handleProfileChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Asia/Tokyo">日本標準時 (JST)</option>
                    <option value="UTC">協定世界時 (UTC)</option>
                    <option value="America/New_York">東部標準時 (EST)</option>
                    <option value="Europe/London">グリニッジ標準時 (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                チャレンジ設定
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主な目標
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'health', label: '健康', icon: '💪' },
                      { value: 'productivity', label: '生産性', icon: '📈' },
                      { value: 'habit', label: '習慣化', icon: '🔄' },
                      { value: 'discipline', label: '自制心', icon: '🧠' }
                    ].map(goal => (
                      <button
                        key={goal.value}
                        onClick={() => handleProfileChange('goal', goal.value)}
                        className={`p-3 rounded-lg border-2 transition-colors text-center ${
                          profile.goal === goal.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{goal.icon}</div>
                        <div className="text-sm font-medium">{goal.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望起床時間
                  </label>
                  <input
                    type="time"
                    value={profile.wakeUpTime}
                    onChange={(e) => handleProfileChange('wakeUpTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チャレンジレベル
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'beginner', label: '初心者', desc: '短距離・低ペナルティ', color: 'green' },
                      { value: 'intermediate', label: '中級者', desc: '中距離・通常ペナルティ', color: 'yellow' },
                      { value: 'advanced', label: '上級者', desc: '長距離・高ペナルティ', color: 'red' }
                    ].map(level => (
                      <button
                        key={level.value}
                        onClick={() => handleProfileChange('challengeLevel', level.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                          profile.challengeLevel === level.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-500">{level.desc}</div>
                          </div>
                          <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🔔</span>
              通知設定
            </h2>
            <div className="space-y-4">
              {[
                { key: 'email', label: 'メール通知', desc: 'チャレンジ開始や結果をメールで通知' },
                { key: 'push', label: 'プッシュ通知', desc: 'チャレンジ開始や結果をプッシュ通知' },
                { key: 'sms', label: 'SMS通知', desc: '重要な通知をSMSで送信' },
                { key: 'challengeReminder', label: 'チャレンジリマインダー', desc: '設定時間の前に通知' },
                { key: 'weeklyReport', label: '週次レポート', desc: '毎週の進捗レポートを送信' }
              ].map(notification => (
                <div key={notification.key} className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium text-gray-800">{notification.label}</h3>
                    <p className="text-sm text-gray-500">{notification.desc}</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(notification.key as keyof Profile['notificationSettings'])}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      profile.notificationSettings[notification.key as keyof Profile['notificationSettings']] ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      profile.notificationSettings[notification.key as keyof Profile['notificationSettings']] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🔒</span>
              プライバシー設定
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール公開設定
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: '公開', desc: '誰でもプロフィールを見ることができます' },
                    { value: 'friends', label: 'フレンドのみ', desc: 'フレンドのみプロフィールを見ることができます' },
                    { value: 'private', label: '非公開', desc: 'プロフィールは非公開です' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setProfile(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings,
                            profileVisibility: option.value as 'public' | 'friends' | 'private'
                          }
                        };
                      })}
                      className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                        profile.privacySettings.profileVisibility === option.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'showProgress', label: '進捗を表示', desc: '他のユーザーにチャレンジ進捗を表示' },
                  { key: 'showStats', label: '統計を表示', desc: '他のユーザーに統計情報を表示' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{setting.label}</h3>
                      <p className="text-sm text-gray-500">{setting.desc}</p>
                    </div>
                    <button
                      onClick={() => setProfile(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          privacySettings: {
                            ...prev.privacySettings,
                            [setting.key]: !prev.privacySettings[setting.key as keyof Profile['privacySettings']]
                          }
                        };
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        profile.privacySettings[setting.key as keyof Profile['privacySettings']] ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        profile.privacySettings[setting.key as keyof Profile['privacySettings']] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              アプリ設定
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言語
                </label>
                <select
                  value={profile.preferences.language}
                  onChange={(e) => setProfile(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      preferences: { ...prev.preferences, language: e.target.value }
                    };
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テーマ
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'ライト', icon: '☀️' },
                    { value: 'dark', label: 'ダーク', icon: '🌙' },
                    { value: 'auto', label: '自動', icon: '🔄' }
                  ].map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => setProfile(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          preferences: { ...prev.preferences, theme: theme.value as 'light' | 'dark' | 'auto' }
                        };
                      })}
                      className={`p-3 rounded-lg border-2 transition-colors text-center ${
                        profile.preferences.theme === theme.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{theme.icon}</div>
                      <div className="text-sm font-medium">{theme.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通貨
                </label>
                <select
                  value={profile.preferences.currency}
                  onChange={(e) => setProfile(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      preferences: { ...prev.preferences, currency: e.target.value }
                    };
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="JPY">日本円 (¥)</option>
                  <option value="USD">米ドル ($)</option>
                  <option value="EUR">ユーロ (€)</option>
                  <option value="KRW">韓国ウォン (₩)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-red-600 font-medium text-sm">入力エラーがあります:</span>
            </div>
            <ul className="text-red-600 text-sm space-y-1">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || Object.keys(validationErrors).length > 0}
            className={`flex-1 transition-all ${
              hasChanges && Object.keys(validationErrors).length === 0
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? '保存中...' : hasChanges ? '変更を保存' : '保存'}
          </Button>
        </div>
        
        {/* Save Status */}
        <div className="text-center mt-2">
          {hasChanges ? (
            <p className="text-blue-600 text-xs">未保存の変更があります</p>
          ) : (
            <p className="text-gray-500 text-xs">すべての変更が保存済みです</p>
          )}
        </div>
      </div>
    </div>
  )
} 