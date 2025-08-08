'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ToggleArrow } from './toggle-arrow'
import { cn } from '@/lib/utils'

interface SuccessCardProps {
  title: string
  value: string | number
  unit?: string
  isExpanded?: boolean
  className?: string
}

export function SuccessCard({ title, value, unit, isExpanded = false, className }: SuccessCardProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  return (
    <div className={cn('relative overflow-hidden rounded-3xl p-6 bg-yellow-200 opacity-87', className)}>
      {/* Background image */}
      <Image
        src="/assets/analytics/5.png"
        fill
        className="object-cover opacity-90 pointer-events-none select-none"
        alt=""
        priority
      />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-lg text-black font-medium mb-1">{title}</div>
          <div className="text-4xl font-bold text-black tabular">{value}{unit}</div>
        </div>
        <div className="bg-black text-white rounded-full p-2">
          <ToggleArrow
            isOpen={expanded}
            onClick={() => setExpanded(!expanded)}
            className="w-4 h-4"
            ariaLabel={expanded ? 'Collapse card' : 'Expand card'}
          />
        </div>
      </div>
    </div>
  )
}