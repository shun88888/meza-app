'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 })
  const router = useRouter()
  
  // Set dark theme color and background for home page
  useEffect(() => {
    // Set theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0f172a')
    }
    
    // Set background gradient for body
    const originalBackground = document.body.style.background
    document.body.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
    
    // Update status bar area background
    const statusBarStyle = document.createElement('style')
    statusBarStyle.textContent = `
      body::before {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%) !important;
      }
    `
    document.head.appendChild(statusBarStyle)
    
    return () => {
      // Reset when component unmounts
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FED7AA')
      }
      document.body.style.background = originalBackground
      document.head.removeChild(statusBarStyle)
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
    <div className="bg-gradient-home min-h-screen-mobile flex flex-col items-center justify-center p-6 text-white">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Meza</h1>
        <p className="text-lg opacity-80">位置ベースペナルティアラーム</p>
      </div>

      {/* Time Selector */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-6 text-center">起床時刻</h2>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => adjustTime('hours', 'up')}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-light hover:bg-white/30 transition-colors"
            >
              +
            </button>
            <div className="text-4xl font-bold my-4 w-16 text-center">
              {wakeTime.hours}
            </div>
            <button
              onClick={() => adjustTime('hours', 'down')}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-light hover:bg-white/30 transition-colors"
            >
              -
            </button>
          </div>

          <div className="text-4xl font-bold">:</div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => adjustTime('minutes', 'up')}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-light hover:bg-white/30 transition-colors"
            >
              +
            </button>
            <div className="text-4xl font-bold my-4 w-16 text-center">
              {wakeTime.minutes.toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => adjustTime('minutes', 'down')}
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-light hover:bg-white/30 transition-colors"
            >
              -
            </button>
          </div>
        </div>

        {/* Optimal Range */}
        <div className="text-center text-sm opacity-70 mb-4">
          最適な起床時間: {range.start} - {range.end}
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStartChallenge}
        className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-lg rounded-xl transition-colors"
      >
        チャレンジを開始
      </Button>

      {/* Footer */}
      <div className="mt-12 text-center text-sm opacity-60">
        <p>指定した時刻に起きて、指定した場所に移動しましょう</p>
      </div>
    </div>
  )
} 