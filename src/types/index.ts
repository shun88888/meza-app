export interface Location {
  latitude: number
  longitude: number
  address?: string
}

export interface Challenge {
  id: string
  user_id: string
  target_time: string
  penalty_amount: number
  home_latitude: number
  home_longitude: number
  home_address: string
  target_latitude: number
  target_longitude: number
  target_address: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  payment_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface ChallengeFormData {
  targetTime: string
  penaltyAmount: number
  homeLocation: Location
  targetLocation: Location
}

export interface ChallengeStats {
  total: number
  completed: number
  failed: number
  totalPenalty: number
} 