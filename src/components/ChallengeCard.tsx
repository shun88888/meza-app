'use client'

import { useRouter } from 'next/navigation'
import { formatCurrency, formatTime } from '@/lib/utils'
import type { Challenge } from '@/types'

interface ChallengeCardProps {
  challenge: Challenge
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const router = useRouter()

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return '進行中'
      case 'pending':
        return '待機中'
      case 'completed':
        return '完了'
      case 'failed':
        return '失敗'
      default:
        return '不明'
    }
  }

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow duration-50"
      onClick={() => router.push(`/challenge/${challenge.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            challenge.status
          )}`}
        >
          {getStatusText(challenge.status)}
        </span>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
          {formatCurrency(challenge.penalty_amount)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          目標時刻: {formatTime(challenge.target_time)}
        </div>

        <div className="flex items-start text-sm text-gray-600">
          <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div className="space-y-1">
            <div>
              <span className="font-medium">出発:</span> {challenge.home_address}
            </div>
            <div>
              <span className="font-medium">目標:</span> {challenge.target_address}
            </div>
          </div>
        </div>
      </div>

      {challenge.status === 'pending' && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            タップしてチャレンジを開始
          </p>
        </div>
      )}

      {challenge.status === 'active' && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-[#FFAD2F] font-medium">
            チャレンジ進行中！目標地点に向かってください
          </p>
        </div>
      )}
    </div>
  )
} 