'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      alert('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
    } catch (error) {
      console.error('Password reset failed:', error)
      alert('パスワードの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (success) {
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
              パスワードを変更しました
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              新しいパスワードでログインできるようになりました。
              セキュリティのため、他のデバイスからは自動的にログアウトされます。
            </p>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              ログインする
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
            新しいパスワードを設定
          </h1>
          <p className="text-gray-600">
            新しいパスワードを入力してください。
            セキュリティのため、強力なパスワードを使用してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上で入力"
              required
              minLength={8}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              英数字を含む8文字以上で入力してください
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード確認
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
              required
              className="w-full"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">パスワードの要件</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 8文字以上</li>
              <li>• 英数字を含む</li>
              <li>• 特殊文字を含むことを推奨</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50"
          >
            {loading ? '変更中...' : 'パスワードを変更'}
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