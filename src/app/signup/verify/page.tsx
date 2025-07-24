'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientSideClient } from '@/lib/supabase'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClientSideClient()
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Get email from localStorage (set in signup page)
    const signupEmail = localStorage.getItem('signupEmail')
    if (signupEmail) {
      setEmail(signupEmail)
    } else {
      // Redirect to signup if no email found
      router.push('/signup')
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!verificationCode.trim()) {
      setError('認証コードを入力してください')
      return
    }

    if (verificationCode.length !== 6) {
      setError('認証コードは6桁で入力してください')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email',
      })

      if (error) {
        throw error
      }

      // Clear stored email
      localStorage.removeItem('signupEmail')
      
      // Redirect to signup complete page
      router.push('/signup/complete')
    } catch (error) {
      console.error('Verification failed:', error)
      setError('認証コードが正しくありません。もう一度確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccessMessage('')
    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error
      }
      
      setSuccessMessage('認証コードを再送信しました。メールをご確認ください。')
    } catch (error) {
      console.error('Resend failed:', error)
      setError('認証コードの再送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FFAD2F] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">メール認証</h1>
          <p className="text-gray-600">
            以下のメールアドレスに認証コードを送信しました
          </p>
          <p className="font-medium text-gray-900 mt-2">{email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Verification Code */}
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              認証コード（6桁）
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                setVerificationCode(value)
                setError('')
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFAD2F] focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456"
              maxLength={6}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || verificationCode.length !== 6}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading || verificationCode.length !== 6
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#FFAD2F] hover:bg-[#FF9A1F] text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                認証中...
              </div>
            ) : (
              'メール認証を完了'
            )}
          </button>
        </form>

        {/* Resend and Help */}
        <div className="mt-6 text-center space-y-4">
          <div>
            <p className="text-gray-600 text-sm mb-2">
              認証コードが届かない場合
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className={`text-[#FFAD2F] hover:underline text-sm ${
                isResending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isResending ? '送信中...' : '認証コードを再送信'}
            </button>
          </div>

          <div className="text-gray-500 text-xs">
            <p>メールが届かない場合は、迷惑メールフォルダもご確認ください</p>
          </div>

          <div>
            <Link href="/signup" className="text-gray-600 hover:text-gray-800 text-sm">
              ← 会員登録に戻る
            </Link>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm text-center">
            <strong>デモ用:</strong> 認証コードに「123456」を入力してください
          </p>
        </div>
      </div>
    </div>
  )
}