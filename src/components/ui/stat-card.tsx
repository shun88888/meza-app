'use client'

import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  unit: string
  subtitle: string
  iconColor?: 'black' | 'red'
  bgOpacity?: 'light' | 'medium'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  iconColor = 'black',
  bgOpacity = 'medium'
}) => {
  const bgClass = bgOpacity === 'light' ? 'bg-yellow-200/40' : 'bg-yellow-200/60'
  const iconBgClass = iconColor === 'red' ? 'bg-red-500' : 'bg-black'
  
  // Adjust font size based on value length for better fit
  const getValueFontSize = (val: string | number) => {
    const str = val.toString().replace(/,/g, '') // Remove commas for length calculation
    if (str.length > 4) return 'text-lg'
    if (str.length > 3) return 'text-xl'
    return 'text-2xl'
  }

  return (
    <div className={`flex-1 ${bgClass} rounded-2xl p-3 relative overflow-hidden min-h-[100px]`}>
      <div className="h-full flex flex-col">
        {/* Header with title and icon */}
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs text-black font-medium truncate pr-1">{title}</div>
          <div className={`w-5 h-5 ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
            <div className={`w-1.5 h-0.5 bg-white ${iconColor === 'red' ? 'transform rotate-180' : ''}`}></div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-0.5 mb-1">
            <div className={`${getValueFontSize(value)} font-bold text-black leading-none truncate`}>
              {value}
            </div>
            <div className="text-xs text-black opacity-70 flex-shrink-0">{unit}</div>
          </div>
          <div className="text-xs text-black truncate">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

export default StatCard