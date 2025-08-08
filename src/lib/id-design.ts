/**
 * ID設計とデータモデル定義
 * 前提整備：challenge_id を全イベントの主キーに紐付け（冪等性キーにも利用）
 */

// 基本ID型定義
export type UserId = string // UUID v4
export type ChallengeId = string // UUID v4 - 全イベントの主キー
export type PaymentIntentId = string // Stripe PI_xxx
export type PaymentMethodId = string // Stripe pm_xxx
export type NotificationId = string // UUID v4

// チャレンジ状態の厳密な型定義
export type ChallengeStatus = 'scheduled' | 'active' | 'success' | 'fail' | 'settled'

// 冪等性キー生成ユーティリティ
export class IdempotencyKeys {
  /**
   * チャレンジベースの冪等性キー生成
   */
  static challenge(challengeId: ChallengeId, operation: string): string {
    return `challenge_${challengeId}_${operation}`
  }
  
  /**
   * 決済用冪等性キー生成
   */
  static payment(challengeId: ChallengeId, operation: 'create' | 'confirm' | 'retry'): string {
    return `payment_${challengeId}_${operation}`
  }
  
  /**
   * 通知用冪等性キー生成
   */
  static notification(challengeId: ChallengeId, kind: NotificationKind): string {
    return `notification_${challengeId}_${kind}`
  }
  
  /**
   * 位置情報取得用冪等性キー生成
   */
  static locationPing(challengeId: ChallengeId, timestamp: number): string {
    return `location_${challengeId}_${timestamp}`
  }
}

// データモデル型定義（最小構成）

/**
 * Challenge テーブル
 */
export interface Challenge {
  id: ChallengeId
  user_id: UserId
  start_at: string // UTC ISO string
  end_at: string // UTC ISO string
  status: ChallengeStatus
  target_meters: number // デフォルト100
  penalty_amount: number // ペナルティ金額（セント単位）
  
  // 位置情報
  home_location: {
    lat: number
    lng: number
  }
  target_location: {
    lat: number
    lng: number
  }
  home_address: string
  target_address: string
  
  // メタデータ
  created_at: string // UTC ISO string
  updated_at: string // UTC ISO string
}

/**
 * LocationPing テーブル
 */
export interface LocationPing {
  id: string
  challenge_id: ChallengeId
  lat: number
  lng: number
  accuracy: number // GPS精度（メートル）
  timestamp: string // UTC ISO string
  source: 'gps' | 'network' | 'qr' | 'manual' // 位置情報の取得方法
  
  // 品質管理用
  is_valid: boolean // 品質フィルタを通過したか
  movement_from_previous: number // 前回からの移動距離（メートル）
  
  created_at: string // UTC ISO string
}

/**
 * PaymentLog テーブル
 */
export interface PaymentLog {
  id: string
  challenge_id: ChallengeId
  user_id: UserId
  payment_intent_id: PaymentIntentId
  payment_method_id?: PaymentMethodId
  
  amount: number // セント単位
  currency: string // 'jpy'
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  
  // Stripe関連
  receipt_url?: string
  failure_code?: string
  failure_message?: string
  
  // リトライ管理
  retry_count: number
  next_retry_at?: string // UTC ISO string
  max_retries: number // デフォルト3
  
  created_at: string // UTC ISO string
  updated_at: string // UTC ISO string
}

/**
 * NotificationLog テーブル
 */
export type NotificationKind = 'reminder_30min' | 'reminder_5min' | 'challenge_start' | 'challenge_end' | 'success' | 'failure' | 'payment_success' | 'payment_failed'

export interface NotificationLog {
  id: NotificationId
  challenge_id: ChallengeId
  user_id: UserId
  
  kind: NotificationKind
  title: string
  body: string
  
  // 配信状態
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  push_token?: string
  scheduled_at: string // UTC ISO string
  sent_at?: string // UTC ISO string
  
  // メタデータ
  platform: 'web' | 'ios' | 'android'
  
  created_at: string // UTC ISO string
}

/**
 * User Profile 拡張
 */
export interface UserProfile {
  id: UserId
  email: string
  
  // Stripe関連
  stripe_customer_id?: string
  default_payment_method_id?: PaymentMethodId
  
  // 設定
  timezone: string // デフォルト Asia/Tokyo
  notification_enabled: boolean
  location_permission_granted: boolean
  
  // 安全設定
  monthly_penalty_limit: number // 月間ペナルティ上限（セント単位）
  warning_before_charge: boolean
  
  created_at: string // UTC ISO string
  updated_at: string // UTC ISO string
}

// API レスポンス型定義

/**
 * チャレンジ作成リクエスト
 */
export interface CreateChallengeRequest {
  wake_time_local: string // 'HH:mm' 形式
  penalty_amount: number // セント単位
  home_location: { lat: number; lng: number }
  target_location: { lat: number; lng: number }
  home_address: string
  target_address: string
}

/**
 * チャレンジ作成レスポンス
 */
export interface CreateChallengeResponse {
  challenge: Challenge
  payment_setup_required: boolean
  setup_intent_client_secret?: string
}

/**
 * 位置情報送信リクエスト
 */
export interface LocationPingRequest {
  challenge_id: ChallengeId
  lat: number
  lng: number
  accuracy: number
  timestamp: string // UTC ISO string
  source: LocationPing['source']
}

/**
 * チャレンジ判定レスポンス
 */
export interface ChallengeJudgmentResponse {
  challenge_id: ChallengeId
  status: ChallengeStatus
  success: boolean
  total_distance_moved: number
  judgment_time: string // UTC ISO string
  payment_required: boolean
  payment_intent_id?: PaymentIntentId
}

// ユーティリティ関数

/**
 * UUID v4 生成
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // フォールバック実装
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * チャレンジIDの妥当性チェック
 */
export function isValidChallengeId(id: string): id is ChallengeId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * 冪等性キーの妥当性チェック
 */
export function isValidIdempotencyKey(key: string): boolean {
  // 英数字、アンダースコア、ハイフンのみ許可、最大255文字
  return /^[a-zA-Z0-9_-]{1,255}$/.test(key)
}

/**
 * デバッグ用ID表示
 */
export function debugIdInfo(label: string, challengeId: ChallengeId, additionalIds: Record<string, string> = {}): void {
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== 'true') return
  
  console.log(`🔑 [${label}]`, {
    challenge_id: challengeId,
    idempotency_payment: IdempotencyKeys.payment(challengeId, 'create'),
    idempotency_notification: IdempotencyKeys.notification(challengeId, 'challenge_start'),
    ...additionalIds
  })
}