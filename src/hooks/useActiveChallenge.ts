import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'

interface ActiveChallenge {
  id: string
  target_time: string
  ends_at: string
  penalty_amount: number
  home_latitude: number
  home_longitude: number
  home_address: string
  target_latitude: number
  target_longitude: number
  target_address: string
  status: string
  started_at: string
  created_at: string
  time_remaining_seconds: number
  isExpired: boolean
}

interface UseActiveChallengeReturn {
  activeChallenge: ActiveChallenge | null
  hasActiveChallenge: boolean
  isLoading: boolean
  error: string | null
  checkActiveChallenge: () => Promise<void>
  timeRemaining: number
  isExpired: boolean
}

export function useActiveChallenge(): UseActiveChallengeReturn {
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null)
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExpired, setIsExpired] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const checkActiveChallenge = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/challenges/active', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch active challenge')
      }

      const data = await response.json()

      if (data.hasActiveChallenge && data.challenge) {
        setActiveChallenge(data.challenge)
        setHasActiveChallenge(true)
        setTimeRemaining(data.challenge.time_remaining_seconds || 0)
        setIsExpired(data.challenge.isExpired || false)
      } else {
        setActiveChallenge(null)
        setHasActiveChallenge(false)
        setTimeRemaining(0)
        setIsExpired(false)
      }
    } catch (err) {
      console.error('Error checking active challenge:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setActiveChallenge(null)
      setHasActiveChallenge(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // リアルタイム更新のためのタイマー
  useEffect(() => {
    if (hasActiveChallenge && activeChallenge && !isExpired) {
      const interval = setInterval(() => {
        const now = new Date()
        const endsAt = new Date(activeChallenge.ends_at)
        const remaining = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000))
        
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          setIsExpired(true)
          clearInterval(interval)
          // 時間切れの場合、再チェック
          checkActiveChallenge()
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [hasActiveChallenge, activeChallenge, isExpired, checkActiveChallenge])

  // 初回チェック
  useEffect(() => {
    checkActiveChallenge()
  }, [checkActiveChallenge])

  // Supabaseリアルタイム購読（オプション）
  useEffect(() => {
    if (!hasActiveChallenge || !activeChallenge) return

    const channel = supabase
      .channel('active_challenge_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${activeChallenge.id}`,
        },
        (payload) => {
          console.log('Challenge updated:', payload)
          // チャレンジが更新された場合、再チェック
          checkActiveChallenge()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, hasActiveChallenge, activeChallenge, checkActiveChallenge])

  return {
    activeChallenge,
    hasActiveChallenge,
    isLoading,
    error,
    checkActiveChallenge,
    timeRemaining,
    isExpired,
  }
}

// 自動リダイレクト用のカスタムフック
export function useActiveChallengeRedirect(enabled: boolean = true) {
  const { hasActiveChallenge, activeChallenge, isLoading } = useActiveChallenge()
  const router = useRouter()

  useEffect(() => {
    if (!enabled || isLoading || !hasActiveChallenge || !activeChallenge) {
      return
    }

    // アクティブチャレンジがある場合、チャレンジページにリダイレクト
    const currentPath = window.location.pathname
    const challengePath = `/challenge/${activeChallenge.id}`
    
    if (currentPath !== challengePath) {
      console.log('Redirecting to active challenge:', challengePath)
      router.push(challengePath)
    }
  }, [enabled, isLoading, hasActiveChallenge, activeChallenge, router])

  return {
    hasActiveChallenge,
    activeChallenge,
    isLoading,
  }
}