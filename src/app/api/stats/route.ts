import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

interface StatsCalculation {
  totalChallenges: number
  successCount: number
  failedCount: number
  successRate: number
  totalPenalty: number
  averagePenalty: number
  bestStreak: number
  currentStreak: number
  weeklyStats: { day: string; success: number; failed: number; date: string }[]
  monthlyStats: { month: string; success: number; failed: number; year: number }[]
  timePatterns: {
    morningSuccessRate: number
    afternoonSuccessRate: number
    eveningSuccessRate: number
    bestTimeOfDay: string
  }
  penaltyTrends: {
    averagePenaltyThisMonth: number
    averagePenaltyLastMonth: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  geographicStats: {
    mostSuccessfulLocation: string
    leastSuccessfulLocation: string
    averageDistanceToTarget: number
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSideClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // all, week, month, year

    // Fetch challenges
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply period filter
    if (period !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // All time
      }

      query = query.gte('created_at', startDate.toISOString())
    }

    const { data: challenges, error } = await query

    if (error) {
      console.error('Error fetching challenges:', error)
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
    }

    const allChallenges = challenges || []
    const completedChallenges = allChallenges.filter(c => c.status === 'completed' || c.status === 'failed')
    const successfulChallenges = allChallenges.filter(c => c.status === 'completed')
    const failedChallenges = allChallenges.filter(c => c.status === 'failed')

    // Basic stats
    const totalPenalty = failedChallenges.reduce((sum, c) => sum + (c.penalty_amount || 0), 0)
    const successRate = completedChallenges.length > 0 ? (successfulChallenges.length / completedChallenges.length) * 100 : 0

    // Calculate streaks
    const { bestStreak, currentStreak } = calculateStreaks(completedChallenges)

    // Calculate weekly stats (last 7 days)
    const weeklyStats = calculateWeeklyStats(completedChallenges)

    // Calculate monthly stats (last 6 months)
    const monthlyStats = calculateMonthlyStats(completedChallenges)

    // Calculate time patterns
    const timePatterns = calculateTimePatterns(completedChallenges)

    // Calculate penalty trends
    const penaltyTrends = calculatePenaltyTrends(failedChallenges)

    // Calculate geographic stats
    const geographicStats = calculateGeographicStats(completedChallenges)

    const stats: StatsCalculation = {
      totalChallenges: allChallenges.length,
      successCount: successfulChallenges.length,
      failedCount: failedChallenges.length,
      successRate,
      totalPenalty,
      averagePenalty: failedChallenges.length > 0 ? totalPenalty / failedChallenges.length : 0,
      bestStreak,
      currentStreak,
      weeklyStats,
      monthlyStats,
      timePatterns,
      penaltyTrends,
      geographicStats
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStreaks(challenges: any[]) {
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

function calculateWeeklyStats(challenges: any[]) {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const dayIndex = date.getDay()
    
    const dayStats = { 
      day: days[dayIndex], 
      success: 0, 
      failed: 0,
      date: date.toISOString().split('T')[0]
    }

    challenges.forEach(challenge => {
      const challengeDate = new Date(challenge.created_at)
      if (challengeDate.toDateString() === date.toDateString()) {
        if (challenge.status === 'completed') {
          dayStats.success++
        } else if (challenge.status === 'failed') {
          dayStats.failed++
        }
      }
    })

    return dayStats
  })
}

function calculateMonthlyStats(challenges: any[]) {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const now = new Date()
  const stats: { month: string; success: number; failed: number; year: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = months[monthDate.getMonth()]
    const monthStats = { month: monthName, success: 0, failed: 0, year: monthDate.getFullYear() }

    challenges.forEach(challenge => {
      const challengeDate = new Date(challenge.created_at)
      if (challengeDate.getFullYear() === monthDate.getFullYear() && 
          challengeDate.getMonth() === monthDate.getMonth()) {
        if (challenge.status === 'completed') {
          monthStats.success++
        } else if (challenge.status === 'failed') {
          monthStats.failed++
        }
      }
    })

    stats.push(monthStats)
  }

  return stats
}

function calculateTimePatterns(challenges: any[]) {
  const morningChallenges = challenges.filter(c => {
    const hour = new Date(c.target_time || c.created_at).getHours()
    return hour >= 5 && hour < 12
  })
  
  const afternoonChallenges = challenges.filter(c => {
    const hour = new Date(c.target_time || c.created_at).getHours()
    return hour >= 12 && hour < 18
  })
  
  const eveningChallenges = challenges.filter(c => {
    const hour = new Date(c.target_time || c.created_at).getHours()
    return hour >= 18 || hour < 5
  })

  const morningSuccessRate = morningChallenges.length > 0 ? 
    (morningChallenges.filter(c => c.status === 'completed').length / morningChallenges.length) * 100 : 0
  const afternoonSuccessRate = afternoonChallenges.length > 0 ? 
    (afternoonChallenges.filter(c => c.status === 'completed').length / afternoonChallenges.length) * 100 : 0
  const eveningSuccessRate = eveningChallenges.length > 0 ? 
    (eveningChallenges.filter(c => c.status === 'completed').length / eveningChallenges.length) * 100 : 0

  let bestTimeOfDay = '朝'
  let bestRate = morningSuccessRate

  if (afternoonSuccessRate > bestRate) {
    bestTimeOfDay = '昼'
    bestRate = afternoonSuccessRate
  }
  if (eveningSuccessRate > bestRate) {
    bestTimeOfDay = '夜'
  }

  return {
    morningSuccessRate,
    afternoonSuccessRate,
    eveningSuccessRate,
    bestTimeOfDay
  }
}

function calculatePenaltyTrends(failedChallenges: any[]) {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthChallenges = failedChallenges.filter(c => 
    new Date(c.created_at) >= thisMonth
  )
  const lastMonthChallenges = failedChallenges.filter(c => 
    new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth
  )

  const averagePenaltyThisMonth = thisMonthChallenges.length > 0 ?
    thisMonthChallenges.reduce((sum, c) => sum + c.penalty_amount, 0) / thisMonthChallenges.length : 0
  const averagePenaltyLastMonth = lastMonthChallenges.length > 0 ?
    lastMonthChallenges.reduce((sum, c) => sum + c.penalty_amount, 0) / lastMonthChallenges.length : 0

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (averagePenaltyThisMonth > averagePenaltyLastMonth * 1.1) {
    trend = 'increasing'
  } else if (averagePenaltyThisMonth < averagePenaltyLastMonth * 0.9) {
    trend = 'decreasing'
  }

  return {
    averagePenaltyThisMonth,
    averagePenaltyLastMonth,
    trend
  }
}

function calculateGeographicStats(challenges: any[]) {
  const locationSuccessRates = new Map<string, { success: number; total: number }>()
  let totalDistance = 0
  let distanceCount = 0

  challenges.forEach(challenge => {
    if (challenge.target_address) {
      // Simplify address to general area
      const area = challenge.target_address.split(',')[0] || challenge.target_address
      const current = locationSuccessRates.get(area) || { success: 0, total: 0 }
      current.total++
      if (challenge.status === 'completed') {
        current.success++
      }
      locationSuccessRates.set(area, current)
    }

    if (challenge.distance_to_target && challenge.distance_to_target > 0) {
      totalDistance += challenge.distance_to_target
      distanceCount++
    }
  })

  let mostSuccessfulLocation = '未設定'
  let leastSuccessfulLocation = '未設定'
  let bestRate = -1
  let worstRate = 101

  locationSuccessRates.forEach((stats, location) => {
    if (stats.total >= 2) { // Only consider locations with at least 2 challenges
      const rate = (stats.success / stats.total) * 100
      if (rate > bestRate) {
        bestRate = rate
        mostSuccessfulLocation = location
      }
      if (rate < worstRate) {
        worstRate = rate
        leastSuccessfulLocation = location
      }
    }
  })

  return {
    mostSuccessfulLocation,
    leastSuccessfulLocation,
    averageDistanceToTarget: distanceCount > 0 ? totalDistance / distanceCount : 0
  }
}