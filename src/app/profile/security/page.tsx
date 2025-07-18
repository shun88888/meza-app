'use client'

import { useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SecuritySettings {
  twoFactorEnabled: boolean
  biometricEnabled: boolean
  sessionTimeout: number
  loginNotifications: boolean
  deviceManagement: boolean
  passwordLastChanged: string
  lastLogin: string
  activeSessions: number
  securityAlerts: boolean
  suspiciousActivityDetection: boolean
  dataEncryption: boolean
}

interface LoginHistory {
  id: string
  datetime: string
  location: string
  device: string
  ipAddress: string
  success: boolean
  suspicious: boolean
}

interface ActiveDevice {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet'
  os: string
  browser: string
  location: string
  lastActive: string
  currentSession: boolean
}

interface SecurityAlert {
  id: string
  type: 'login' | 'password' | 'device' | 'suspicious'
  message: string
  datetime: string
  severity: 'low' | 'medium' | 'high'
  read: boolean
}

export default function SecurityPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: true,
    sessionTimeout: 30,
    loginNotifications: true,
    deviceManagement: true,
    passwordLastChanged: '2024-01-10',
    lastLogin: '2024-01-15 14:30',
    activeSessions: 2,
    securityAlerts: true,
    suspiciousActivityDetection: true,
    dataEncryption: true
  })

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'auth' | 'history' | 'devices' | 'alerts'>('overview')
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])

  const handleSettingChange = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('新しいパスワードが一致しません')
      return
    }

    if (newPassword.length < 8) {
      alert('パスワードは8文字以上で入力してください')
      return
    }

    setChangingPassword(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSettings(prev => ({
        ...prev,
        passwordLastChanged: new Date().toISOString().split('T')[0]
      }))
      
      setShowPasswordChange(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      alert('パスワードを変更しました')
    } catch (error) {
      console.error('Password change failed:', error)
      alert('パスワードの変更に失敗しました')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogoutAllDevices = () => {
    if (confirm('すべてのデバイスからログアウトしますか？')) {
      alert('すべてのデバイスからログアウトしました')
      setSettings(prev => ({ ...prev, activeSessions: 1 }))
      setActiveDevices(prev => prev.map(d => ({ ...d, currentSession: d.id === 'current' })))
    }
  }

  const handleLogoutDevice = (deviceId: string) => {
    if (confirm('このデバイスからログアウトしますか？')) {
      setActiveDevices(prev => prev.filter(d => d.id !== deviceId))
      setSettings(prev => ({ ...prev, activeSessions: prev.activeSessions - 1 }))
      alert('デバイスからログアウトしました')
    }
  }

  const handleMarkAlertRead = (alertId: string) => {
    setSecurityAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ))
  }

  // Initialize mock data
  React.useEffect(() => {
    // Mock login history
    setLoginHistory([
      {
        id: '1',
        datetime: '2024-01-15 14:30',
        location: '東京都渋谷区',
        device: 'iPhone 15',
        ipAddress: '203.104.209.6',
        success: true,
        suspicious: false
      },
      {
        id: '2',
        datetime: '2024-01-15 08:15',
        location: '東京都新宿区',
        device: 'MacBook Pro',
        ipAddress: '203.104.209.6',
        success: true,
        suspicious: false
      },
      {
        id: '3',
        datetime: '2024-01-14 19:45',
        location: '大阪府大阪市',
        device: 'Android',
        ipAddress: '118.238.251.130',
        success: false,
        suspicious: true
      },
      {
        id: '4',
        datetime: '2024-01-14 07:30',
        location: '東京都渋谷区',
        device: 'iPhone 15',
        ipAddress: '203.104.209.6',
        success: true,
        suspicious: false
      }
    ])

    // Mock active devices
    setActiveDevices([
      {
        id: 'current',
        name: 'iPhone 15',
        type: 'mobile',
        os: 'iOS 17.2',
        browser: 'Safari',
        location: '東京都渋谷区',
        lastActive: '現在',
        currentSession: true
      },
      {
        id: '2',
        name: 'MacBook Pro',
        type: 'desktop',
        os: 'macOS Sonoma',
        browser: 'Chrome',
        location: '東京都新宿区',
        lastActive: '6時間前',
        currentSession: false
      },
      {
        id: '3',
        name: 'iPad Air',
        type: 'tablet',
        os: 'iPadOS 17.2',
        browser: 'Safari',
        location: '東京都品川区',
        lastActive: '2日前',
        currentSession: false
      }
    ])

    // Mock security alerts
    setSecurityAlerts([
      {
        id: '1',
        type: 'login',
        message: '新しいデバイスからのログインが検出されました',
        datetime: '2024-01-15 14:30',
        severity: 'medium',
        read: false
      },
      {
        id: '2',
        type: 'suspicious',
        message: '大阪からの不正なログイン試行が検出されました',
        datetime: '2024-01-14 19:45',
        severity: 'high',
        read: false
      },
      {
        id: '3',
        type: 'password',
        message: 'パスワードが正常に変更されました',
        datetime: '2024-01-10 16:20',
        severity: 'low',
        read: true
      }
    ])
  }, [])

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
          <h1 className="text-lg font-semibold text-gray-800">セキュリティ</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: '概要', icon: '📊' },
            { id: 'auth', label: '認証設定', icon: '🔐' },
            { id: 'history', label: 'ログイン履歴', icon: '📅' },
            { id: 'devices', label: 'デバイス管理', icon: '📱' },
            { id: 'alerts', label: 'セキュリティ通知', icon: '🚨' }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Score */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔒</span>
                  セキュリティスコア
                </h2>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-green-500 mb-2">85/100</div>
                  <div className="text-sm text-gray-600">良好なセキュリティレベルです</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-500">
                      {settings.twoFactorEnabled ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">二段階認証</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-500">
                      {settings.biometricEnabled ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">生体認証</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-500">✓</div>
                    <div className="text-sm text-gray-600">強力なパスワード</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-500">!</div>
                    <div className="text-sm text-gray-600">定期更新</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">アカウント状況</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">最終ログイン</h3>
                      <p className="text-sm text-gray-500">{settings.lastLogin}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">パスワード最終変更</h3>
                      <p className="text-sm text-gray-500">{settings.passwordLastChanged}</p>
                    </div>
                    <Button
                      onClick={() => setShowPasswordChange(true)}
                      variant="outline"
                      size="sm"
                    >
                      変更
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">アクティブセッション</h3>
                      <p className="text-sm text-gray-500">{settings.activeSessions} デバイス</p>
                    </div>
                    <Button
                      onClick={handleLogoutAllDevices}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      全ログアウト
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Security Activity */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📅</span>
                  最近のセキュリティアクティビティ
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {securityAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.severity === 'high' ? 'bg-red-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-800">{alert.message}</div>
                          <div className="text-sm text-gray-500">{alert.datetime}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {alert.severity === 'high' ? '高' :
                         alert.severity === 'medium' ? '中' : '低'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔐</span>
                  二段階認証
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">SMS認証</h3>
                    <p className="text-sm text-gray-500">ログイン時にSMSコードを要求</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.twoFactorEnabled ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">指紋・顔認証</h3>
                    <p className="text-sm text-gray-500">生体認証でログイン</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('biometricEnabled', !settings.biometricEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.biometricEnabled ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">セッション管理</h2>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">セッションタイムアウト</h3>
                      <p className="text-sm text-gray-500">自動ログアウトまでの時間</p>
                    </div>
                    <select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={15}>15分</option>
                      <option value={30}>30分</option>
                      <option value={60}>1時間</option>
                      <option value={120}>2時間</option>
                      <option value={0}>無期限</option>
                    </select>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">ログイン通知</h3>
                      <p className="text-sm text-gray-500">新しいデバイスからのログインを通知</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('loginNotifications', !settings.loginNotifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.loginNotifications ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">セキュリティ通知</h3>
                      <p className="text-sm text-gray-500">不審なアクティビティを検出時に通知</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('securityAlerts', !settings.securityAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.securityAlerts ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">不審なアクティビティ検出</h3>
                      <p className="text-sm text-gray-500">AIによる異常ログイン検出</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('suspiciousActivityDetection', !settings.suspiciousActivityDetection)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.suspiciousActivityDetection ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.suspiciousActivityDetection ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">データ暗号化</h3>
                      <p className="text-sm text-gray-500">保存データの暗号化を有効化</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('dataEncryption', !settings.dataEncryption)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.dataEncryption ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.dataEncryption ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📅</span>
                  ログイン履歴
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {loginHistory.map((login) => (
                  <div key={login.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          login.success ? (login.suspicious ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-800">
                            {login.device} • {login.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            {login.datetime} • {login.ipAddress}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          login.success ? (login.suspicious ? 'text-yellow-600' : 'text-green-600') : 'text-red-600'
                        }`}>
                          {login.success ? (login.suspicious ? '要注意' : '成功') : '失敗'}
                        </div>
                        {login.suspicious && (
                          <div className="text-xs text-yellow-600">不審なアクティビティ</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📱</span>
                  アクティブデバイス
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {activeDevices.map((device) => (
                  <div key={device.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {device.type === 'mobile' ? '📱' : device.type === 'tablet' ? '📟' : '💻'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 flex items-center">
                            {device.name}
                            {device.currentSession && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                現在のセッション
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.os} • {device.browser}
                          </div>
                          <div className="text-sm text-gray-500">
                            {device.location} • 最終アクティビティ: {device.lastActive}
                          </div>
                        </div>
                      </div>
                      {!device.currentSession && (
                        <Button
                          onClick={() => handleLogoutDevice(device.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          ログアウト
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🚨</span>
                  セキュリティアラート
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {securityAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 ${!alert.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.severity === 'high' ? 'bg-red-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className={`font-medium ${!alert.read ? 'text-blue-800' : 'text-gray-800'}`}>
                            {alert.message}
                          </div>
                          <div className="text-sm text-gray-500">{alert.datetime}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-medium ${
                          alert.severity === 'high' ? 'text-red-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {alert.severity === 'high' ? '高' :
                           alert.severity === 'medium' ? '中' : '低'}
                        </div>
                        {!alert.read && (
                          <Button
                            onClick={() => handleMarkAlertRead(alert.id)}
                            variant="outline"
                            size="sm"
                          >
                            既読
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">🔒</div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">セキュリティのヒント</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 強力なパスワードを使用する</li>
                    <li>• 二段階認証を有効にする</li>
                    <li>• 定期的にパスワードを変更する</li>
                    <li>• 不審なログインを監視する</li>
                    <li>• 使用していないデバイスからはログアウトする</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">パスワード変更</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  現在のパスワード
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード確認
                </label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                >
                  {changingPassword ? '変更中...' : '変更'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 