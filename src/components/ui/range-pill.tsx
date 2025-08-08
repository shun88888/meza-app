'use client'

import { cn } from '@/lib/utils'

interface RangePillProps {
  label: string
  value: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function RangePill({ label, value, isActive = false, onClick, className }: RangePillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-xs font-medium transition-colors',
        'border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500',
        isActive
          ? 'bg-yellow-100 text-black'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        className
      )}
      aria-label={`${label} filter`}
    >
      {label}
    </button>
  )
}