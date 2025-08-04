'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

interface SlideToWakeProps {
  onSlideComplete: () => void
  disabled?: boolean
  className?: string
  text?: string
  completedText?: string
}

export interface SlideToWakeRef {
  reset: () => void
}

const SlideToWake = forwardRef<SlideToWakeRef, SlideToWakeProps>(({ 
  onSlideComplete, 
  disabled = false, 
  className = '',
  text = 'スライドで覚悟を決める',
  completedText = '覚悟完了!'
}, ref) => {
  const [isDragging, setIsDragging] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [buttonPosition, setButtonPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useImperativeHandle(ref, () => ({
    reset: () => {
      setIsDragging(false)
      setSlideProgress(0)
      setIsCompleted(false)
      setButtonPosition(0)
    }
  }))

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    
    return () => {
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    setIsDragging(true)
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    setIsDragging(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || disabled || !containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const maxX = containerWidth - 56
      const newPosition = Math.max(0, Math.min(maxX, x))
      const progress = newPosition / maxX
      
      setButtonPosition(newPosition)
      setSlideProgress(progress)
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    }

    const handleEnd = () => {
      if (!isDragging) return
      setIsDragging(false)
      
      const progress = slideProgress
      if (progress > 0.8) {
        setIsCompleted(true)
        setSlideProgress(1)
        setButtonPosition(containerWidth - 56)
        setTimeout(() => {
          onSlideComplete()
        }, 50)
      } else {
        setSlideProgress(0)
        setButtonPosition(0)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchend', handleEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, slideProgress, containerWidth, disabled, onSlideComplete])

  return (
    <div className={`relative ${className}`}>
      {/* Track */}
      <div 
        ref={containerRef}
        className="relative h-14 bg-gradient-to-r from-[#FFAD2F] to-[#FFE72E] rounded-full overflow-hidden"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {/* Progress fill */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#FF8A00] to-[#FFAD2F] transition-all duration-50"
          style={{
            width: `${slideProgress * 100}%`,
            opacity: isDragging ? 0.8 : 0.5
          }}
        />
        
        {/* Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white font-semibold text-lg">
            {isCompleted ? completedText : text}
          </span>
        </div>
        
        {/* Slide button */}
        <div
          ref={buttonRef}
          className="absolute left-1 top-1 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer z-10 transition-transform duration-50"
          style={{
            transform: `translateX(${buttonPosition}px) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
            pointerEvents: disabled ? 'none' : 'auto'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Play icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#FFAD2F]">
            <path
              fill="currentColor"
              d="M8 5v14l11-7z"
            />
          </svg>
        </div>
      </div>
      
      {/* Instruction text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          右にスライドして{text.includes('覚悟') ? '覚悟を決めてください' : '解除してください'}
        </p>
      </div>
    </div>
  )
})

SlideToWake.displayName = 'SlideToWake'

export default SlideToWake 