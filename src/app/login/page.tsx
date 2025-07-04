'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase'

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Set white theme color for login page
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#ffffff'
      document.head.appendChild(meta)
    }
  }, [])
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
      } else {
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
      }
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // デモ用の簡単ログイン
  const handleDemoLogin = () => {
    localStorage.setItem('demo-user', JSON.stringify({ email: 'demo@example.com' }))
    router.push('/')
  }

  return (
    <div className="h-screen-mobile w-full max-w-full overflow-hidden bg-gray-50 flex items-center justify-center px-4 fixed inset-0">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Meza</h1>
          <p className="mt-2 text-gray-600">
            位置ベースペナルティアラームアプリ
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* デモ用ボタン */}
          <div className="mb-6">
            <Button
              onClick={handleDemoLogin}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              🚀 デモでログイン（すぐに試す）
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              開発用：実際のログインなしでアプリを体験
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                  isLogin
                    ? 'bg-timee-orange text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                ログイン
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                  !isLogin
                    ? 'bg-timee-orange text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                新規登録
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-timee-orange hover:bg-timee-orange-dark"
              >
                {loading ? '処理中...' : isLogin ? 'ログイン' : '新規登録'}
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>
            継続してご利用いただくことで、
            <br />
            利用規約とプライバシーポリシーに同意したものとみなします。
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 