import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChallengeData {
  target_time: string
  target_datetime?: string
  home_address: string
  home_latitude: number
  home_longitude: number
  target_address: string
  target_latitude: number
  target_longitude: number
  penalty_amount: number
  wake_up_location_address?: string
  wake_up_location_lat?: number
  wake_up_location_lng?: number
  start_immediately?: boolean
}

interface ChallengeResult {
  challenge: any
  started_immediately?: boolean
}

interface UseChallengeReturn {
  isCreating: boolean
  isStarting: boolean
  error: string | null
  createChallenge: (data: ChallengeData) => Promise<ChallengeResult | null>
  startChallenge: (challengeId: string, targetDatetime: string) => Promise<boolean>
}

export function useChallenge(): UseChallengeReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const createChallenge = async (data: ChallengeData): Promise<ChallengeResult | null> => {
    try {
      setIsCreating(true)
      setError(null)

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create challenge')
      }

      const result = await response.json()
      
      // 即座開始された場合、チャレンジページにリダイレクト
      if (result.started_immediately && result.challenge.status === 'active') {
        router.push(`/challenge/${result.challenge.id}`)
      }

      return result
    } catch (err) {
      console.error('Error creating challenge:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsCreating(false)
    }
  }

  const startChallenge = async (challengeId: string, targetDatetime: string): Promise<boolean> => {
    try {
      setIsStarting(true)
      setError(null)

      const response = await fetch('/api/challenges/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          target_datetime: targetDatetime,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start challenge')
      }

      const result = await response.json()
      
      if (result.success) {
        // 開始成功時、チャレンジページにリダイレクト
        router.push(`/challenge/${challengeId}`)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error starting challenge:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsStarting(false)
    }
  }

  return {
    isCreating,
    isStarting,
    error,
    createChallenge,
    startChallenge,
  }
}

// チャレンジ完了用のカスタムフック
export function useChallengeCompletion() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitSuccess = async (
    challengeId: string,
    currentLat: number,
    currentLng: number,
    currentAddress?: string,
    evidenceRef?: string
  ) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_lat: currentLat,
          current_lng: currentLng,
          current_address: currentAddress,
          evidence_ref: evidenceRef,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit challenge success')
      }

      const result = await response.json()
      return result
    } catch (err) {
      console.error('Error submitting challenge success:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    error,
    submitSuccess,
  }
}