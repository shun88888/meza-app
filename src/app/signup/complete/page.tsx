'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupCompletePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to onboarding after 5 seconds
    const timer = setTimeout(() => {
      router.push('/onboarding')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          アカウント作成完了！
        </h1>
        <p className="text-gray-600 mb-8">
          Mezaアプリへようこそ！<br />
          メール認証が完了し、アカウントが正常に作成されました。
        </p>

        {/* Success Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">アカウント認証済み</span>
          </div>
          <ul className="text-green-700 text-sm space-y-1">
            <li>✓ メールアドレス認証完了</li>
            <li>✓ アカウント情報登録完了</li>
            <li>✓ ログイン可能</li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">次のステップ</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-medium text-blue-900">初期設定</h3>
                <p className="text-blue-700 text-sm">プロフィールと決済方法を設定します</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-medium text-blue-900">チュートリアル</h3>
                <p className="text-blue-700 text-sm">アプリの使い方を学びます</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start text-left">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-medium text-blue-900">チャレンジ開始</h3>
                <p className="text-blue-700 text-sm">初回の起床チャレンジに挑戦</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            初期設定を始める
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            後で設定する（ホームへ）
          </button>
        </div>

        {/* Auto redirect notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            5秒後に自動的に初期設定画面に移動します
          </p>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            ご不明な点がございましたら
            <Link href="/help" className="text-[#FFAD2F] hover:underline ml-1">
              ヘルプセンター
            </Link>
            をご確認ください
          </p>
        </div>
      </div>
    </div>
  )
}