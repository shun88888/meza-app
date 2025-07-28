'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'
import { formatAddress } from '@/lib/addressFormatter'
import { ArrowUpRight, ArrowDownLeft, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Challenge {
  id: string
  target_time: string
  target_address: string
  penalty_amount: number
  status: 'completed' | 'failed' | 'pending' | 'active'
  created_at: string
  completed_at: string | null
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  challenge_id: string
  challenges?: Challenge
}

interface HistoryItem {
  id: string
  type: 'penalty' | 'success'
  amount: number
  description: string
  date: string
  target_address: string
  status: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser)

        const supabase = createClientSideClient()
        if (!supabase) {
          console.error('Failed to create Supabase client')
          return
        }
        
        // Fetch challenges with payment data
        const { data: challenges, error: challengesError } = await supabase
          .from('challenges')
          .select(`
            id,
            target_address,
            penalty_amount,
            status,
            created_at,
            completed_at,
            target_time,
            payments!inner(
              amount,
              status,
              created_at
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })

        if (challengesError) {
          console.error('Error fetching challenges:', challengesError)
          return
        }

        // Transform data for history display
        const items: HistoryItem[] = (challenges || []).map(challenge => {
          const payment = Array.isArray(challenge.payments) ? challenge.payments[0] : challenge.payments
          const isSuccess = challenge.status === 'completed'
          
          return {
            id: challenge.id,
            type: isSuccess ? 'success' : 'penalty',
            amount: payment?.amount || challenge.penalty_amount,
            description: isSuccess ? 'チャレンジ成功' : 'チャレンジ失敗ペナルティ',
            date: format(new Date(challenge.completed_at || challenge.created_at), 'M月d日', { locale: ja }),
            target_address: formatAddress(challenge.target_address),
            status: challenge.status
          }
        })

        setHistoryItems(items)
      } catch (error) {
        console.error('Error loading history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [router])

  const getTransactionIcon = (type: 'penalty' | 'success') => {
    if (type === 'success') {
      return <ArrowDownLeft size={20} className="text-green-600" />
    }
    return <ArrowUpRight size={20} className="text-red-600" />
  }

  const getTransactionColor = (type: 'penalty' | 'success') => {
    if (type === 'success') {
      return 'text-green-600'
    }
    return 'text-red-600'
  }

  const formatAmount = (amount: number, type: 'penalty' | 'success') => {
    const sign = type === 'success' ? '+' : '-'
    return `${sign}¥${amount.toLocaleString()}`
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownLeft size={20} className="text-gray-600 dark:text-gray-400 rotate-45" />
            </button>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">履歴</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* Transactions Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">チャレンジ履歴</h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              すべて見る
            </button>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {historyItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                まだチャレンジ履歴がありません
              </div>
            ) : (
              historyItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                      {getTransactionIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.target_address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description} • {item.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${getTransactionColor(item.type)}`}>
                      {formatAmount(item.amount, item.type)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{item.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}