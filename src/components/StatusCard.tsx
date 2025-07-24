'use client'

import { useState, useEffect } from 'react'
import { Clock } from '@/components/ui/clock'

interface StatusCardProps {
  nextAlarm?: string
  className?: string
}

export default function StatusCard({ nextAlarm, className = '' }: StatusCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update current time every second for date display
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])


  return (
    <div className={`bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-3xl p-6 card-shadow-lg border border-white/20 ${className}`}>
      <div className="text-center mb-6">
        <div className="text-black dark:text-white mb-2">
          <Clock />
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {currentTime.toLocaleDateString('ja-JP', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>


    </div>
  )
}