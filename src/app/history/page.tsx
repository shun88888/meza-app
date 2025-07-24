'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'
import { formatAddress } from '@/lib/addressFormatter'
import { ArrowUpRight, ArrowDownLeft, Bell } from 'lucide-react'

interface Challenge {
  id: string
  target_time: string
  target_address: string
  penalty_amount: number
  status: 'completed' | 'failed' | 'pending' | 'active'
  created_at: string
  completed_at: string | null
}

interface Transaction {
  id: string
  type: 'penalty' | 'refund' | 'bonus'
  amount: number
  description: string
  date: string
  recipient?: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Mock transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'penalty',
      amount: 1923,
      description: 'チャレンジ失敗ペナルティ',
      date: 'Nov 12',
      recipient: 'Ada Femi'
    },
    {
      id: '2',
      type: 'refund',
      amount: 1532,
      description: 'チャレンジ成功リファンド',
      date: 'Nov 14',
      recipient: 'Musa Adebayor'
    },
    {
      id: '3',
      type: 'penalty',
      amount: 950,
      description: 'チャレンジ失敗ペナルティ',
      date: 'Nov 12',
      recipient: 'Nneka Malik'
    },
    {
      id: '4',
      type: 'penalty',
      amount: 190,
      description: 'チャレンジ失敗ペナルティ',
      date: 'May 26',
      recipient: 'Tunde Ugo'
    }
  ])

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const getTransactionIcon = (type: 'penalty' | 'refund' | 'bonus') => {
    if (type === 'refund') {
      return <ArrowDownLeft size={20} className="text-green-600" />
    }
    return <ArrowUpRight size={20} className="text-gray-600" />
  }

  const getTransactionColor = (type: 'penalty' | 'refund' | 'bonus') => {
    if (type === 'refund') {
      return 'text-green-600'
    }
    return 'text-gray-900'
  }

  const formatAmount = (amount: number, type: 'penalty' | 'refund' | 'bonus') => {
    const sign = type === 'refund' ? '+' : '-'
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

          {/* Transaction List */}
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {transaction.recipient}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {transaction.description} • {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${getTransactionColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                  <p className="text-xs text-gray-400">¥{(transaction.amount * 0.76).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}