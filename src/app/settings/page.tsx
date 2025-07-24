'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { FaqSection } from "@/components/ui/faq"
import { 
  User, 
  HelpCircle, 
  LogOut, 
  Mail, 
  Calendar, 
  CreditCard,
  ChevronRight,
  ArrowDownLeft,
  Settings,
  Shield,
  Bell,
  Lock,
  Info,
  FileText,
  Eye,
  DollarSign,
  Smartphone
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: "Mezaとは何ですか？",
    answer: "Mezaは早起きを習慣化するための起床チャレンジアプリです。設定した時間に起きて、100m以上移動することで成功となります。失敗した場合は事前に設定したペナルティ金額が自動で決済されるため、強制的に早起きの習慣を身につけることができます。"
  },
  {
    question: "チャレンジはどのように機能しますか？",
    answer: "まず起床時間とペナルティ金額を設定してチャレンジを作成します。チャレンジが始まると、設定した時間に起きて、スマートフォンのGPS機能を使って100m以上移動したことを証明する必要があります。移動距離が足りない場合は失敗となり、ペナルティが発生します。"
  },
  {
    question: "料金はかかりますか？",
    answer: "アプリの基本利用は無料です。ただし、チャレンジに失敗した場合のみ、事前に設定したペナルティ金額が決済されます。成功し続ける限り、費用は発生しません。クレジットカードの登録は必要ですが、これは失敗時のペナルティ決済のためです。"
  },
  {
    question: "位置情報はどのように使用されますか？",
    answer: "位置情報は、あなたがベッドから起き上がって実際に移動したことを証明するためにのみ使用されます。プライバシーを重視しており、位置データは暗号化され、チャレンジの検証以外の目的で使用されることはありません。"
  },
  {
    question: "チャレンジに失敗した場合、返金はありますか？",
    answer: "チャレンジの公平性を保つため、正当な理由で失敗した場合の返金は基本的にありません。ただし、アプリの技術的な問題によって失敗した場合や、システムエラーが原因の場合は個別に対応いたします。"
  },
  {
    question: "一日に複数のチャレンジを設定できますか？",
    answer: "現在のところ、一度に設定できるのは一つのチャレンジのみです。これは集中力を保ち、習慣化を効果的に行うためです。チャレンジを完了または失敗した後、新しいチャレンジを設定することができます。"
  },
  {
    question: "データの安全性は保証されていますか？",
    answer: "はい、すべてのデータは業界標準の暗号化技術を使用して保護されています。決済情報はStripeを通じて安全に処理され、位置情報は匿名化されて保存されます。個人データが第三者に販売されることは一切ありません。"
  },
  {
    question: "アプリが動作しない場合はどうすればよいですか？",
    answer: "まず、アプリを再起動し、インターネット接続を確認してください。それでも問題が解決しない場合は、アプリ内の「サポート」または「お問い合わせ」からご連絡ください。技術的な問題によるチャレンジの失敗は適切に対応いたします。"
  }
]

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'main' | 'help'>('main')
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

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleContact = () => {
    alert('お問い合わせ機能は準備中です。support@meza.app までご連絡ください。')
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
              onClick={() => activeSection === 'help' ? setActiveSection('main') : router.push('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {activeSection === 'help' ? (
                <ChevronRight size={20} className="rotate-180 text-gray-600 dark:text-gray-400" />
              ) : (
                <ArrowDownLeft size={20} className="text-gray-600 dark:text-gray-400 rotate-45" />
              )}
            </button>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              {activeSection === 'help' ? 'ヘルプ' : '設定'}
            </h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Main Settings */}
        {activeSection === 'main' && (
          <div className="p-4 pb-6">
            {/* Profile Section */}
            {user && (
              <div className="mb-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        アカウント設定を管理
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">アカウント</h2>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/settings/account')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">アカウント情報</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">プロフィール情報を更新</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/settings/notifications')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Bell size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">通知設定</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">プッシュ通知を管理</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/settings/payment')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <CreditCard size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">決済方法</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">カード情報を管理</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">プライバシー</h2>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/settings/security')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Shield size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">セキュリティ</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">パスワード変更など</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/settings/privacy')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Eye size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">プライバシー</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">データの使用方法</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Support Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">サポート</h2>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveSection('help')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <HelpCircle size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">ヘルプ</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">よくある質問</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/settings/about')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Info size={20} className="text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">アプリについて</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">バージョン情報</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <LogOut size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-red-600 dark:text-red-400 text-sm">ログアウト</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">アカウントからサインアウト</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        {activeSection === 'help' && (
          <div className="p-4">
            <FaqSection
              title=""
              description="Mezaアプリの使い方や機能について、よくお寄せいただく質問にお答えします"
              items={FAQ_ITEMS}
              contactInfo={{
                title: "他にご質問がございますか？",
                description: "お困りのことがあれば、お気軽にお問い合わせください",
                buttonText: "サポートに連絡",
                onContact: handleContact
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}