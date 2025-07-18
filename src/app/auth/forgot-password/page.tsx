'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSent(true)
    } catch (error) {
      console.error('Password reset failed:', error)
      alert('パスワードリセットに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex flex-col">
        {/* Header */}
        <div className="p-6 pt-safe">
          <button
            onClick={handleBackToLogin}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              メールを送信しました
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {email} にパスワードリセット用のリンクを送信しました。
              メールを確認して、新しいパスワードを設定してください。
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-700">
                📧 メールが届かない場合は、迷惑メールフォルダも確認してください。
              </p>
            </div>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              ログイン画面に戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex flex-col">
      {/* Header */}
      <div className="p-6 pt-safe">
        <button
          onClick={handleBackToLogin}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
          aria-label="戻る"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            パスワードを忘れた方
          </h1>
          <p className="text-gray-600">
            登録したメールアドレスを入力してください。
            パスワードリセット用のリンクを送信します。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50"
          >
            {loading ? '送信中...' : 'リセットリンクを送信'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </div>
  )
} 