'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signUpWithEmail } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await signUpWithEmail(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        // Success - user will receive confirmation email
        alert('確認メールを送信しました。メールをご確認ください。')
        router.push('/auth/signin')
      }
    } catch (err) {
      setError('アカウント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">アカウント作成</h1>
            <p className="text-gray-600 mt-2">Mezaで新しい朝を始めましょう</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
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
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors"
                placeholder="6文字以上のパスワード"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors"
                placeholder="パスワードを再入力"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] hover:from-[#FF8A00] hover:to-[#FFAD2F] text-white font-semibold py-3 text-lg transition-all"
            >
              {loading ? 'アカウント作成中...' : 'アカウントを作成'}
            </Button>
          </form>

          {/* Terms and Privacy */}
          <p className="text-xs text-gray-500 text-center mt-6">
            アカウントを作成することで、
            <Link href="/terms" className="text-[#FFAD2F] hover:underline">利用規約</Link>
            および
            <Link href="/privacy" className="text-[#FFAD2F] hover:underline">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>

          {/* Sign In Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              すでにアカウントをお持ちですか？{' '}
              <Link 
                href={`/auth/signin${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                className="text-[#FFAD2F] font-semibold hover:underline"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}