import { getSupabaseAdmin } from '@/lib/supabase-server'
import { STRAVA_API_BASE, YEAR_2026_START_UNIX, YEAR_2027_START_UNIX } from './env'
import { stravaFetch } from './http'
import { refreshAccessToken } from './oauth'
import type { StravaAthleteRow, StravaSummaryActivity } from './types'

const TOKEN_REFRESH_SKEW_MS = 60_000

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getAthlete(athleteId: number): Promise<StravaAthleteRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .select('*')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function listAthletes(): Promise<StravaAthleteRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .select('*')
    .order('firstname', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getValidAccessToken(athlete: StravaAthleteRow): Promise<string> {
  const expiresAt = new Date(athlete.expires_at).getTime()
  if (expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
    return athlete.access_token
  }

  const tokens = await refreshAccessToken(athlete.refresh_token)
  const { error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    })
    .eq('athlete_id', athlete.athlete_id)

  if (error) {
    throw error
  }

  return tokens.access_token
}

async function stravaGet<T>(path: string, accessToken: string): Promise<T | null> {
  const response = await stravaFetch(`${STRAVA_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 404) {
    return null
  }

  if (response.status === 429) {
    await sleep(2000)
    const retry = await stravaFetch(`${STRAVA_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!retry.ok) {
      const text = await retry.text()
      throw new Error(`Strava ${path} failed after retry: ${retry.status} ${text}`)
    }
    return retry.json()
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Strava ${path} failed: ${response.status} ${text}`)
  }

  return response.json()
}

export async function listAthleteActivities(
  accessToken: string,
  after = YEAR_2026_START_UNIX,
  before = YEAR_2027_START_UNIX
): Promise<StravaSummaryActivity[]> {
  const activities: StravaSummaryActivity[] = []

  for (let page = 1; page <= 50; page += 1) {
    const batch = await stravaGet<StravaSummaryActivity[]>(
      `/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=200`,
      accessToken
    )

    if (!batch || batch.length === 0) {
      break
    }

    activities.push(...batch)
    if (batch.length < 200) {
      break
    }
  }

  return activities
}

export async function getActivityById(
  accessToken: string,
  activityId: number
): Promise<StravaSummaryActivity | null> {
  return stravaGet<StravaSummaryActivity>(`/activities/${activityId}`, accessToken)
}
