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
    
    // Set background gradient for main content
    document.body.style.background = 'linear-gradient(135deg, #FFAD2F 0%, #FED7AA 100%)'
    
    // Set status bar gradient to match main background
    document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #FFAD2F 0%, #FED7AA 100%)')
    
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
      {/* Top text */}
      <div className="text-center mb-16">
        <h1 className="text-2xl font-light">Are you sure?</h1>
      </div>

      {/* Center content */}
      <div className="text-center mb-24">
        <h2 className="text-3xl font-light mb-8">Make up your mind</h2>
        
        <div className="mb-4">
          <span key={timeLeft} className="text-5xl font-bold animate-[pulse_0.05s_ease-out]">
            {timeLeft}
          </span>
          <span className="text-xl ml-2">秒</span>
        </div>
        
        <p className="text-lg">キャンセルできます</p>
      </div>

      {/* Cancel button */}
      <div className="absolute bottom-20 pb-safe">
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full border border-white/30 hover:bg-white/30 transition-colors duration-50"
          aria-label="キャンセル"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-8 right-8 pb-safe">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full"
            style={{
              width: '100%',
              animation: `shrink ${duration}s linear forwards`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
} 