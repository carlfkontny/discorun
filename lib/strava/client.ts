import { getSupabaseAdmin } from '@/lib/supabase-server'
import { STRAVA_API_BASE, YEAR_2026_START_UNIX, YEAR_2027_START_UNIX } from './env'
import { stravaFetch } from './http'
import { refreshAccessToken } from './oauth'
import type { StravaAthleteRow, StravaSummaryActivity } from './types'

const TOKEN_REFRESH_SKEW_MS = 60_000

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error(fallback)
}

export async function getAthlete(athleteId: number): Promise<StravaAthleteRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .select('*')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (error) {
    throw toError(error, `Could not load athlete ${athleteId}`)
  }

  return data
}

export async function listAthletes(): Promise<StravaAthleteRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .select('*')
    .order('firstname', { ascending: true })

  if (error) {
    throw toError(error, 'Could not list athletes')
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
    throw toError(error, `Could not save refreshed token for ${athlete.athlete_id}`)
  }

  return tokens.access_token
}

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

async function stravaGet<T>(path: string, accessToken: string): Promise<T | null> {
  let lastStatus = 0
  let lastBody = ''

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await stravaFetch(`${STRAVA_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (response.status === 404) {
      return null
    }

    if (response.ok) {
      return response.json()
    }

    lastStatus = response.status
    lastBody = await response.text()

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === 4) {
      break
    }

    await sleep(1000 * attempt * (response.status === 429 ? 2 : 1))
  }

  throw new Error(`Strava ${path} failed: ${lastStatus} ${lastBody}`)
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

export async function getActivityByIdWithRetry(
  accessToken: string,
  activityId: number,
  attempts = 5
): Promise<StravaSummaryActivity | null> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const activity = await getActivityById(accessToken, activityId)
      if (activity) {
        return activity
      }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : ''
      if (!/\b(429|502|503|504)\b/.test(message)) {
        throw error
      }
    }

    if (attempt < attempts) {
      await sleep(1500 * attempt)
    }
  }

  if (lastError) {
    throw lastError
  }

  return null
}
