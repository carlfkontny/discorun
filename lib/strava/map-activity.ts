import type { ActivityRow, StravaSummaryActivity } from './types'

function toDateOnly(value?: string) {
  if (!value) {
    return null
  }
  return value.slice(0, 10)
}

export function mapStravaActivity(
  activity: StravaSummaryActivity,
  fallbackAthleteId?: number
): ActivityRow | null {
  const athleteId = activity.athlete?.id ?? fallbackAthleteId
  const startDate = toDateOnly(activity.start_date_local) ?? toDateOnly(activity.start_date)
  if (!activity.id || !athleteId || !startDate) {
    return null
  }

  return {
    strava_activity_id: activity.id,
    athlete_id: athleteId,
    type: activity.type ?? activity.sport_type ?? null,
    name: activity.name ?? null,
    start_date: startDate,
    distance_in_k: Math.round(((activity.distance ?? 0) / 1000) * 1000) / 1000,
    moving_time: activity.moving_time ?? 0,
    total_elevation_gain: activity.total_elevation_gain ?? 0,
  }
}
