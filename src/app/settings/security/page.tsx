'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft, Shield, Lock, Smartphone, Key, Eye, EyeOff } from 'lucide-react'

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    biometricEnabled: true,
    loginNotifications: true
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

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('新しいパスワードが一致しません')
      return
    }
    if (passwords.new.length < 8) {
      alert('パスワードは8文字以上で設定してください')
      return
    }
    
    try {
      // Update password logic here
      alert('パスワードを更新しました')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      alert('パスワードの更新に失敗しました')
    }
  }

  const handleEnable2FA = () => {
    alert('2要素認証の設定画面に移動します')
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
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">セキュリティ</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* Password Change */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">パスワード変更</h2>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      現在のパスワード
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => handlePasswordChange('current', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="現在のパスワードを入力"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      新しいパスワード
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="8文字以上で入力"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      新しいパスワード（確認）
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="新しいパスワードを再入力"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordUpdate}
                    className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-black font-medium rounded-lg transition-colors"
                  >
                    パスワードを更新
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2要素認証</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Key size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">2要素認証</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {settings.twoFactorEnabled ? '有効' : '無効'} • セキュリティを強化
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {settings.twoFactorEnabled ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">有効</span>
                  ) : (
                    <button
                      onClick={handleEnable2FA}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      設定する
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Other Security Settings */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">その他のセキュリティ</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Smartphone size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">生体認証</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Face ID・Touch ID・指紋認証</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('biometricEnabled')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.biometricEnabled ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.biometricEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">ログイン通知</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">新しいデバイスでのログインを通知</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleToggle('loginNotifications')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.loginNotifications ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        settings.loginNotifications ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">セキュリティのヒント</h3>
            <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <p>• パスワードは定期的に変更しましょう</p>
              <p>• 2要素認証を有効にして、アカウントを保護しましょう</p>
              <p>• 生体認証を使用してログインを簡単かつ安全に</p>
              <p>• 不審なログインがあった場合はすぐにパスワードを変更してください</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}