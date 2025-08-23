import { useState, useCallback } from 'react'

interface EvidenceData {
  evidence_type: 'photo' | 'gps' | 'qr_code' | 'manual' | 'combined'
  evidence_data: any
  metadata?: Record<string, any>
}

interface EvidenceResult {
  challenge_id: string
  status: string
  evidence: any
  completion_address: string
  completed_at: string
  has_evidence: boolean
}

interface UseEvidenceReturn {
  isLoading: boolean
  isSaving: boolean
  error: string | null
  getEvidence: (challengeId: string) => Promise<EvidenceResult | null>
  saveEvidence: (challengeId: string, data: EvidenceData) => Promise<boolean>
}

export function useEvidence(): UseEvidenceReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getEvidence = useCallback(async (challengeId: string): Promise<EvidenceResult | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/challenges/${challengeId}/evidence`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch evidence')
      }

      const result = await response.json()
      return result
    } catch (err) {
      console.error('Error fetching evidence:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveEvidence = useCallback(async (challengeId: string, data: EvidenceData): Promise<boolean> => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/challenges/${challengeId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save evidence')
      }

      return true
    } catch (err) {
      console.error('Error saving evidence:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    isLoading,
    isSaving,
    error,
    getEvidence,
    saveEvidence,
  }
}

// 写真証跡用のヘルパーフック
export function usePhotoEvidence() {
  const { saveEvidence, isSaving, error } = useEvidence()

  const savePhotoEvidence = useCallback(async (
    challengeId: string,
    photoData: string, // base64 or file path
    location?: { lat: number, lng: number },
    description?: string
  ): Promise<boolean> => {
    const evidenceData = {
      evidence_type: 'photo' as const,
      evidence_data: {
        photo: photoData,
        location: location,
        description: description,
        captured_at: new Date().toISOString(),
      },
      metadata: {
        device_info: navigator.userAgent,
        timestamp: Date.now(),
      },
    }

    return await saveEvidence(challengeId, evidenceData)
  }, [saveEvidence])

  return {
    savePhotoEvidence,
    isSaving,
    error,
  }
}

// GPS証跡用のヘルパーフック
export function useGPSEvidence() {
  const { saveEvidence, isSaving, error } = useEvidence()

  const saveGPSEvidence = useCallback(async (
    challengeId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
    address?: string
  ): Promise<boolean> => {
    const evidenceData = {
      evidence_type: 'gps' as const,
      evidence_data: {
        latitude,
        longitude,
        accuracy: accuracy || null,
        address: address || null,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        geolocation_api_used: true,
        user_agent: navigator.userAgent,
      },
    }

    return await saveEvidence(challengeId, evidenceData)
  }, [saveEvidence])

  const getCurrentLocationEvidence = useCallback(async (challengeId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported')
        resolve(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const success = await saveGPSEvidence(challengeId, latitude, longitude, accuracy)
          resolve(success)
        },
        (error) => {
          console.error('Geolocation error:', error)
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }, [saveGPSEvidence])

  return {
    saveGPSEvidence,
    getCurrentLocationEvidence,
    isSaving,
    error,
  }
}

// QRコード証跡用のヘルパーフック
export function useQREvidence() {
  const { saveEvidence, isSaving, error } = useEvidence()

  const saveQREvidence = useCallback(async (
    challengeId: string,
    qrData: string,
    scannedAt: string,
    location?: { lat: number, lng: number }
  ): Promise<boolean> => {
    const evidenceData = {
      evidence_type: 'qr_code' as const,
      evidence_data: {
        qr_data: qrData,
        scanned_at: scannedAt,
        location: location,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        scanner_type: 'web_api',
        user_agent: navigator.userAgent,
      },
    }

    return await saveEvidence(challengeId, evidenceData)
  }, [saveEvidence])

  return {
    saveQREvidence,
    isSaving,
    error,
  }
}