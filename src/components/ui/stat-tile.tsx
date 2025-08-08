'use client'

import { cn } from '@/lib/utils'

interface StatTileProps {
  title: string
  value: string | number
  unit?: string
  onClick?: () => void
  className?: string
}

export function StatTile({ title, value, unit, onClick, className }: StatTileProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US') : value

  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-[#FFFBEA] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[79px] w-32',
        onClick && 'cursor-pointer hover:bg-yellow-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500',
        className
      )}
      {...(onClick && { 'aria-label': `View ${title} details` })}
    >
      <div className="text-lg font-bold text-black tabular">{formattedValue}{unit}</div>
      <div className="text-xs text-black mt-1">{title}</div>
    </Component>
  )
}