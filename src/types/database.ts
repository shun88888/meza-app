export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
        }
      }
      challenges: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          target_time: string
          penalty_amount: number
          home_latitude: number
          home_longitude: number
          home_address: string
          target_latitude: number
          target_longitude: number
          target_address: string
          status?: 'pending' | 'active' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_time?: string
          penalty_amount?: number
          home_latitude?: number
          home_longitude?: number
          home_address?: string
          target_latitude?: number
          target_longitude?: number
          target_address?: string
          status?: 'pending' | 'active' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          amount: number
          stripe_payment_intent_id: string
          status: 'pending' | 'succeeded' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          amount: number
          stripe_payment_intent_id: string
          status?: 'pending' | 'succeeded' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          amount?: number
          stripe_payment_intent_id?: string
          status?: 'pending' | 'succeeded' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number
          lon1: number
          lat2: number
          lon2: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 