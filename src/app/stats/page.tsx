'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'
import { ArrowDownLeft, Bell } from 'lucide-react'

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
      if (!supabase) {
        console.error('Failed to create Supabase client')
        return
      }
      
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
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">統計</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 dark:text-gray-400">統計を読み込み中...</div>
          </div>
        ) : !stats ? (
          <div className="text-center py-20">
            <div className="text-gray-500 dark:text-gray-400">統計データを読み込めませんでした</div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Main Success Rate Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 text-gray-900 dark:text-white">
              <div className="text-center">
                <div className="text-6xl font-light mb-2">{stats.successRate.toFixed(0)}%</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">成功率</div>
                <div className="mt-4 flex justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                        fill="none"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="2"
                        className="dark:stroke-white/20"
                      />
                      <path
                        d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                        fill="none"
                        stroke="#FFC700"
                        strokeWidth="2"
                        strokeDasharray={`${stats.successRate}, 100`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalChallenges}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">総チャレンジ</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold text-green-600">{stats.successCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">成功回数</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">現在の連続</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.bestStreak}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">最高連続</div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">パフォーマンス</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPeriod('week')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      selectedPeriod === 'week'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    週間
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('month')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      selectedPeriod === 'month'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    月間
                  </button>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="space-y-3">
                {(selectedPeriod === 'week' ? stats.weeklyStats : stats.monthlyStats).map((item, index) => {
                  const total = item.success + item.failed
                  const maxTotal = Math.max(...(selectedPeriod === 'week' ? stats.weeklyStats : stats.monthlyStats).map(i => i.success + i.failed), 1)
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 text-xs text-gray-500 dark:text-gray-400 text-right">
                        {'day' in item ? item.day : item.month}
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full flex">
                          {item.success > 0 && (
                            <div
                              className="bg-green-500 h-full"
                              style={{ width: `${(item.success / maxTotal) * 100}%` }}
                            />
                          )}
                          {item.failed > 0 && (
                            <div
                              className="bg-red-500 h-full"
                              style={{ width: `${(item.failed / maxTotal) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="w-8 text-xs text-gray-500 dark:text-gray-400 text-right">
                        {total}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Penalty Stats */}
            {stats.totalPenalty > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">ペナルティ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xl font-bold text-red-600">¥{stats.totalPenalty.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">総額</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">¥{Math.round(stats.averagePenalty).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">平均</div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement Badge */}
            {(stats.successRate >= 60 || stats.currentStreak > 0) && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">🏆</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {stats.successRate >= 80 ? '素晴らしい成果！' :
                       stats.successRate >= 60 ? '順調に成長中' :
                       'いい調子です'}
                    </div>
                    <div className="text-xs opacity-90">
                      {stats.successRate >= 80 ? 'この調子で継続しましょう' :
                       stats.successRate >= 60 ? 'もう少しで目標達成' :
                       `${stats.currentStreak}日連続成功中`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom spacing for mobile navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}