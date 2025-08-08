'use client'

import React from 'react'

interface TaskProgressCardProps {
  percentage: number
  title: string
  color?: 'yellow' | 'red' | 'green'
  size?: 'small' | 'large'
  icon?: React.ReactNode
}

const TaskProgressCard: React.FC<TaskProgressCardProps> = ({
  percentage,
  title,
  color = 'yellow',
  size = 'small',
  icon
}) => {
  const colorClasses = {
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
    green: 'bg-green-500'
  }

  const bgColorClasses = {
    yellow: 'bg-yellow-200/50',
    red: 'bg-red-200/50',
    green: 'bg-green-200/50'
  }

  const isLarge = size === 'large'

  return (
    <div className={`${isLarge ? bgColorClasses.yellow : bgColorClasses[color]} rounded-3xl p-${isLarge ? '6' : '4'} relative overflow-hidden ${isLarge ? '' : 'flex-1'}`}>
      <div className={`${isLarge ? 'flex items-center justify-between mb-4' : 'text-center mb-4'}`}>
        <div>
          <div className={`${isLarge ? 'text-white text-4xl' : 'text-black text-3xl'} font-bold mb-2`}>
            {percentage}%
          </div>
          <div className={`${isLarge ? 'text-white text-base' : 'text-black text-sm'}`}>
            {title}
          </div>
        </div>
        {isLarge && (
          <div className="relative">
            <div className="w-32 h-32 opacity-80">
              <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                {icon || <div className="text-4xl">📱</div>}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isLarge && (
        <>
          <div className="text-white text-sm">Number of Tasks Performed</div>
          <div className="absolute top-4 right-4 w-8 h-8 bg-black rounded-full"></div>
        </>
      )}
      
      {!isLarge && (
        <>
          <div className={`w-8 h-8 ${colorClasses[color]} rounded-full mx-auto mb-2`}></div>
          <div className="w-4 h-2 bg-black mx-auto"></div>
        </>
      )}
    </div>
  )
}

export default TaskProgressCard