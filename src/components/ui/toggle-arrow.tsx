'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ToggleArrowProps {
  isOpen: boolean
  onClick: () => void
  className?: string
  ariaLabel?: string
}

export function ToggleArrow({ isOpen, onClick, className, ariaLabel = 'Toggle expand' }: ToggleArrowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-6 h-6 flex items-center justify-center transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded',
        className
      )}
      aria-expanded={isOpen}
      aria-label={ariaLabel}
    >
      <Image
        src="/assets/analytics/6.png"
        width={24}
        height={24}
        alt=""
        className={cn(
          'transition-transform duration-300',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  )
}