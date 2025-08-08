'use client'

import React from 'react'
import Image from 'next/image'

interface UserHeaderProps {
  userName?: string
  greeting?: string
  profileImage?: string
}

const UserHeader: React.FC<UserHeaderProps> = ({
  userName = "Herper Russo",
  greeting = "Good Morning",
  profileImage
}) => {
  return (
    <div className="flex items-center justify-between p-4 pt-12">
      <div>
        <h1 className="text-xl font-normal text-black leading-tight">
          {greeting},<br />
          {userName}
        </h1>
      </div>
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
        {profileImage ? (
          <Image
            src={profileImage}
            alt="Profile"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
              {userName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserHeader