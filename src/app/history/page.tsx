'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'
import { formatAddress } from '@/lib/addressFormatter'

interface Challenge {
  id: string
  target_time: string
  target_address: string
  penalty_amount: number
  status: 'completed' | 'failed' | 'pending' | 'active'
  created_at: string
  completed_at: string | null
}

interface HistoryItem {
  id: string
  date: string
  time: string
  location: string
  status: 'success' | 'failed'
  penaltyAmount?: number
  successTime?: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const supabase = createClientSideClient()
      const user = await getCurrentUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'failed'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading history:', error)
        return
      }

      const historyData: HistoryItem[] = challenges?.map((challenge: Challenge) => ({
        id: challenge.id,
        date: new Date(challenge.created_at).toLocaleDateString('ja-JP'),
        time: new Date(challenge.target_time).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: formatAddress(challenge.target_address),
        status: challenge.status === 'completed' ? 'success' as const : 'failed' as const,
        penaltyAmount: challenge.status === 'failed' ? challenge.penalty_amount : undefined,
        successTime: challenge.completed_at ? new Date(challenge.completed_at).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : undefined
      })) || []

      setHistory(historyData)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      return a.status.localeCompare(b.status)
    }
  })

  const getStatusIcon = (status: 'success' | 'failed') => {
    if (status === 'success') {
      return <span className="text-green-600">✓</span>
    } else {
      return <span className="text-red-600">✗</span>
    }
  }

  const getStatusColor = (status: 'success' | 'failed') => {
    if (status === 'success') {
      return 'bg-green-100 text-green-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  const getStatusText = (status: 'success' | 'failed') => {
    if (status === 'success') {
      return '成功'
    } else {
      return '失敗'
    }
  }

  const successCount = history.filter(item => item.status === 'success').length
  const failedCount = history.filter(item => item.status === 'failed').length
  const totalPenalty = history.reduce((sum, item) => sum + (item.penaltyAmount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6 pt-safe">
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
            <h1 className="ml-2 text-xl font-semibold text-gray-900">チャレンジ履歴</h1>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{history.length}</div>
            <div className="text-sm text-gray-600">総チャレンジ</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">成功</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-gray-600">失敗</div>
          </div>
        </div>

        {totalPenalty > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <div>
                <div className="font-medium text-red-800">総ペナルティ金額</div>
                <div className="text-sm text-red-700">¥{totalPenalty.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            成功のみ
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'failed' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            失敗のみ
          </button>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">履歴を読み込み中...</div>
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">履歴がありません</div>
            <button
              onClick={() => router.push('/create-challenge')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              チャレンジを作成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{item.date}</div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-gray-700">目標時刻: {item.time}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-gray-700">場所: {item.location}</span>
                  </div>

                  {item.status === 'success' && item.successTime && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-green-700">到着時刻: {item.successTime}</span>
                    </div>
                  )}

                  {item.penaltyAmount && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-red-700">ペナルティ: ¥{item.penaltyAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}