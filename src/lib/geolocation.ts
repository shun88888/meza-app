/**
 * 高精度位置情報取得ライブラリ
 * GPS/Wi-Fi/ネットワーク位置情報の統合取得
 */

export interface GeolocationResult {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN'
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  fallbackTimeout?: number
  retryAttempts?: number
  minAccuracy?: number
}

// デフォルト設定
const DEFAULT_OPTIONS: Required<GeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 15000, // 15秒
  maximumAge: 60000, // 1分
  fallbackTimeout: 5000, // 5秒（フォールバック用）
  retryAttempts: 3,
  minAccuracy: 50 // 50m以内の精度を要求
}

/**
 * ブラウザの位置情報サポート状況をチェック
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator
}

/**
 * 位置情報の権限状態をチェック
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (!('permissions' in navigator)) {
    return 'prompt'
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch (error) {
    console.warn('Permission query failed:', error)
    return 'prompt'
  }
}

/**
 * 位置情報の権限をリクエスト
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  const permission = await checkGeolocationPermission()
  
  if (permission === 'granted') {
    return true
  }
  
  if (permission === 'denied') {
    return false
  }
  
  // 'prompt'状態の場合、実際に位置情報を取得して権限をリクエスト
  try {
    await getCurrentPosition({ timeout: 5000, enableHighAccuracy: false })
    return true
  } catch (error) {
    return false
  }
}

/**
 * 基本的な位置情報取得（単発）
 */
export function getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'UNKNOWN'
      } as GeolocationError)
      return
    }

    const opts = { ...DEFAULT_OPTIONS, ...options }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let errorType: GeolocationError['type']
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED'
            break
          case error.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE'
            break
          case error.TIMEOUT:
            errorType = 'TIMEOUT'
            break
          default:
            errorType = 'UNKNOWN'
        }

        reject({
          code: error.code,
          message: error.message,
          type: errorType
        } as GeolocationError)
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge
      }
    )
  })
}

/**
 * 高精度位置情報取得（リトライ＆フォールバック付き）
 */
export async function getHighAccuracyPosition(options: GeolocationOptions = {}): Promise<GeolocationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: GeolocationError | null = null

  // 高精度モードで試行
  for (let attempt = 1; attempt <= opts.retryAttempts; attempt++) {
    try {
      console.log(`位置情報取得試行 ${attempt}/${opts.retryAttempts} (高精度モード)`)
      
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: opts.timeout,
        maximumAge: attempt === 1 ? 0 : opts.maximumAge, // 初回は最新データを要求
        minAccuracy: opts.minAccuracy
      })

      // 精度チェック
      if (position.accuracy <= opts.minAccuracy) {
        console.log(`高精度位置情報取得成功: 精度 ${position.accuracy}m`)
        return position
      }

      console.log(`精度不足 (${position.accuracy}m > ${opts.minAccuracy}m), リトライします`)
      
    } catch (error) {
      lastError = error as GeolocationError
      console.warn(`位置情報取得失敗 (試行 ${attempt}):`, error)
      
      // タイムアウトの場合は次の試行で待機時間を短縮
      if (lastError.type === 'TIMEOUT' && attempt < opts.retryAttempts) {
        opts.timeout = Math.max(5000, opts.timeout * 0.8)
      }
    }
  }

  // 高精度モードで失敗した場合、低精度モードにフォールバック
  console.log('高精度モード失敗、低精度モードにフォールバック')
  
  try {
    const position = await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: opts.fallbackTimeout,
      maximumAge: opts.maximumAge
    })

    console.log(`低精度位置情報取得成功: 精度 ${position.accuracy}m`)
    return position

  } catch (fallbackError) {
    console.error('低精度モードも失敗:', fallbackError)
    throw lastError || fallbackError
  }
}

/**
 * 連続位置情報監視
 */
export class GeolocationWatcher {
  private watchId: number | null = null
  private options: Required<GeolocationOptions>
  private onPosition: (position: GeolocationResult) => void
  private onError: (error: GeolocationError) => void
  private lastPosition: GeolocationResult | null = null
  private positionHistory: GeolocationResult[] = []
  private readonly maxHistorySize = 10

  constructor(
    onPosition: (position: GeolocationResult) => void,
    onError: (error: GeolocationError) => void,
    options: GeolocationOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.onPosition = onPosition
    this.onError = onError
  }

  /**
   * 監視開始
   */
  start(): boolean {
    if (!isGeolocationSupported()) {
      this.onError({
        code: 0,
        message: 'Geolocation is not supported',
        type: 'UNKNOWN'
      })
      return false
    }

    if (this.watchId !== null) {
      console.warn('Geolocation watcher is already running')
      return true
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const result: GeolocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp
        }

        // 精度フィルタリング
        if (result.accuracy > this.options.minAccuracy) {
          console.warn(`位置情報の精度が不十分 (${result.accuracy}m > ${this.options.minAccuracy}m)`)
          return
        }

        // 履歴に追加
        this.addToHistory(result)
        this.lastPosition = result
        this.onPosition(result)
      },
      (error) => {
        let errorType: GeolocationError['type']
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED'
            break
          case error.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE'
            break
          case error.TIMEOUT:
            errorType = 'TIMEOUT'
            break
          default:
            errorType = 'UNKNOWN'
        }

        this.onError({
          code: error.code,
          message: error.message,
          type: errorType
        })
      },
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge
      }
    )

    console.log('Geolocation watcher started')
    return true
  }

  /**
   * 監視停止
   */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
      console.log('Geolocation watcher stopped')
    }
  }

  /**
   * 最新の位置情報を取得
   */
  getLastPosition(): GeolocationResult | null {
    return this.lastPosition
  }

  /**
   * 位置情報履歴を取得
   */
  getPositionHistory(): GeolocationResult[] {
    return [...this.positionHistory]
  }

  /**
   * 平均精度を計算
   */
  getAverageAccuracy(): number {
    if (this.positionHistory.length === 0) return 0
    
    const totalAccuracy = this.positionHistory.reduce((sum, pos) => sum + pos.accuracy, 0)
    return totalAccuracy / this.positionHistory.length
  }

  /**
   * 移動距離を計算
   */
  getTotalDistance(): number {
    if (this.positionHistory.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < this.positionHistory.length; i++) {
      const prev = this.positionHistory[i - 1]
      const curr = this.positionHistory[i]
      totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
    }

    return totalDistance
  }

  /**
   * 現在の速度を取得（m/s）
   */
  getCurrentSpeed(): number {
    if (this.positionHistory.length < 2) return 0

    const recent = this.positionHistory.slice(-2)
    const [prev, curr] = recent
    const distance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000 // 秒に変換

    return timeDiff > 0 ? distance / timeDiff : 0
  }

  private addToHistory(position: GeolocationResult): void {
    this.positionHistory.push(position)
    
    // 履歴サイズ制限
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift()
    }
  }
}

/**
 * Haversine公式による2点間の距離計算（メートル）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * 移動平均フィルタによる位置情報の平滑化
 */
export function smoothPositions(positions: GeolocationResult[], windowSize: number = 3): GeolocationResult[] {
  if (positions.length < windowSize) {
    return positions
  }

  const smoothed: GeolocationResult[] = []

  for (let i = windowSize - 1; i < positions.length; i++) {
    const window = positions.slice(i - windowSize + 1, i + 1)
    
    const avgLat = window.reduce((sum, pos) => sum + pos.latitude, 0) / windowSize
    const avgLon = window.reduce((sum, pos) => sum + pos.longitude, 0) / windowSize
    const avgAccuracy = window.reduce((sum, pos) => sum + pos.accuracy, 0) / windowSize

    smoothed.push({
      ...positions[i],
      latitude: avgLat,
      longitude: avgLon,
      accuracy: avgAccuracy
    })
  }

  return smoothed
}

/**
 * 異常値検出とフィルタリング
 */
export function filterOutliers(positions: GeolocationResult[], maxSpeed: number = 50): GeolocationResult[] {
  if (positions.length < 2) {
    return positions
  }

  const filtered: GeolocationResult[] = [positions[0]] // 最初の位置は常に含める

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    
    const distance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000 // 秒
    const speed = timeDiff > 0 ? distance / timeDiff : 0

    // 異常に高速な移動を検出（デフォルト50m/s = 180km/h）
    if (speed <= maxSpeed) {
      filtered.push(curr)
    } else {
      console.warn(`異常な移動速度を検出: ${speed.toFixed(2)}m/s, 位置をスキップします`)
    }
  }

  return filtered
}

/**
 * デバイスの向きと位置情報を組み合わせた高精度測位
 */
export class AdvancedGeolocation {
  private geolocationWatcher: GeolocationWatcher | null = null
  private deviceOrientationSupported = false
  private lastOrientation: { alpha: number; beta: number; gamma: number } | null = null

  constructor() {
    this.checkDeviceOrientationSupport()
  }

  private checkDeviceOrientationSupport(): void {
    this.deviceOrientationSupported = 'DeviceOrientationEvent' in window
  }

  /**
   * 高精度測位開始
   */
  startAdvancedTracking(
    onPosition: (position: GeolocationResult & { orientation?: { alpha: number; beta: number; gamma: number } }) => void,
    onError: (error: GeolocationError) => void,
    options: GeolocationOptions = {}
  ): boolean {
    // 位置情報監視開始
    this.geolocationWatcher = new GeolocationWatcher(
      (position) => {
        onPosition({
          ...position,
          orientation: this.lastOrientation ?? undefined
        })
      },
      onError,
      options
    )

    const watcherStarted = this.geolocationWatcher.start()

    // デバイス向き監視開始
    if (this.deviceOrientationSupported) {
      window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this))
    }

    return watcherStarted
  }

  /**
   * 高精度測位停止
   */
  stopAdvancedTracking(): void {
    if (this.geolocationWatcher) {
      this.geolocationWatcher.stop()
      this.geolocationWatcher = null
    }

    if (this.deviceOrientationSupported) {
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this))
    }
  }

  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    this.lastOrientation = {
      alpha: event.alpha ?? 0,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0
    }
  }

  /**
   * 統計情報取得
   */
  getStats() {
    if (!this.geolocationWatcher) {
      return null
    }

    return {
      averageAccuracy: this.geolocationWatcher.getAverageAccuracy(),
      totalDistance: this.geolocationWatcher.getTotalDistance(),
      currentSpeed: this.geolocationWatcher.getCurrentSpeed(),
      positionCount: this.geolocationWatcher.getPositionHistory().length,
      orientationSupported: this.deviceOrientationSupported
    }
  }
}