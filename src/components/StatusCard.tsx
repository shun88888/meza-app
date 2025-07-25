'use client'

import { useState, useEffect } from 'react'
import { Clock } from '@/components/ui/clock'

interface StatusCardProps {
  className?: string
}

export default function StatusCard({ className = '' }: StatusCardProps) {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    
    // Update current time every second for date display
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={`bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-3xl p-4 card-shadow-lg border border-white/20 ${className}`}>
        <div className="text-center mb-4">
          <div className="text-black dark:text-white mb-1">
            <div className='flex items-center justify-center gap-0.5 text-4xl font-light tracking-tight'>
              <span className="tabular-nums">00</span>
              <span className='text-gray-500 dark:text-gray-400'>:</span>
              <span className="tabular-nums">00</span>
              <span className='text-gray-500 dark:text-gray-400'>:</span>
              <span className="tabular-nums">00</span>
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-3xl p-4 card-shadow-lg border border-white/20 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-black dark:text-white mb-1">
          <Clock />
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-xs">
          {currentTime.toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>
    </div>
  )
}