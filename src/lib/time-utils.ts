/**
 * 時刻処理ユーティリティ
 * 前提整備：全サーバ時刻は UTC、クライアントはローカル表示
 */

// 時刻フォーマット定数
export const TIME_FORMATS = {
  ISO_UTC: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  ISO_LOCAL: 'YYYY-MM-DDTHH:mm:ss.sss',
  DATE_DISPLAY: 'YYYY/MM/DD',
  TIME_DISPLAY: 'HH:mm',
  DATETIME_DISPLAY: 'YYYY/MM/DD HH:mm',
  LOG_FORMAT: 'YYYY-MM-DD HH:mm:ss.sss'
} as const

// タイムゾーン設定
export const TIMEZONES = {
  UTC: 'UTC',
  TOKYO: 'Asia/Tokyo',
  DEFAULT: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Tokyo'
} as const

/**
 * 現在時刻をUTCで取得
 */
export function nowUTC(): Date {
  return new Date()
}

/**
 * 現在時刻をUTC ISO文字列で取得
 */
export function nowUTCString(): string {
  return new Date().toISOString()
}

/**
 * 時刻をUTCに変換
 */
export function toUTC(date: Date | string): Date {
  if (typeof date === 'string') {
    return new Date(date)
  }
  return new Date(date.getTime())
}

/**
 * 時刻をUTC ISO文字列に変換
 */
export function toUTCString(date: Date | string): string {
  return toUTC(date).toISOString()
}

/**
 * UTC時刻をローカル時刻に変換して表示用フォーマット
 */
export function formatLocalTime(utcDate: Date | string, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONES.DEFAULT,
    ...(format === 'date' ? {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    } : format === 'time' ? {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    } : {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  return new Intl.DateTimeFormat('ja-JP', options).format(date)
}

/**
 * ローカル時刻文字列をUTCに変換
 * @param localTimeString 'HH:mm' 形式のローカル時刻
 * @param date 基準日（省略時は今日）
 */
export function localTimeToUTC(localTimeString: string, date?: Date): Date {
  const baseDate = date || new Date()
  const [hours, minutes] = localTimeString.split(':').map(Number)
  
  // ローカル時刻として設定
  const localDate = new Date(baseDate)
  localDate.setHours(hours, minutes, 0, 0)
  
  // UTCに変換して返す
  return new Date(localDate.getTime())
}

/**
 * チャレンジ用の時刻計算ユーティリティ
 */
export class ChallengeTimeUtils {
  /**
   * 起床時刻（ローカル）から翌日のUTC開始時刻を計算
   */
  static getNextWakeTimeUTC(localWakeTime: string): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return localTimeToUTC(localWakeTime, tomorrow)
  }
  
  /**
   * チャレンジ開始時刻から終了時刻を計算（デフォルト2時間後）
   */
  static getEndTimeUTC(startTimeUTC: Date, durationMinutes: number = 120): Date {
    return new Date(startTimeUTC.getTime() + durationMinutes * 60 * 1000)
  }
  
  /**
   * チャレンジがアクティブかどうか判定
   */
  static isChallengeActive(startTimeUTC: Date, endTimeUTC: Date, currentTime?: Date): boolean {
    const now = currentTime || nowUTC()
    return now >= startTimeUTC && now <= endTimeUTC
  }
  
  /**
   * チャレンジまでの残り時間を秒で取得
   */
  static getSecondsUntilStart(startTimeUTC: Date, currentTime?: Date): number {
    const now = currentTime || nowUTC()
    return Math.max(0, Math.floor((startTimeUTC.getTime() - now.getTime()) / 1000))
  }
  
  /**
   * チャレンジ終了までの残り時間を秒で取得
   */
  static getSecondsUntilEnd(endTimeUTC: Date, currentTime?: Date): number {
    const now = currentTime || nowUTC()
    return Math.max(0, Math.floor((endTimeUTC.getTime() - now.getTime()) / 1000))
  }
}

/**
 * 時刻ズレ検出ユーティリティ
 */
export class TimeSkewDetector {
  private static readonly MAX_SKEW_MS = 5000 // 5秒以上のズレを検出
  
  /**
   * サーバー時刻とクライアント時刻の差分を検出
   */
  static async detectSkew(serverTimeEndpoint: string = '/api/time'): Promise<number> {
    try {
      const clientTime = Date.now()
      
      const response = await fetch(serverTimeEndpoint)
      const { serverTime } = await response.json()
      
      const serverTimeMs = new Date(serverTime).getTime()
      const skew = serverTimeMs - clientTime
      
      // ログ出力
      if (Math.abs(skew) > this.MAX_SKEW_MS) {
        console.warn('⚠️ 時刻ズレ検出:', {
          skewMs: skew,
          clientTime: new Date(clientTime).toISOString(),
          serverTime: new Date(serverTimeMs).toISOString()
        })
      }
      
      return skew
    } catch (error) {
      console.error('時刻ズレ検出エラー:', error)
      return 0
    }
  }
  
  /**
   * 定期的な時刻ズレ監視開始
   */
  static startSkewMonitoring(intervalMinutes: number = 10): () => void {
    const intervalId = setInterval(() => {
      this.detectSkew()
    }, intervalMinutes * 60 * 1000)
    
    // 停止関数を返す
    return () => clearInterval(intervalId)
  }
}

/**
 * デバッグ用時刻表示
 */
export function debugTimeInfo(label: string, date?: Date): void {
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== 'true') return
  
  const target = date || nowUTC()
  console.log(`🕐 [${label}]`, {
    utc: target.toISOString(),
    local: formatLocalTime(target, 'datetime'),
    timestamp: target.getTime()
  })
}