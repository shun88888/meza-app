'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 })
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const adjustTime = (type: 'hours' | 'minutes', increment: boolean) => {
    setWakeTime(prev => {
      if (type === 'hours') {
        const newHours = increment 
          ? (prev.hours + 1) % 24
          : (prev.hours - 1 + 24) % 24
        return { ...prev, hours: newHours }
      } else {
        const newMinutes = increment 
          ? (prev.minutes + 5) % 60
          : (prev.minutes - 5 + 60) % 60
        return { ...prev, minutes: newMinutes }
      }
    })
  }

  const handleStart = () => {
    router.push('/create-challenge')
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-light">起床時刻設定</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Time Display */}
        <div className="text-center mb-12">
          <div className="text-6xl font-light mb-4">
            {formatTime(wakeTime.hours, wakeTime.minutes)}
          </div>
          <div className="text-xl text-white/60">
            {wakeTime.hours < 12 ? 'AM' : 'PM'}
          </div>
        </div>

        {/* Time Controls */}
        <div className="max-w-sm mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8">
            {/* Hours Control */}
            <div className="mb-8">
              <div className="text-center mb-4">
                <div className="text-sm text-white/70 mb-2">時間</div>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => adjustTime('hours', false)}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-light transition-colors"
                  >
                    −
                  </button>
                  <div className="text-3xl font-light w-20 text-center">
                    {wakeTime.hours.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => adjustTime('hours', true)}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-light transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Minutes Control */}
            <div>
              <div className="text-center">
                <div className="text-sm text-white/70 mb-2">分</div>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => adjustTime('minutes', false)}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-light transition-colors"
                  >
                    −
                  </button>
                  <div className="text-3xl font-light w-20 text-center">
                    {wakeTime.minutes.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => adjustTime('minutes', true)}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-light transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 px-8 rounded-full text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            チャレンジを開始
          </button>
        </div>
      </main>
    </div>
  )
} 