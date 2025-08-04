'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/supabase'

function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Set yellow theme color for login page
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signInWithEmail(name, password)
      if (error) throw error
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Header with company name */}
      <div className="absolute top-8 left-8 z-10">
        <h2 className="text-lg font-semibold text-black">Aizen Finance</h2>
      </div>

      {/* Decorative animated element */}
      <div className="absolute top-16 right-8 z-10">
        <div className="w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path 
              d="M 20 50 Q 40 20, 60 50 T 100 50" 
              stroke="#FFD93D" 
              strokeWidth="8" 
              fill="none"
            />
            <circle cx="15" cy="50" r="10" fill="#FFD93D">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                from="0 15 50" 
                to="360 15 50" 
                dur="3s" 
                repeatCount="indefinite"
              />
            </circle>
            <g transform="translate(15, 50)">
              <circle cx="-10" cy="0" r="2" fill="#FFD93D"/>
              <circle cx="10" cy="0" r="2" fill="#FFD93D"/>
              <circle cx="0" cy="-10" r="2" fill="#FFD93D"/>
              <circle cx="0" cy="10" r="2" fill="#FFD93D"/>
              <circle cx="-7" cy="-7" r="2" fill="#FFD93D"/>
              <circle cx="7" cy="-7" r="2" fill="#FFD93D"/>
              <circle cx="-7" cy="7" r="2" fill="#FFD93D"/>
              <circle cx="7" cy="7" r="2" fill="#FFD93D"/>
            </g>
            <circle cx="100" cy="50" r="10" fill="#FFD93D">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                from="0 100 50" 
                to="360 100 50" 
                dur="3s" 
                repeatCount="indefinite"
              />
            </circle>
            <g transform="translate(100, 50)">
              <circle cx="-10" cy="0" r="2" fill="#FFD93D"/>
              <circle cx="10" cy="0" r="2" fill="#FFD93D"/>
              <circle cx="0" cy="-10" r="2" fill="#FFD93D"/>
              <circle cx="0" cy="10" r="2" fill="#FFD93D"/>
              <circle cx="-7" cy="-7" r="2" fill="#FFD93D"/>
              <circle cx="7" cy="-7" r="2" fill="#FFD93D"/>
              <circle cx="-7" cy="7" r="2" fill="#FFD93D"/>
              <circle cx="7" cy="7" r="2" fill="#FFD93D"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Yellow curved section */}
      <div 
        className="absolute bottom-0 left-0 w-full bg-yellow-400"
        style={{
          height: '60%',
          borderRadius: '40px 40px 0 0',
          clipPath: 'ellipse(100% 100% at 50% 100%)'
        }}
      ></div>

      {/* Main content container */}
      <div className="relative z-10 flex items-end justify-center min-h-screen">
        <div className="w-full max-w-sm px-8 pb-12">
          {/* Login content */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-black mb-3 leading-tight">Login</h1>
            <p className="text-gray-700 text-lg">Sign in to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field */}
            <div>
              <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jiara Martins"
                className="w-full px-5 py-4 bg-white rounded-xl border-0 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-5 py-4 bg-white rounded-xl border-0 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-4 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-900 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? '処理中...' : 'Log in'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-1">
            <p className="text-gray-700 text-sm">
              <Link href="/auth/forgot-password" className="hover:underline">
                Forgot Password?
              </Link>
            </p>
            <p className="text-gray-700 text-sm">
              <Link href="/signup" className="hover:underline">
                Signup !
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 