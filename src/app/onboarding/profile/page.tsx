'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient } from '@/lib/supabase'

export default function OnboardingProfilePage() {
  const router = useRouter()
  const supabase = createClientSideClient()
  const [formData, setFormData] = useState({
    displayName: '',
    goal: '',
    wakeUpTime: '07:00',
    timezone: 'Asia/Tokyo',
    notifications: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Early return after hooks if supabase is not available
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            サービスが利用できません
          </h1>
          <p className="text-gray-600">
            しばらく時間をおいてから再度お試しください。
          </p>
        </div>
      </div>
    )
  }

  const goals = [
    { value: 'health', label: '健康管理', icon: '🏃‍♂️' },
    { value: 'productivity', label: '生産性向上', icon: '📈' },
    { value: 'study', label: '勉強時間確保', icon: '📚' },
    { value: 'exercise', label: '運動習慣', icon: '💪' },
    { value: 'work', label: '仕事効率化', icon: '💼' },
    { value: 'other', label: 'その他', icon: '🎯' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = '表示名を入力してください'
    }

    if (!formData.goal) {
      newErrors.goal = '目標を選択してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not found.')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          goal: formData.goal,
          wake_up_time: formData.wakeUpTime,
          timezone: formData.timezone,
          notifications_enabled: formData.notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      router.push('/onboarding/complete')
    } catch (error) {
      console.error('Profile update error:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'プロフィールの更新に失敗しました' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FFAD2F] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">プロフィール設定</h1>
          <p className="text-gray-600">基本情報と目標を設定しましょう</p>
          
          {/* Progress */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-6 h-6 bg-[#FFAD2F] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
              <span className="mr-2">プロフィール</span>
              <span className="text-gray-400">→</span>
              <span className="ml-2 mr-2">決済設定</span>
              <span className="text-gray-400">→</span>
              <span className="ml-2">完了</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              表示名
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="太郎"
            />
            {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              早起きの目標
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => handleInputChange('goal', goal.value)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.goal === goal.value
                      ? 'border-[#FFAD2F] bg-orange-50 text-orange-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-1">{goal.icon}</div>
                  <div className="text-sm font-medium">{goal.label}</div>
                </button>
              ))}
            </div>
            {errors.goal && <p className="mt-1 text-sm text-red-600">{errors.goal}</p>}
          </div>

          {/* Wake Up Time */}
          <div>
            <label htmlFor="wakeUpTime" className="block text-sm font-medium text-gray-700 mb-2">
              理想の起床時間
            </label>
            <input
              type="time"
              id="wakeUpTime"
              value={formData.wakeUpTime}
              onChange={(e) => handleInputChange('wakeUpTime', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              チャレンジ作成時のデフォルト時間として使用されます
            </p>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                className="h-4 w-4 text-[#FFAD2F] focus:ring-[#FFAD2F] border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">通知を受け取る</span>
                <p className="text-xs text-gray-500">チャレンジのリマインダーやアップデート情報</p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                保存中...
              </div>
            ) : (
              '次へ：決済設定'
            )}
          </button>
        </form>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push('/onboarding')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← 戻る
          </button>
          <button
            onClick={() => router.push('/onboarding/payment')}
            className="text-[#FFAD2F] hover:text-[#FF9A1F] text-sm"
          >
            スキップ →
          </button>
        </div>
      </div>
    </div>
  )
}