'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 })
  const router = useRouter()
  
  // Set dark slate theme color and background for home page
  useEffect(() => {
    // Set theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0f172a')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#0f172a'
      document.head.appendChild(meta)
    }
    
    // Set background gradient for main content
    document.body.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
    
    // Set status bar gradient to match main background
    document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)')
    
    return () => {
      // Reset theme color and background when component unmounts
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FED7AA')
      }
      document.body.style.background = 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
      document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)')
    }
  }, [])

  const formatTimeDisplay = (hours: number, minutes: number) => {
    return `${hours} : ${minutes.toString().padStart(2, '0')}`
  }

  const adjustTime = (type: 'hours' | 'minutes', direction: 'up' | 'down') => {
    setWakeTime(prev => {
      if (type === 'hours') {
        let newHours = direction === 'up' ? prev.hours + 1 : prev.hours - 1
        if (newHours > 23) newHours = 0
        if (newHours < 0) newHours = 23
        return { ...prev, hours: newHours }
      } else {
        let newMinutes = direction === 'up' ? prev.minutes + 5 : prev.minutes - 5
        if (newMinutes >= 60) newMinutes = 0
        if (newMinutes < 0) newMinutes = 55
        return { ...prev, minutes: newMinutes }
      }
    })
  }

  const getOptimalWakeRange = () => {
    const startHour = wakeTime.hours
    const endHour = wakeTime.hours
    const startMin = Math.max(0, wakeTime.minutes - 30)
    const endMin = wakeTime.minutes
    
    return {
      start: `${startHour}:${startMin.toString().padStart(2, '0')}`,
      end: `${endHour}:${endMin.toString().padStart(2, '0')}`
    }
  }

  const handleStartChallenge = () => {
    router.push('/create-challenge')
  }

  const range = getOptimalWakeRange()

  return (
    <div className="fixed inset-0 bg-gradient-home flex flex-col text-white z-50">
      {/* Header */}
      <header className="px-4 py-8 w-full max-w-full pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-slate-800/50 rounded-full px-4 py-2">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">睡眠補助</span>
          </div>
          <button
            className="p-2 bg-slate-800/50 rounded-full"
            aria-label="音楽再生"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Time Display */}
      <div className="flex-1 px-4 flex flex-col justify-center">
        {/* Small time indicators */}
        <div className="flex justify-center space-x-8 mb-8">
          <button
            onClick={() => adjustTime('hours', 'down')}
            className="text-center"
          >
            <div className="text-2xl font-light text-gray-400">6</div>
            <div className="text-sm text-gray-500">55</div>
          </button>
          
          {/* Main time display */}
          <div className="text-center">
            <div className="relative">
              <div className="text-6xl font-light border-2 border-white/30 rounded-3xl px-8 py-4">
                {formatTimeDisplay(wakeTime.hours, wakeTime.minutes)}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => adjustTime('hours', 'up')}
            className="text-center"
          >
            <div className="text-2xl font-light text-gray-400">8</div>
            <div className="text-sm text-gray-500">05</div>
          </button>
        </div>

        {/* Optimal wake time range */}
        <div className="text-center mb-8">
          <p className="text-lg mb-2">次の時間帯に簡単に起床</p>
          <p className="text-xl font-semibold text-[#FFAD2F]">
            {range.start} - {range.end}
          </p>
        </div>

        {/* Start button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleStartChallenge}
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-colors duration-50 shadow-lg"
          >
            開始
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center space-x-2 mb-8">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
        </div>
      </div>

      {/* Premium section */}
      <div className="mx-4 mb-20">
        <div className="bg-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-white">プレミアムでさらに快眠</span>
          <Button
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full px-6"
          >
            試す
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-slate-900/95 border-t border-slate-700">
        <div className="max-w-md mx-auto px-4 py-3 pb-safe">
          <div className="flex justify-around">
            <button
              onClick={() => router.push('/')}
              className="flex flex-col items-center py-2 px-3 text-[#FFAD2F]"
            >
              <svg className="h-6 w-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">睡眠</span>
            </button>
            <button
              onClick={() => router.push('/history')}
              className="flex flex-col items-center py-2 px-3 text-gray-400"
            >
              <svg className="h-6 w-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">日誌</span>
            </button>
            <button
              onClick={() => router.push('/stats')}
              className="flex flex-col items-center py-2 px-3 text-gray-400"
            >
              <svg className="h-6 w-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span className="text-xs">統計</span>
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center py-2 px-3 text-gray-400"
            >
              <svg className="h-6 w-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">プロフィール</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
} 