'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TimeSettingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTime = searchParams.get('current')
  
  const [selectedTime, setSelectedTime] = useState(() => {
    if (currentTime) {
      const date = new Date(currentTime)
      return {
        hours: date.getHours(),
        minutes: date.getMinutes()
      }
    }
    // デフォルトは明日の8:00
    return { hours: 8, minutes: 0 }
  })

  const [selectedDate, setSelectedDate] = useState(() => {
    if (currentTime) {
      return new Date(currentTime).toISOString().split('T')[0]
    }
    // デフォルトは明日
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })

  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedTime({ hours, minutes })
  }

  const handleSave = () => {
    const date = new Date(selectedDate)
    date.setHours(selectedTime.hours, selectedTime.minutes, 0, 0)
    const isoString = date.toISOString()
    router.push(`/create-challenge?wakeTime=${encodeURIComponent(isoString)}`)
  }

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今日'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明日'
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  // 今日から7日後までの日付オプションを生成
  const getDateOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      options.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? '今日' : i === 1 ? '明日' : date.toLocaleDateString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          weekday: 'short'
        }),
        date: date
      })
    }
    
    return options
  }

  const quickTimeOptions = [
    { hours: 6, minutes: 0, label: '早朝' },
    { hours: 7, minutes: 0, label: '朝' },
    { hours: 8, minutes: 0, label: '標準' },
    { hours: 9, minutes: 0, label: '遅め' },
    { hours: 10, minutes: 0, label: '休日' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-800">目覚時間設定</h1>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            決定
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 日付選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">日付選択</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-2">
              {getDateOptions().map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDate(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedDate === option.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">
                    {option.date.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* クイック時間選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">クイック選択</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickTimeOptions.map((option) => (
              <button
                key={`${option.hours}-${option.minutes}`}
                onClick={() => handleTimeChange(option.hours, option.minutes)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedTime.hours === option.hours && selectedTime.minutes === option.minutes
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold">
                  {formatTime(option.hours, option.minutes)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 詳細時間設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">詳細時間設定</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center space-x-8">
              {/* 時間 */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">時間</div>
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleTimeChange((selectedTime.hours + 1) % 24, selectedTime.minutes)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  </button>
                  <div className="text-3xl font-bold text-gray-900 w-16 text-center">
                    {selectedTime.hours.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => handleTimeChange((selectedTime.hours - 1 + 24) % 24, selectedTime.minutes)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-gray-400">:</div>
              
              {/* 分 */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">分</div>
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleTimeChange(selectedTime.hours, (selectedTime.minutes + 5) % 60)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  </button>
                  <div className="text-3xl font-bold text-gray-900 w-16 text-center">
                    {selectedTime.minutes.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => handleTimeChange(selectedTime.hours, (selectedTime.minutes - 5 + 60) % 60)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 現在の選択表示 */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">設定された時間</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatDate(selectedDate)} {formatTime(selectedTime.hours, selectedTime.minutes)}
          </div>
          <div className="text-sm text-gray-600">
            {(() => {
              const date = new Date(selectedDate)
              date.setHours(selectedTime.hours, selectedTime.minutes, 0, 0)
              const now = new Date()
              const diffMs = date.getTime() - now.getTime()
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
              
              if (diffMs > 0) {
                return `あと ${diffHours}時間${diffMinutes}分`
              } else {
                return '過去の時間が選択されています'
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}