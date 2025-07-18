/**
 * Error handling utilities for the application
 */

import React from 'react'

// Chunk load error detection and handling
export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Loading chunk') ||
    error.message.includes('ChunkLoadError')
  )
}

// Hydration error detection
export function isHydrationError(error: Error): boolean {
  return (
    error.message.includes('hydration') ||
    error.message.includes('Hydration') ||
    error.message.includes('server HTML') ||
    error.message.includes('client content')
  )
}

// Safe JSON parsing
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Safe localStorage access
export function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  }
  
  try {
    // Test localStorage availability
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return localStorage
  } catch {
    // Fallback for when localStorage is not available
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  }
}

// Safe date formatting
export function safeDateFormat(date: string | Date, fallback: string = 'Invalid Date'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return fallback
    }
    return dateObj.toLocaleDateString('ja-JP')
  } catch {
    return fallback
  }
}

// Safe time formatting
export function safeTimeFormat(time: string | Date, fallback: string = '00:00'): string {
  try {
    let dateObj: Date
    
    if (typeof time === 'string') {
      if (time.includes(':')) {
        // Handle time string like "08:00"
        const [hours, minutes] = time.split(':').map(Number)
        dateObj = new Date()
        dateObj.setHours(hours, minutes, 0, 0)
      } else {
        dateObj = new Date(time)
      }
    } else {
      dateObj = time
    }
    
    if (isNaN(dateObj.getTime())) {
      return fallback
    }
    
    return dateObj.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch {
    return fallback
  }
}

// Safe number formatting
export function safeNumberFormat(value: any, fallback: number = 0): number {
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

// Safe string formatting
export function safeStringFormat(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value)
}

// Retry mechanism for async operations
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i === maxRetries - 1) {
        throw lastError
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  throw lastError!
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Safe async wrapper
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (onError) {
      onError(error as Error)
    }
    console.error('Safe async error:', error)
    return fallback
  }
}

// Client-side only execution
export function clientOnly<T>(fn: () => T, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }
  
  try {
    return fn()
  } catch (error) {
    console.error('Client-only execution error:', error)
    return fallback
  }
}

// Error boundary helper - removed due to TypeScript complexity

// Global error handler setup
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Handle chunk load errors specifically
    if (isChunkLoadError(event.reason)) {
      console.log('Chunk load error detected, reloading page...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Handle chunk load errors
    if (isChunkLoadError(event.error)) {
      console.log('Chunk load error detected, reloading page...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })
} 