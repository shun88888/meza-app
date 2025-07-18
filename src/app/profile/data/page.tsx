'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClientSideClient, getCurrentUser } from '@/lib/supabase'
import { formatAddress } from '@/lib/addressFormatter'

interface DataStats {
  totalChallenges: number
  successfulChallenges: number
  failedChallenges: number
  totalPenaltyPaid: number
  averageDistance: number
  totalDistance: number
  dataSize: string
  lastBackup: string
  currentStreak: number
  longestStreak: number
  averageWakeTime: string
  earlyBirdDays: number
}

interface ChallengeHistory {
  id: string
  date: string
  status: 'success' | 'failed'
  distance: number
  penaltyAmount?: number
  location: string
  wakeTime?: string
  targetTime?: string
  timeToTarget?: number
}

interface ChartData {
  date: string
  success: number
  failure: number
  penalty: number
}

interface TimeAnalysis {
  hour: number
  successCount: number
  totalCount: number
  successRate: number
}

interface LocationAnalysis {
  location: string
  successCount: number
  totalCount: number
  successRate: number
  averagePenalty: number
}

// ヘルパー関数
function calculateStreaks(challenges: any[]) {
  const sortedChallenges = [...challenges]
    .filter(c => c.status === 'completed' || c.status === 'failed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // 最長連続成功数の計算
  for (const challenge of sortedChallenges) {
    if (challenge.status === 'completed') {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // 現在の連続成功数の計算（最新から遡って）
  for (let i = sortedChallenges.length - 1; i >= 0; i--) {
    if (sortedChallenges[i].status === 'completed') {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, longestStreak }
}

function calculateAverageWakeTime(challenges: any[]) {
  const challengesWithTime = challenges.filter(c => c.target_time)
  if (challengesWithTime.length === 0) return '06:30'

  const totalMinutes = challengesWithTime.reduce((sum, c) => {
    const date = new Date(c.target_time)
    return sum + (date.getHours() * 60 + date.getMinutes())
  }, 0)

  const averageMinutes = totalMinutes / challengesWithTime.length
  const hours = Math.floor(averageMinutes / 60)
  const minutes = Math.round(averageMinutes % 60)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function calculateTimeToTarget(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) return 0
  
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // 分単位
}

export default function DataPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DataStats>({
    totalChallenges: 0,
    successfulChallenges: 0,
    failedChallenges: 0,
    totalPenaltyPaid: 0,
    averageDistance: 0,
    totalDistance: 0,
    dataSize: '0 MB',
    lastBackup: 'なし',
    currentStreak: 0,
    longestStreak: 0,
    averageWakeTime: '06:30',
    earlyBirdDays: 0
  })
  const [history, setHistory] = useState<ChallengeHistory[]>([])
  const [exporting, setExporting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'analysis' | 'export'>('overview')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeAnalysis, setTimeAnalysis] = useState<TimeAnalysis[]>([])
  const [locationAnalysis, setLocationAnalysis] = useState<LocationAnalysis[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/auth/signin')
          return
        }

        const supabase = createClientSideClient()
        
        // チャレンジデータを取得
        const { data: challenges, error: challengesError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (challengesError) {
          console.error('Error fetching challenges:', challengesError)
          return
        }

        // 決済データを取得
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'succeeded')

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError)
        }

        // 統計データの計算
        const totalChallenges = challenges?.length || 0
        const successfulChallenges = challenges?.filter(c => c.status === 'completed').length || 0
        const failedChallenges = challenges?.filter(c => c.status === 'failed').length || 0
        const totalPenaltyPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

        // 距離の計算
        const challengesWithDistance = challenges?.filter(c => c.distance_to_target && c.distance_to_target > 0) || []
        const totalDistance = challengesWithDistance.reduce((sum, c) => sum + (c.distance_to_target || 0), 0)
        const averageDistance = challengesWithDistance.length > 0 ? totalDistance / challengesWithDistance.length : 0

        // 連続成功数の計算
        const { currentStreak, longestStreak } = calculateStreaks(challenges || [])

        // 平均起床時間の計算
        const averageWakeTime = calculateAverageWakeTime(challenges || [])

        // 早起き日数の計算（7時前の起床）
        const earlyBirdDays = challenges?.filter(c => {
          if (!c.target_time) return false
          const hour = new Date(c.target_time).getHours()
          return hour < 7
        }).length || 0

        setStats({
          totalChallenges,
          successfulChallenges,
          failedChallenges,
          totalPenaltyPaid,
          averageDistance: Math.round(averageDistance),
          totalDistance: Math.round(totalDistance),
          dataSize: `${Math.round(totalChallenges * 0.1)} MB`,
          lastBackup: 'なし', // バックアップ機能は未実装
          currentStreak,
          longestStreak,
          averageWakeTime,
          earlyBirdDays
        })

        // 履歴データの変換
        const historyData = challenges?.map(c => ({
          id: c.id,
          date: new Date(c.created_at).toLocaleDateString(),
          status: c.status === 'completed' ? 'success' as const : 'failed' as const,
          distance: c.distance_to_target || 0,
          penaltyAmount: c.status === 'failed' ? c.penalty_amount : undefined,
          location: formatAddress(c.target_address),
          wakeTime: c.target_time,
          targetTime: c.target_time,
          timeToTarget: calculateTimeToTarget(c.started_at, c.completed_at)
        })) || []

        setHistory(historyData)

        // チャートデータの生成（実際のデータから）
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toISOString().split('T')[0]
        })

        const chartData = last7Days.map(date => {
          const dayData = challenges?.filter(c => 
            new Date(c.created_at).toISOString().split('T')[0] === date
          ) || []
          
          const success = dayData.filter(c => c.status === 'completed').length
          const failure = dayData.filter(c => c.status === 'failed').length
          const penalty = dayData
            .filter(c => c.status === 'failed')
            .reduce((sum, c) => sum + c.penalty_amount, 0)

          return {
            date,
            success,
            failure,
            penalty
          }
        })

        setChartData(chartData)

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleExport = async () => {
    setExporting(true)
    try {
      // Mock export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock CSV data
      const csvContent = `日付,ステータス,距離(km),ペナルティ(円),場所\n${history.map(h => 
        `${h.date},${h.status === 'success' ? '成功' : '失敗'},${h.distance},${h.penaltyAmount || 0},${h.location}`
      ).join('\n')}`
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `meza-challenge-history-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      alert('データをエクスポートしました')
    } catch (error) {
      console.error('Export failed:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      // Mock backup process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setStats(prev => ({
        ...prev,
        lastBackup: new Date().toLocaleString('ja-JP')
      }))
      
      alert('バックアップが完了しました')
    } catch (error) {
      console.error('Backup failed:', error)
      alert('バックアップに失敗しました')
    } finally {
      setBackingUp(false)
    }
  }

  const handleDeleteData = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      if (confirm('本当に削除しますか？')) {
        alert('データを削除しました')
        setStats({
          totalChallenges: 0,
          successfulChallenges: 0,
          failedChallenges: 0,
          totalPenaltyPaid: 0,
          averageDistance: 0,
          totalDistance: 0,
          dataSize: '0 MB',
          lastBackup: 'なし',
          currentStreak: 0,
          longestStreak: 0,
          averageWakeTime: '06:30',
          earlyBirdDays: 0
        })
        setHistory([])
        setChartData([])
        setTimeAnalysis([])
        setLocationAnalysis([])
      }
    }
  }

  // Simple bar chart component
  const SimpleBarChart = ({ data, title, color = '#FFAD2F' }: { data: { label: string; value: number }[], title: string, color?: string }) => {
    const maxValue = Math.max(...data.map(d => d.value))
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-800 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-16 text-sm text-gray-600 flex-shrink-0">
                {item.label}
              </div>
              <div className="flex-1 mx-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: color 
                    }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm text-gray-800 text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Success rate progress circle
  const ProgressCircle = ({ percentage, size = 80, strokeWidth = 8 }: { percentage: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFAD2F"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-lg font-bold text-gray-800">{percentage.toFixed(1)}%</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">データ分析</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: '概要', icon: '📊' },
            { id: 'charts', label: 'グラフ', icon: '📈' },
            { id: 'analysis', label: '分析', icon: '🔍' },
            { id: 'export', label: 'エクスポート', icon: '💾' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Enhanced Statistics */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📊</span>
                  統計概要
                </h2>
              </div>
              <div className="p-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-500">{stats.totalChallenges}</div>
                    <div className="text-sm text-gray-600">総チャレンジ数</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-500">{stats.successfulChallenges}</div>
                    <div className="text-sm text-gray-600">成功数</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-500">{stats.failedChallenges}</div>
                    <div className="text-sm text-gray-600">失敗数</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-500">¥{stats.totalPenaltyPaid.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">総ペナルティ</div>
                  </div>
                </div>

                {/* Success Rate Circle */}
                <div className="text-center mb-6">
                  <ProgressCircle percentage={(stats.successfulChallenges / stats.totalChallenges) * 100} size={120} />
                  <div className="mt-2 text-lg font-semibold text-gray-800">成功率</div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-500">{stats.currentStreak}</div>
                    <div className="text-sm text-gray-600">現在の連続成功</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-500">{stats.longestStreak}</div>
                    <div className="text-sm text-gray-600">最長連続記録</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.averageWakeTime}</div>
                    <div className="text-sm text-gray-600">平均起床時間</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-500">{stats.earlyBirdDays}</div>
                    <div className="text-sm text-gray-600">早起き達成日数</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📅</span>
                  最近のアクティビティ
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {history.slice(0, 5).map((challenge) => (
                  <div key={challenge.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          challenge.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-800">
                            {challenge.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            {challenge.date} • 起床: {challenge.wakeTime} • 移動時間: {challenge.timeToTarget}分
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          challenge.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {challenge.status === 'success' ? '成功' : '失敗'}
                        </div>
                        {challenge.penaltyAmount && (
                          <div className="text-sm text-red-500">
                            -¥{challenge.penaltyAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📈</span>
                データ可視化
              </h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="week">過去1週間</option>
                <option value="month">過去1ヶ月</option>
                <option value="year">過去1年</option>
              </select>
            </div>

            {/* Success/Failure Chart */}
            <SimpleBarChart
              data={chartData.map(d => ({ 
                label: new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }), 
                value: d.success 
              }))}
              title="📊 日別成功回数"
              color="#10B981"
            />

            {/* Penalty Chart */}
            <SimpleBarChart
              data={chartData.map(d => ({ 
                label: new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }), 
                value: d.penalty 
              }))}
              title="💰 日別ペナルティ金額"
              color="#EF4444"
            />

            {/* Weekly Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-800 mb-4">📅 週間サマリー</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {chartData.reduce((sum, d) => sum + d.success, 0)}
                  </div>
                  <div className="text-sm text-gray-500">成功回数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {chartData.reduce((sum, d) => sum + d.failure, 0)}
                  </div>
                  <div className="text-sm text-gray-500">失敗回数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    ¥{chartData.reduce((sum, d) => sum + d.penalty, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">ペナルティ合計</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🔍</span>
              詳細分析
            </h2>

            {/* Time Analysis */}
            <SimpleBarChart
              data={timeAnalysis.slice(0, 6).map(t => ({ 
                label: `${t.hour}時`, 
                value: Math.round(t.successRate) 
              }))}
              title="⏰ 時間別成功率（%）"
              color="#8B5CF6"
            />

            {/* Location Analysis */}
            <SimpleBarChart
              data={locationAnalysis.slice(0, 5).map(l => ({ 
                label: l.location, 
                value: Math.round(l.successRate) 
              }))}
              title="📍 場所別成功率（%）"
              color="#F59E0B"
            />

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                分析結果とアドバイス
              </h3>
              <div className="space-y-2 text-blue-700 text-sm">
                {stats.currentStreak >= 3 && (
                  <div className="flex items-start">
                    <span className="mr-2">🔥</span>
                    <span>素晴らしい！{stats.currentStreak}日連続で成功中です。この調子で継続しましょう。</span>
                  </div>
                )}
                {(stats.successfulChallenges / stats.totalChallenges) >= 0.8 && (
                  <div className="flex items-start">
                    <span className="mr-2">⭐</span>
                    <span>成功率が80%を超えています。非常に良い成果です！</span>
                  </div>
                )}
                {timeAnalysis.length > 0 && (
                  <div className="flex items-start">
                    <span className="mr-2">⏰</span>
                    <span>
                      {timeAnalysis.sort((a, b) => b.successRate - a.successRate)[0].hour}時台が最も成功率が高いようです。
                    </span>
                  </div>
                )}
                {locationAnalysis.length > 0 && (
                  <div className="flex items-start">
                    <span className="mr-2">📍</span>
                    <span>
                      {locationAnalysis.sort((a, b) => b.successRate - a.successRate)[0].location}での成功率が最も高いです。
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">💾</span>
              データエクスポート・管理
            </h2>

            {/* Data Management */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">データ管理</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">データサイズ</h4>
                      <p className="text-sm text-gray-500">{stats.dataSize}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">最終バックアップ</h4>
                      <p className="text-sm text-gray-500">{stats.lastBackup}</p>
                    </div>
                    <Button
                      onClick={handleBackup}
                      disabled={backingUp}
                      variant="outline"
                      size="sm"
                    >
                      {backingUp ? 'バックアップ中...' : 'バックアップ'}
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">データエクスポート</h4>
                      <p className="text-sm text-gray-500">CSV形式でダウンロード</p>
                    </div>
                    <Button
                      onClick={handleExport}
                      disabled={exporting}
                      variant="outline"
                      size="sm"
                    >
                      {exporting ? 'エクスポート中...' : 'エクスポート'}
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">キャッシュクリア</h4>
                      <p className="text-sm text-gray-500">アプリのキャッシュを削除</p>
                    </div>
                    <Button variant="outline" size="sm">
                      クリア
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">エクスポート形式</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <button className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <div className="font-medium text-gray-800">CSV形式（詳細）</div>
                          <div className="text-sm text-gray-500">すべてのチャレンジデータを含む詳細レポート</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📈</span>
                        <div>
                          <div className="font-medium text-gray-800">統計サマリー</div>
                          <div className="text-sm text-gray-500">統計データのみのサマリーレポート</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <div className="font-medium text-gray-800">支払い履歴</div>
                          <div className="text-sm text-gray-500">ペナルティ支払い履歴のみ</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-lg border border-red-200">
              <div className="p-6 border-b border-red-200">
                <h3 className="text-lg font-semibold text-red-800">危険な操作</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-800">データ削除</h4>
                    <p className="text-sm text-red-600">すべてのチャレンジ履歴と設定を削除</p>
                  </div>
                  <Button
                    onClick={handleDeleteData}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-100"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">🔒</div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">プライバシーについて</h3>
                  <p className="text-sm text-blue-700">
                    あなたのデータは安全に暗号化され、あなたのみがアクセスできます。
                    データの削除やエクスポートは完全にあなたの管理下にあります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 