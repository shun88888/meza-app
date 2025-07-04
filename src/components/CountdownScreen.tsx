'use client'

import { useState, useEffect } from 'react'

interface CountdownScreenProps {
  onComplete: () => void
  onCancel: () => void
  duration?: number
}

export default function CountdownScreen({ onComplete, onCancel, duration = 3 }: CountdownScreenProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  // Set orange theme color and background for countdown screen
  useEffect(() => {
    // Set theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#FFAD2F')
    }
    
    // Set background gradient for body
    const originalBackground = document.body.style.background
    document.body.style.background = 'linear-gradient(135deg, #FFAD2F 0%, #FED7AA 100%)'
    
    // Update status bar area background
    const statusBarStyle = document.createElement('style')
    statusBarStyle.textContent = `
      body::before {
        background: linear-gradient(135deg, #FFAD2F 0%, #FED7AA 100%) !important;
      }
    `
    document.head.appendChild(statusBarStyle)
    
    return () => {
      // Reset theme color and background when component unmounts
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FED7AA')
      }
      document.body.style.background = originalBackground
      document.head.removeChild(statusBarStyle)
    }
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-countdown flex flex-col items-center justify-center text-white px-6 z-50">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <p className="text-lg font-medium opacity-90">
            Are you sure?
          </p>
          <p className="text-2xl font-bold">
            Make up your mind
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="text-6xl font-bold">
            {timeLeft}
          </div>
          <div className="text-lg">
            秒
          </div>
          <p className="text-sm opacity-75">
            キャンセルできます
          </p>
        </div>
        
        <button
          onClick={onCancel}
          className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center text-2xl font-light hover:bg-white/10 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
} 