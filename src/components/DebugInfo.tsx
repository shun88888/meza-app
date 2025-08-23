'use client'

import { useState, useEffect } from 'react'

export default function DebugInfo() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/stripe')
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
      } else {
        console.error('Debug API failed:', response.status)
      }
    } catch (error) {
      console.error('Debug fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  if (!debugData) return null

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      <div className="space-y-1">
        <div>Environment: {debugData.NODE_ENV}</div>
        <div>Stripe Secret Key: {debugData.STRIPE_SECRET_KEY_EXISTS ? '✅' : '❌'}</div>
        <div>Stripe Publishable Key: {debugData.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_EXISTS ? '✅' : '❌'}</div>
        <div>Supabase URL: {debugData.SUPABASE_URL_EXISTS ? '✅' : '❌'}</div>
        <div>Supabase Service Key: {debugData.SUPABASE_SERVICE_ROLE_KEY_EXISTS ? '✅' : '❌'}</div>
        {debugData.STRIPE_SECRET_KEY_PREFIX && (
          <div>Secret Key Prefix: {debugData.STRIPE_SECRET_KEY_PREFIX}</div>
        )}
        {debugData.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PREFIX && (
          <div>Pub Key Prefix: {debugData.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PREFIX}</div>
        )}
      </div>
    </div>
  )
}