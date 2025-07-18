'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'

interface Challenge {
  id: string
  target_time: string
  target_address: string
  penalty_amount: number
  status: 'completed' | 'failed' | 'pending' | 'active'
  created_at: string
  completed_at: string | null
}

interface StatsData {
  totalChallenges: number
  successCount: number
  failedCount: number
  successRate: number
  totalPenalty: number
  averagePenalty: number
  bestStreak: number
  currentStreak: number
  weeklyStats: { day: string; success: number; failed: number }[]
  monthlyStats: { month: string; success: number; failed: number }[]
}

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading stats:', error)
        return
      }

      const allChallenges = challenges || []
      const completedChallenges = allChallenges.filter(c => c.status === 'completed' || c.status === 'failed')
      const successfulChallenges = allChallenges.filter(c => c.status === 'completed')
      const failedChallenges = allChallenges.filter(c => c.status === 'failed')

      const totalPenalty = failedChallenges.reduce((sum, c) => sum + (c.penalty_amount || 0), 0)
      const successRate = completedChallenges.length > 0 ? (successfulChallenges.length / completedChallenges.length) * 100 : 0

      // Calculate streaks
      const { bestStreak, currentStreak } = calculateStreaks(completedChallenges)

      // Calculate weekly stats (last 7 days)
      const weeklyStats = calculateWeeklyStats(completedChallenges)

      // Calculate monthly stats (last 6 months)
      const monthlyStats = calculateMonthlyStats(completedChallenges)

      setStats({
        totalChallenges: allChallenges.length,
        successCount: successfulChallenges.length,
        failedCount: failedChallenges.length,
        successRate,
        totalPenalty,
        averagePenalty: failedChallenges.length > 0 ? totalPenalty / failedChallenges.length : 0,
        bestStreak,
        currentStreak,
        weeklyStats,
        monthlyStats
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreaks = (challenges: Challenge[]) => {
    const sortedChallenges = [...challenges].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let bestStreak = 0
    let currentStreak = 0
    let tempStreak = 0

    for (const challenge of sortedChallenges) {
      if (challenge.status === 'completed') {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Current streak from the end
    for (let i = sortedChallenges.length - 1; i >= 0; i--) {
      if (sortedChallenges[i].status === 'completed') {
        currentStreak++
      } else {
        break
      }
    }

    return { bestStreak, currentStreak }
  }

  const calculateWeeklyStats = (challenges: Challenge[]) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const stats = days.map(day => ({ day, success: 0, failed: 0 }))

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    challenges.forEach(challenge => {
      const challengeDate = new Date(challenge.created_at)
      if (challengeDate >= weekAgo) {
        const dayIndex = challengeDate.getDay()
        if (challenge.status === 'completed') {
          stats[dayIndex].success++
        } else if (challenge.status === 'failed') {
          stats[dayIndex].failed++
        }
      }
    })

    return stats
  }

  const calculateMonthlyStats = (challenges: Challenge[]) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const stats: { month: string; success: number; failed: number }[] = []

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = months[monthDate.getMonth()]
      stats.push({ month: monthName, success: 0, failed: 0 })
    }

    challenges.forEach(challenge => {
      const challengeDate = new Date(challenge.created_at)
      const monthsAgo = (now.getFullYear() - challengeDate.getFullYear()) * 12 + (now.getMonth() - challengeDate.getMonth())
      
      if (monthsAgo >= 0 && monthsAgo < 6) {
        const statIndex = 5 - monthsAgo
        if (challenge.status === 'completed') {
          stats[statIndex].success++
        } else if (challenge.status === 'failed') {
          stats[statIndex].failed++
        }
      }
    })

    return stats
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSuccessRateBg = (rate: number) => {
    if (rate >= 80) return 'bg-green-100'
    if (rate >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

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
            <h1 className="ml-2 text-xl font-semibold text-gray-900">統計</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">統計を読み込み中...</div>
        </div>
      ) : !stats ? (
        <div className="text-center py-20">
          <div className="text-gray-500">統計データを読み込めませんでした</div>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalChallenges}</div>
              <div className="text-sm text-gray-600">総チャレンジ</div>
            </div>
            <div className={`rounded-lg p-4 text-center ${getSuccessRateBg(stats.successRate)}`}>
              <div className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                {stats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">成功率</div>
            </div>
          </div>

          {/* Success/Failure Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successCount}</div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedCount}</div>
              <div className="text-sm text-gray-600">失敗</div>
            </div>
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.bestStreak}</div>
              <div className="text-sm text-gray-600">最高連続成功</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600">現在の連続成功</div>
            </div>
          </div>

          {/* Penalty Stats */}
          {stats.totalPenalty > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-3">ペナルティ統計</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">¥{stats.totalPenalty.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">総ペナルティ</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">¥{Math.round(stats.averagePenalty).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">平均ペナルティ</div>
                </div>
              </div>
            </div>
          )}

          {/* Period Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              週間
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月間
            </button>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedPeriod === 'week' ? '週間パフォーマンス' : '月間パフォーマンス'}
            </h3>
            <div className="space-y-3">
              {(selectedPeriod === 'week' ? stats.weeklyStats : stats.monthlyStats).map((item, index) => {
                const total = item.success + item.failed
                const successRate = total > 0 ? (item.success / total) * 100 : 0
                
                return (
                  <div key={index} className="flex items-center">
                    <div className="w-8 text-sm text-gray-600">{'day' in item ? item.day : item.month}</div>
                    <div className="flex-1 ml-3">
                      <div className="flex h-6 bg-gray-200 rounded-full overflow-hidden">
                        {item.success > 0 && (
                          <div
                            className="bg-green-500 h-full flex items-center justify-center"
                            style={{ width: `${(item.success / Math.max(total, 1)) * 100}%` }}
                          >
                            {item.success > 0 && (
                              <span className="text-xs text-white font-medium">{item.success}</span>
                            )}
                          </div>
                        )}
                        {item.failed > 0 && (
                          <div
                            className="bg-red-500 h-full flex items-center justify-center"
                            style={{ width: `${(item.failed / Math.max(total, 1)) * 100}%` }}
                          >
                            {item.failed > 0 && (
                              <span className="text-xs text-white font-medium">{item.failed}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">
                      {total > 0 ? `${successRate.toFixed(0)}%` : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <div>
                <div className="font-medium text-blue-800">
                  {stats.successRate >= 80 ? '素晴らしい成果です！' :
                   stats.successRate >= 60 ? '順調に成長しています！' :
                   stats.currentStreak > 0 ? '今の調子を維持しましょう！' :
                   '次のチャレンジで挽回しましょう！'}
                </div>
                <div className="text-sm text-blue-700">
                  {stats.successRate >= 80 ? 'この調子で継続していきましょう。' :
                   stats.successRate >= 60 ? 'もう少しで目標達成です。' :
                   stats.currentStreak > 0 ? `${stats.currentStreak}日連続成功中です。` :
                   '小さな一歩から始めましょう。'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}