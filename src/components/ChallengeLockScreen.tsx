'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ChallengeData {
  id?: string
  wakeTime: string
  penaltyAmount: number
  wakeUpLocation: {
    lat: number
    lng: number
    address?: string
  } | null
  paymentMethod: string
  startTime: string
  startLocation?: {
    lat: number
    lng: number
  }
}

interface ChallengeLockScreenProps {
  challengeData: ChallengeData
  onUnlock: () => void
  unlockMethod?: 'slide' | 'passcode' | 'both'
  passcode?: string
  unlockRestrictions?: {
    timeRestriction?: boolean // 目覚まし時間の30分前まで解除不可
    locationRestriction?: boolean // 指定位置から離れると解除不可
    minDistance?: number // 最小移動距離 (デフォルト: 100m)
  }
}

export default function ChallengeLockScreen({
  challengeData,
  onUnlock,
  unlockMethod = 'both',
  passcode = '1234',
  unlockRestrictions = {
    timeRestriction: true,
    locationRestriction: false,
    minDistance: 100
  }
}: ChallengeLockScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [inputPasscode, setInputPasscode] = useState('')
  const [showPasscodeInput, setShowPasscodeInput] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [timeUntilWakeUp, setTimeUntilWakeUp] = useState('')
  const [challengeProgress, setChallengeProgress] = useState(0)
  const [shakeDots, setShakeDots] = useState(false)
  const [canUnlock, setCanUnlock] = useState(true)
  const [unlockMessage, setUnlockMessage] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const router = useRouter()

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 現在地を取得
  useEffect(() => {
    if (unlockRestrictions?.locationRestriction && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('位置情報取得エラー:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    }
  }, [unlockRestrictions?.locationRestriction])

  // 目覚まし時間までの残り時間を計算
  useEffect(() => {
    const calculateTimeUntilWakeUp = () => {
      const now = new Date()
      const wakeUpTime = new Date(challengeData.wakeTime)
      const startTime = new Date(challengeData.startTime)
      
      const timeLeft = wakeUpTime.getTime() - now.getTime()
      const totalTime = wakeUpTime.getTime() - startTime.getTime()
      
      if (timeLeft <= 0) {
        setTimeUntilWakeUp('目覚まし時間になりました！')
        setChallengeProgress(100)
        return
      }

      const progress = ((totalTime - timeLeft) / totalTime) * 100
      setChallengeProgress(Math.max(0, Math.min(100, progress)))

      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeUntilWakeUp(`${hours}時間${minutes}分${seconds}秒`)
      } else if (minutes > 0) {
        setTimeUntilWakeUp(`${minutes}分${seconds}秒`)
      } else {
        setTimeUntilWakeUp(`${seconds}秒`)
      }
    }

    calculateTimeUntilWakeUp()
    const timer = setInterval(calculateTimeUntilWakeUp, 1000)

    return () => clearInterval(timer)
  }, [challengeData.wakeTime, challengeData.startTime])

  // 解除制限をチェック
  useEffect(() => {
    const checkUnlockRestrictions = () => {
      const now = new Date()
      const wakeUpTime = new Date(challengeData.wakeTime)
      const startTime = new Date(challengeData.startTime)
      
      // 時間制限チェック
      if (unlockRestrictions?.timeRestriction) {
        const thirtyMinutesBeforeWakeUp = new Date(wakeUpTime.getTime() - (30 * 60 * 1000))
        if (now < thirtyMinutesBeforeWakeUp) {
          setCanUnlock(false)
          const timeUntilUnlock = thirtyMinutesBeforeWakeUp.getTime() - now.getTime()
          const hoursLeft = Math.floor(timeUntilUnlock / (1000 * 60 * 60))
          const minutesLeft = Math.floor((timeUntilUnlock % (1000 * 60 * 60)) / (1000 * 60))
          setUnlockMessage(`解除まであと${hoursLeft}時間${minutesLeft}分`)
          return
        }
      }

      // 位置制限チェック（スタート地点からの移動距離）
      if (unlockRestrictions?.locationRestriction && currentLocation && challengeData.startLocation) {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          challengeData.startLocation.lat,
          challengeData.startLocation.lng
        )
        
        const minDistance = unlockRestrictions.minDistance || 100
        if (distance < minDistance) {
          setCanUnlock(false)
          setUnlockMessage(`${minDistance}m以上移動してください（現在: ${Math.round(distance)}m）`)
          return
        }
      }

      setCanUnlock(true)
      setUnlockMessage('')
    }

    checkUnlockRestrictions()
    const timer = setInterval(checkUnlockRestrictions, 5000) // 5秒ごとにチェック

    return () => clearInterval(timer)
  }, [challengeData, currentLocation, unlockRestrictions])

  // 距離計算関数
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // パスコード入力処理
  const handlePasscodeInput = useCallback((digit: string) => {
    if (inputPasscode.length < 4) {
      const newPasscode = inputPasscode + digit
      setInputPasscode(newPasscode)

      if (newPasscode.length === 4) {
        setTimeout(() => {
          if (newPasscode === passcode) {
            if (!canUnlock) {
              alert(unlockMessage || '現在は解除できません')
              setInputPasscode('')
              return
            }
            setIsUnlocking(true)
            setTimeout(() => {
              onUnlock()
            }, 1000)
          } else {
            setShakeDots(true)
            setTimeout(() => {
              setInputPasscode('')
              setShakeDots(false)
            }, 500)
          }
        }, 100)
      }
    }
  }, [inputPasscode, passcode, onUnlock])

  // スライドアンロック処理
  const handleSlideUnlock = useCallback(() => {
    if (!canUnlock) {
      alert(unlockMessage || '現在は解除できません')
      return
    }
    setIsUnlocking(true)
    setTimeout(() => {
      onUnlock()
    }, 1000)
  }, [canUnlock, unlockMessage, onUnlock])

  // パスコードクリア
  const handlePasscodeClear = useCallback(() => {
    setInputPasscode('')
  }, [])

  // 緊急脱出（開発用）
  const handleEmergencyExit = useCallback(() => {
    if (confirm('本当にチャレンジを中断しますか？ペナルティが発生する可能性があります。')) {
      localStorage.removeItem('activeChallenge')
      router.push('/')
    }
  }, [router])

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`
  }

  return (
    <div 
      className="fixed inset-0 bg-white text-black overflow-hidden z-50"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.05) 0%, transparent 50%)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 pt-safe px-6 py-4 text-center">
        <div className="text-gray-600 text-sm">チャレンジ実行中</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-safe">
        
        {/* Current Time */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 mb-12 w-full max-w-sm shadow-lg"
        >
          <div className="text-center">
            <div className="text-gray-600 text-sm mb-4 font-medium">現在時刻</div>
            <div className="text-5xl font-light tracking-wider mb-4 text-black">
              {formatTime(currentTime)}
            </div>
            <div className="text-gray-600 text-sm">
              {formatDate(currentTime)}
            </div>
          </div>
        </motion.div>

        {/* Challenge Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 mb-12 w-full max-w-sm shadow-lg"
        >
          <div className="text-center">
            <div className="text-gray-600 text-sm mb-4 font-medium">目覚まし時間まで</div>
            <div className="text-3xl font-light mb-6 text-black">{timeUntilWakeUp}</div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
              <motion.div
                className="bg-yellow-400 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${challengeProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="text-gray-600 text-sm">
              目標: {challengeData.wakeUpLocation?.address || '設定された場所'}
            </div>
          </div>
        </motion.div>

        {/* Unlock Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm mb-12"
        >
          {!showPasscodeInput && (unlockMethod === 'slide' || unlockMethod === 'both') && (
            <div className="mb-6">
              <SlideToUnlock onUnlock={handleSlideUnlock} />
            </div>
          )}

          {(unlockMethod === 'passcode' || unlockMethod === 'both') && (
            <div className="text-center">
              {!showPasscodeInput ? (
                <button
                  onClick={() => setShowPasscodeInput(true)}
                  className="text-gray-600 text-sm hover:text-black transition-colors"
                >
                  パスコードで解除
                </button>
              ) : (
                <PasscodeInput
                  value={inputPasscode}
                  onDigitPress={handlePasscodeInput}
                  onClear={handlePasscodeClear}
                  shake={shakeDots}
                />
              )}
            </div>
          )}
        </motion.div>

        {/* Emergency Exit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <button
            onClick={handleEmergencyExit}
            className="text-red-400/60 text-xs hover:text-red-400 transition-colors"
          >
            緊急終了
          </button>
        </motion.div>
      </div>

      {/* Unlock Animation */}
      <AnimatePresence>
        {isUnlocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div className="text-gray-800 text-xl font-semibold">解除中...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// スライドアンロックコンポーネント
interface SlideToUnlockProps {
  onUnlock: () => void
}

function SlideToUnlock({ onUnlock }: SlideToUnlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleDragEnd = useCallback((_: any, info: any) => {
    const threshold = 200
    if (info.point.x >= threshold && !isCompleted) {
      setIsCompleted(true)
      onUnlock()
    } else {
      setDragX(0)
    }
    setIsDragging(false)
  }, [onUnlock, isCompleted])

  return (
    <div className="relative bg-gray-50 rounded-full h-16 overflow-hidden shadow-inner">
      {/* Track */}
      <div className="absolute inset-0 flex items-center px-6">
        <div className="text-gray-600 text-sm">スライドして解除</div>
        <div className="ml-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      </div>

      {/* Slider */}
      <motion.div
        className="absolute left-2 top-2 w-12 h-12 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        whileDrag={{ scale: 1.1 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onDrag={(_: any, info: any) => setDragX(info.point.x)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="gray">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      </motion.div>
    </div>
  )
}

// パスコード入力コンポーネント
interface PasscodeInputProps {
  value: string
  onDigitPress: (digit: string) => void
  onClear: () => void
  shake: boolean
}

function PasscodeInput({ value, onDigitPress, onClear, shake }: PasscodeInputProps) {
  return (
    <div className="space-y-6">
      {/* Dots */}
      <motion.div
        className="flex justify-center space-x-4"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              index < value.length
                ? 'bg-white border-white'
                : 'border-white/50'
            }`}
          />
        ))}
      </motion.div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => onDigitPress(digit.toString())}
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xl font-semibold hover:bg-white/20 transition-all active:scale-95"
          >
            {digit}
          </button>
        ))}
        <div /> {/* Empty space */}
        <button
          onClick={() => onDigitPress('0')}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xl font-semibold hover:bg-white/20 transition-all active:scale-95"
        >
          0
        </button>
        <button
          onClick={onClear}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm hover:bg-white/20 transition-all active:scale-95"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}