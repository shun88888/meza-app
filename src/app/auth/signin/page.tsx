'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signInWithEmail } from '@/lib/supabase'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    try {
      const { error } = await signInWithEmail(email, password)
      
      if (error) {
        setAuthError(error.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err) {
      setAuthError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Display URL error messages
  const displayError = error || authError
  const displayMessage = message

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">おかえりなさい</h1>
            <p className="text-gray-600 mt-2">Mezaにログインして続きを始めましょう</p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{displayError}</p>
            </div>
          )}

          {/* Success Message */}
          {displayMessage && !displayError && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-green-600 text-sm">{displayMessage}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors"
                placeholder="パスワード"
              />
            </div>

            <div className="flex justify-end">
              <Link 
                href="/auth/reset-password"
                className="text-sm text-[#FFAD2F] hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] hover:from-[#FF8A00] hover:to-[#FFAD2F] text-white font-semibold py-3 text-lg transition-all"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          {/* Demo Mode */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              デモモードで試す
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link 
                href={`/auth/signup${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                className="text-[#FFAD2F] font-semibold hover:underline"
              >
                アカウント作成
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}