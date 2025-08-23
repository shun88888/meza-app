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
          default_payment_method: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          default_payment_method?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          default_payment_method?: string | null
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
          status: 'pending' | 'created' | 'active' | 'completed' | 'succeeded' | 'failed' | 'failed_timeout' | 'failed_payment'
          started_at: string | null
          completed_at: string | null
          ends_at: string | null
          evidence_ref: string | null
          payment_intent_id: string | null
          completion_lat: number | null
          completion_lng: number | null
          completion_address: string | null
          distance_to_target: number | null
          wake_up_location_address: string | null
          wake_up_location_lat: number | null
          wake_up_location_lng: number | null
          home_lat: number | null
          home_lng: number | null
          target_lat: number | null
          target_lng: number | null
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
          status?: 'pending' | 'created' | 'active' | 'completed' | 'succeeded' | 'failed' | 'failed_timeout' | 'failed_payment'
          started_at?: string | null
          completed_at?: string | null
          ends_at?: string | null
          evidence_ref?: string | null
          payment_intent_id?: string | null
          completion_lat?: number | null
          completion_lng?: number | null
          completion_address?: string | null
          distance_to_target?: number | null
          wake_up_location_address?: string | null
          wake_up_location_lat?: number | null
          wake_up_location_lng?: number | null
          home_lat?: number | null
          home_lng?: number | null
          target_lat?: number | null
          target_lng?: number | null
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
          status?: 'pending' | 'created' | 'active' | 'completed' | 'succeeded' | 'failed' | 'failed_timeout' | 'failed_payment'
          started_at?: string | null
          completed_at?: string | null
          ends_at?: string | null
          evidence_ref?: string | null
          payment_intent_id?: string | null
          completion_lat?: number | null
          completion_lng?: number | null
          completion_address?: string | null
          distance_to_target?: number | null
          wake_up_location_address?: string | null
          wake_up_location_lat?: number | null
          wake_up_location_lng?: number | null
          home_lat?: number | null
          home_lng?: number | null
          target_lat?: number | null
          target_lng?: number | null
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
          status: 'pending' | 'completed' | 'succeeded' | 'failed' | 'requires_action' | 'processing'
          created_at: string
          updated_at: string
          idempotency_key: string | null
          webhook_received_at: string | null
          stripe_customer_id: string | null
          requires_action: boolean
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          amount: number
          stripe_payment_intent_id: string
          status?: 'pending' | 'completed' | 'succeeded' | 'failed' | 'requires_action' | 'processing'
          created_at?: string
          updated_at?: string
          idempotency_key?: string | null
          webhook_received_at?: string | null
          stripe_customer_id?: string | null
          requires_action?: boolean
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          amount?: number
          stripe_payment_intent_id?: string
          status?: 'pending' | 'completed' | 'succeeded' | 'failed' | 'requires_action' | 'processing'
          created_at?: string
          updated_at?: string
          idempotency_key?: string | null
          webhook_received_at?: string | null
          stripe_customer_id?: string | null
          requires_action?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: 'general' | 'challenge' | 'reminder'
          is_read: boolean
          push_sent: boolean
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type?: 'general' | 'challenge' | 'reminder'
          is_read?: boolean
          push_sent?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          type?: 'general' | 'challenge' | 'reminder'
          is_read?: boolean
          push_sent?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          push_notifications_enabled: boolean
          reminder_enabled: boolean
          reminder_minutes_before: number
          theme: 'light' | 'dark' | 'auto'
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          push_notifications_enabled?: boolean
          reminder_enabled?: boolean
          reminder_minutes_before?: number
          theme?: 'light' | 'dark' | 'auto'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          push_notifications_enabled?: boolean
          reminder_enabled?: boolean
          reminder_minutes_before?: number
          theme?: 'light' | 'dark' | 'auto'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh_key?: string
          auth_key?: string
          user_agent?: string | null
          is_active?: boolean
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
      complete_challenge: {
        Args: {
          challenge_id: string
          completion_lat_param: number
          completion_lng_param: number
          completion_address_param?: string
        }
        Returns: {
          success: boolean
          distance_to_target: number
          within_range: boolean
        }[]
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