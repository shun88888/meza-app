'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientSideClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
    // Initialize Supabase client after component mounts
    const client = createClientSideClient()
    setSupabaseClient(client)
  }, [])

  // Set yellow theme color for signup page
  useEffect(() => {
    if (!isClient) return
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#F5D916')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#F5D916'
      document.head.appendChild(meta)
    }
  }, [isClient])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'パスワードは6文字以上で入力してください'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = '生年月日を選択してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized')
      }
      
      const { error } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            date_of_birth: formData.dateOfBirth,
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
      
      // Store email for verification
      localStorage.setItem('signupEmail', formData.email)
      
      // Redirect to verification page
      router.push('/signup/verify')
    } catch (error) {
      console.error('Signup failed:', error)
      setErrors({ general: 'アカウント作成に失敗しました。もう一度お試しください。' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Show loading state while client is not ready
  if (!isClient || !supabaseClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            読み込み中...
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/login">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </div>
        </Link>
      </div>

      {/* Bottom curved yellow section */}
      <div 
        className="absolute bottom-0 left-0 w-full bg-yellow-400"
        style={{
          height: '25%',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0'
        }}
      ></div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-sm px-8">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-black mb-1 leading-tight">Create new</h1>
            <h2 className="text-4xl font-bold text-black mb-4 leading-tight">Account</h2>
            <p className="text-gray-600 text-sm">
              Already Registered? <Link href="/login" className="text-black font-medium hover:underline">Log in here.</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Name field */}
            <div>
              <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">NAME</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Jiara Martins"
                className={`w-full px-5 py-4 bg-gray-200 rounded-xl border-0 text-black placeholder-gray-600 focus:outline-none focus:bg-gray-300 transition-all duration-200 ${
                  errors.name ? 'bg-red-100 ring-2 ring-red-400' : ''
                }`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">EMAIL</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="hello@reallygreatsite.com"
                className={`w-full px-5 py-4 bg-gray-200 rounded-xl border-0 text-black placeholder-gray-600 focus:outline-none focus:bg-gray-300 transition-all duration-200 ${
                  errors.email ? 'bg-red-100 ring-2 ring-red-400' : ''
                }`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">PASSWORD</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••"
                className={`w-full px-5 py-4 bg-gray-200 rounded-xl border-0 text-black placeholder-gray-600 focus:outline-none focus:bg-gray-300 transition-all duration-200 ${
                  errors.password ? 'bg-red-100 ring-2 ring-red-400' : ''
                }`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Date of Birth field */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">DATE OF BIRTH</label>
              <div className="relative">
                <select
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-200 rounded-xl border-0 text-black appearance-none focus:outline-none focus:bg-gray-300 transition-all duration-200 ${
                    errors.dateOfBirth ? 'bg-red-100 ring-2 ring-red-400' : ''
                  } ${!formData.dateOfBirth ? 'text-gray-600' : ''}`}
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="2005">2005年生まれ</option>
                  <option value="2004">2004年生まれ</option>
                  <option value="2003">2003年生まれ</option>
                  <option value="2002">2002年生まれ</option>
                  <option value="2001">2001年生まれ</option>
                  <option value="2000">2000年生まれ</option>
                  <option value="1999">1999年生まれ</option>
                  <option value="1998">1998年生まれ</option>
                  <option value="1997">1997年生まれ</option>
                  <option value="1996">1996年生まれ</option>
                  <option value="1995">1995年生まれ</option>
                  <option value="1994">1994年生まれ</option>
                  <option value="1993">1993年生まれ</option>
                  <option value="1992">1992年生まれ</option>
                  <option value="1991">1991年生まれ</option>
                  <option value="1990">1990年生まれ</option>
                  <option value="other">その他</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
            </div>

            {/* Sign up button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 py-4 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-900 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  作成中...
                </div>
              ) : (
                'Sign up'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}