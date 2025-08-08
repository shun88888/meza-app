'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ToggleArrow } from './toggle-arrow'
import { cn } from '@/lib/utils'

interface ClearTaskCardProps {
  title: string
  value: number
  unit: string
  isExpanded?: boolean
  className?: string
}

export function ClearTaskCard({ title, value, unit, isExpanded = false, className }: ClearTaskCardProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  return (
    <div className={cn('relative overflow-hidden rounded-3xl p-6 bg-yellow-100 opacity-67', className)}>
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-lg text-black font-medium mb-1">{title}</div>
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-black tabular">{value}</span>
            <span className="mx-0.5 text-lg text-black">/</span>
            <span className="text-lg text-black">{unit}</span>
          </div>
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
      
      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16">
        <Image
          src="/assets/analytics/3.png"
          fill
          className="object-contain object-bottom pointer-events-none select-none"
          alt=""
        />
      </div>
    </div>
  )
}