'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatusCard from '@/components/StatusCard'
import { FeyButton } from '@/components/ui/fey-button'

export default function HomePage() {
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 })
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Safari viewport height fix
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    setVH()
    window.addEventListener('resize', setVH)
    return () => window.removeEventListener('resize', setVH)
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
        <div className="text-black dark:text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden text-black dark:text-white" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Main Content */}
      <main className="h-full flex flex-col items-center justify-between px-6 py-safe-offset">
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
          {/* Status Card */}
          <div className="w-full mb-6">
            <StatusCard 
              nextAlarm={formatTime(wakeTime.hours, wakeTime.minutes)}
              className="w-full"
            />
          </div>

          {/* Wake Time Setting */}
          <div className="w-full">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-lg">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">起床時刻設定</h2>
                <div className="text-5xl font-light mb-2 text-black dark:text-white tracking-wider">
                  {formatTime(wakeTime.hours, wakeTime.minutes)}
                </div>
              </div>

              {/* Time Controls */}
              <div className="grid grid-cols-2 gap-4">
                {/* Hours Control */}
                <div className="bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">時間</div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => adjustTime('hours', false)}
                        className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center text-xl transition-all duration-200 border border-white/20 active:scale-95"
                      >
                        −
                      </button>
                      <div className="text-3xl font-light w-14 text-center text-black dark:text-white">
                        {wakeTime.hours.toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('hours', true)}
                        className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center text-xl transition-all duration-200 border border-white/20 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Minutes Control */}
                <div className="bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">分</div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => adjustTime('minutes', false)}
                        className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center text-xl transition-all duration-200 border border-white/20 active:scale-95"
                      >
                        −
                      </button>
                      <div className="text-3xl font-light w-14 text-center text-black dark:text-white">
                        {wakeTime.minutes.toString().padStart(2, '0')}
                      </div>
                      <button
                        onClick={() => adjustTime('minutes', true)}
                        className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 flex items-center justify-center text-xl transition-all duration-200 border border-white/20 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button - With bottom padding for navigation */}
        <div className="w-full max-w-sm pb-24 pt-6">
          <button
            onClick={handleStart}
            className="w-full h-14 text-lg font-semibold shadow-lg rounded-3xl transition-all duration-200"
            style={{ 
              backgroundColor: '#FFD400', 
              color: 'black' 
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFC400'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#FFD400'}
          >
            チャレンジを開始
          </button>
        </div>
      </main>
    </div>
  )
} 