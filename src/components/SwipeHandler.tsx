'use client'

import { ReactNode, useRef, useState, TouchEvent, useCallback } from 'react'

export interface SwipeDirection {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export interface SwipeEvent {
  direction: keyof SwipeDirection
  velocity: number
  distance: number
  duration: number
}

interface SwipeHandlerProps {
  children: ReactNode
  onSwipe?: (event: SwipeEvent) => void
  onSwipeUp?: (event: SwipeEvent) => void
  onSwipeDown?: (event: SwipeEvent) => void
  onSwipeLeft?: (event: SwipeEvent) => void
  onSwipeRight?: (event: SwipeEvent) => void
  threshold?: number
  className?: string
}

export default function SwipeHandler({
  children,
  onSwipe,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className = ''
}: SwipeHandlerProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const createSwipeEvent = useCallback((
    direction: keyof SwipeDirection,
    velocity: number,
    distance: number,
    duration: number
  ): SwipeEvent => ({
    direction,
    velocity,
    distance,
    duration
  }), [])

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    setIsDragging(true)
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const duration = Date.now() - touchStartRef.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / duration

    setIsDragging(false)

    if (distance < threshold) return

    let direction: keyof SwipeDirection
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    const swipeEvent = createSwipeEvent(direction, velocity, distance, duration)
    
    onSwipe?.(swipeEvent)
    
    switch (direction) {
      case 'up':
        onSwipeUp?.(swipeEvent)
        break
      case 'down':
        onSwipeDown?.(swipeEvent)
        break
      case 'left':
        onSwipeLeft?.(swipeEvent)
        break
      case 'right':
        onSwipeRight?.(swipeEvent)
        break
    }

    touchStartRef.current = null
  }

  const handleTouchCancel = () => {
    touchStartRef.current = null
    setIsDragging(false)
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={className}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  )
}

// プリセットされたスワイプコンポーネント
export function SwipeToNavigate({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) {
  return (
    <SwipeHandler
      onSwipeLeft={onSwipeLeft ? () => onSwipeLeft() : undefined}
      onSwipeRight={onSwipeRight ? () => onSwipeRight() : undefined}
      threshold={100}
      className={className}
    >
      {children}
    </SwipeHandler>
  )
}

export function SwipeToRefresh({
  children,
  onRefresh,
  className = ''
}: {
  children: ReactNode
  onRefresh?: () => void
  className?: string
}) {
  return (
    <SwipeHandler
      onSwipeDown={onRefresh ? () => onRefresh() : undefined}
      threshold={80}
      className={className}
    >
      {children}
    </SwipeHandler>
  )
}

export function SwipeToDismiss({
  children,
  onDismiss,
  direction = 'up',
  className = ''
}: {
  children: ReactNode
  onDismiss?: () => void
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}) {
  const swipeProps = {
    onSwipeUp: direction === 'up' ? onDismiss : undefined,
    onSwipeDown: direction === 'down' ? onDismiss : undefined,
    onSwipeLeft: direction === 'left' ? onDismiss : undefined,
    onSwipeRight: direction === 'right' ? onDismiss : undefined,
  }

  return (
    <SwipeHandler
      {...swipeProps}
      threshold={60}
      className={className}
    >
      {children}
    </SwipeHandler>
  )
} 