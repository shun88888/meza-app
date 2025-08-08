'use client'

import React, { useState, useEffect } from 'react'

const TimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  return (
    <div className="px-4 mb-8 text-center">
      <div className="text-6xl font-bold text-black mb-2 tracking-tight">
        {formatTime(currentTime)}
      </div>
      <div className="text-xl text-gray-500 font-normal">
        {formatDate(currentTime)}
      </div>
    </div>
  )
}

export default TimeDisplay