'use client'

import { useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface HeaderProps {
  userName?: string
  avatarUrl?: string
  className?: string
}

export function Header({ userName = 'Herper Russo', avatarUrl, className }: HeaderProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={cn('flex items-center justify-between p-6', className)}>
      <div>
        <h1 className="text-lg font-semibold leading-tight text-black">
          Good Morning,<br />{userName}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <BellIcon className="w-6 h-6 text-gray-600" />
        <div className="w-12 h-12 rounded-full overflow-hidden">
          {!imageError && avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile picture"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">👤</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}