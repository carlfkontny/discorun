import { supabase } from '@/lib/supabase'
import { ATHLETE_NAMES } from './athletes'

// Supabase table name - adjust if your table has a different name
const TABLE_NAME = 'Zapier'

const YEAR_2026_START = '2026-01-01'
const YEAR_2026_END = '2027-01-01'

// Helper function to fetch all activities with pagination
async function fetchAllActivities(filters: {
  type?: string[]
  movingTimeMin?: number
  startDate?: string
  endDate?: string
}) {
  let allActivities: any[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .range(from, from + pageSize - 1)

    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    if (filters.movingTimeMin !== undefined) {
      query = query.gte('moving_time', filters.movingTimeMin)
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lt('start_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    if (data && data.length > 0) {
      allActivities = [...allActivities, ...data]
      from += pageSize
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  return allActivities
}

// Get total distance for walk/run/hike activities in 2026 using aggregation
export async function getTotalWalkRunHikeDistance(): Promise<number> {
  // Sum all distances (handling pagination if needed)
  let total = 0
  let from = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data: pageData, error: pageError } = await supabase
      .from(TABLE_NAME)
      .select('distance_in_k')
      .in('type', ['Run', 'Walk', 'Hike'])
      .gte('start_date', YEAR_2026_START)
      .lt('start_date', YEAR_2026_END)
      .range(from, from + pageSize - 1)

    if (pageError) {
      console.error('Supabase query error:', pageError)
      throw new Error(`Failed to fetch activities: ${pageError.message || JSON.stringify(pageError)}`)
    }

    if (pageData && pageData.length > 0) {
      const pageSum = pageData.reduce((sum, activity) => {
        return sum + (parseFloat(activity.distance_in_k) || 0)
      }, 0)
      total += pageSum
      from += pageSize
      hasMore = pageData.length === pageSize
    } else {
      hasMore = false
    }
  }

  return total
}

// Get monthly walk/run/hike data for 2026
export async function getMonthlyWalkRunHikeData(): Promise<Array<{ month: string; actual: number; target: number }>> {
  const activities = await fetchAllActivities({
    type: ['Run', 'Walk', 'Hike'],
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  // Group by month
  const monthlyData: Record<string, number> = {}
  
  activities.forEach((activity) => {
    const date = new Date(activity.start_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const distance = parseFloat(activity.distance_in_k) || 0
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + distance
  })

  // Create array with cumulative values
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', 
                  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']
  const targetPerMonth = 6500 / 12

  let cumulativeActual = 0
  let cumulativeTarget = 0

  return months.map((month, index) => {
    cumulativeActual += monthlyData[month] || 0
    cumulativeTarget += targetPerMonth

    return {
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      actual: Math.round(cumulativeActual * 100) / 100,
      target: Math.round(cumulativeTarget * 100) / 100,
    }
  })
}

// Get walk/run leaderboard
export async function getWalkRunLeaderboard(): Promise<Array<{ name: string; value: number }>> {
  const activities = await fetchAllActivities({
    type: ['Run', 'Walk'],
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  const totals: Record<number, number> = {}

  activities.forEach((activity) => {
    const athleteId = activity.athlete_id
    const distance = parseFloat(activity.distance_in_k) || 0
    totals[athleteId] = (totals[athleteId] || 0) + distance
  })

  return Object.entries(totals)
    .map(([athleteId, total]) => ({
      name: ATHLETE_NAMES[parseInt(athleteId)] || `Athlete ${athleteId}`,
      value: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value)
}

// Get elevation leaderboard for walk/run
export async function getElevationLeaderboard(): Promise<Array<{ name: string; value: number }>> {
  const activities = await fetchAllActivities({
    type: ['Run', 'Walk'],
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  const totals: Record<number, number> = {}

  activities.forEach((activity) => {
    const athleteId = activity.athlete_id
    const elevation = parseFloat(activity.total_elevation_gain) || 0
    totals[athleteId] = (totals[athleteId] || 0) + elevation
  })

  return Object.entries(totals)
    .map(([athleteId, total]) => ({
      name: ATHLETE_NAMES[parseInt(athleteId)] || `Athlete ${athleteId}`,
      value: Math.round(total),
    }))
    .sort((a, b) => b.value - a.value)
}

// Get strength workouts leaderboard (moving_time >= 30 minutes)
export async function getStrengthWorkoutsLeaderboard(): Promise<Array<{ name: string; value: number }>> {
  // Common strength workout types in Strava
  const strengthTypes = ['WeightTraining', 'Workout', 'Crossfit']
  
  const activities = await fetchAllActivities({
    type: strengthTypes,
    movingTimeMin: 30,
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  const counts: Record<number, number> = {}

  activities.forEach((activity) => {
    const athleteId = activity.athlete_id
    counts[athleteId] = (counts[athleteId] || 0) + 1
  })

  return Object.entries(counts)
    .map(([athleteId, count]) => ({
      name: ATHLETE_NAMES[parseInt(athleteId)] || `Athlete ${athleteId}`,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
}

// Get bike leaderboard
export async function getBikeLeaderboard(): Promise<Array<{ name: string; value: number }>> {
  const bikeTypes = ['Ride', 'VirtualRide', 'EBikeRide']
  
  const activities = await fetchAllActivities({
    type: bikeTypes,
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  const totals: Record<number, number> = {}

  activities.forEach((activity) => {
    const athleteId = activity.athlete_id
    const distance = parseFloat(activity.distance_in_k) || 0
    totals[athleteId] = (totals[athleteId] || 0) + distance
  })

  return Object.entries(totals)
    .map(([athleteId, total]) => ({
      name: ATHLETE_NAMES[parseInt(athleteId)] || `Athlete ${athleteId}`,
      value: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value)
}

// Get skiing leaderboard
export async function getSkiingLeaderboard(): Promise<Array<{ name: string; value: number }>> {
  const skiingTypes = ['NordicSki', 'AlpineSki', 'BackcountrySki']
  
  const activities = await fetchAllActivities({
    type: skiingTypes,
    startDate: YEAR_2026_START,
    endDate: YEAR_2026_END,
  })

  const totals: Record<number, number> = {}

  activities.forEach((activity) => {
    const athleteId = activity.athlete_id
    const distance = parseFloat(activity.distance_in_k) || 0
    totals[athleteId] = (totals[athleteId] || 0) + distance
  })

  return Object.entries(totals)
    .map(([athleteId, total]) => ({
      name: ATHLETE_NAMES[parseInt(athleteId)] || `Athlete ${athleteId}`,
      value: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value)
}

