import { getSupabaseAdmin } from '@/lib/supabase-server'
import { YEAR_2026_START_UNIX } from './env'
import {
  getActivityByIdWithRetry,
  getAthlete,
  getValidAccessToken,
  listAthleteActivities,
  listAthletes,
} from './client'
import { mapStravaActivity } from './map-activity'
import type { ActivityRow, StravaAthleteRow, StravaWebhookEvent } from './types'

const INCREMENTAL_OVERLAP_SECONDS = 48 * 60 * 60

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return fallback
}

function afterTimestamp(athlete: StravaAthleteRow, full?: boolean) {
  if (full || !athlete.last_synced_at) {
    return YEAR_2026_START_UNIX
  }

  const fromLastSync =
    Math.floor(new Date(athlete.last_synced_at).getTime() / 1000) - INCREMENTAL_OVERLAP_SECONDS

  return Math.max(YEAR_2026_START_UNIX, fromLastSync)
}

async function upsertActivities(rows: ActivityRow[]) {
  if (rows.length === 0) {
    return
  }

  const { error } = await getSupabaseAdmin()
    .from('activities')
    .upsert(rows, { onConflict: 'strava_activity_id' })

  if (error) {
    throw new Error(error.message)
  }
}

export async function backfillAthlete(athleteId: number, options?: { full?: boolean }) {
  const athlete = await getAthlete(athleteId)
  if (!athlete) {
    throw new Error(`No connected athlete ${athleteId}`)
  }

  try {
    const accessToken = await getValidAccessToken(athlete)
    const after = afterTimestamp(athlete, options?.full)
    const activities = await listAthleteActivities(accessToken, after)
    const rows = activities
      .map((activity) => mapStravaActivity(activity, athleteId))
      .filter((row): row is ActivityRow => row !== null)

    await upsertActivities(rows)

    const { error } = await getSupabaseAdmin()
      .from('strava_athletes')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('athlete_id', athleteId)

    if (error) {
      throw new Error(error.message)
    }

    return { athleteId, count: rows.length, after }
  } catch (error) {
    const message = errorMessage(error, 'Unknown sync error')
    await getSupabaseAdmin()
      .from('strava_athletes')
      .update({ sync_error: message })
      .eq('athlete_id', athleteId)
    throw error instanceof Error ? error : new Error(message)
  }
}

export async function backfillAllAthletes(options?: { full?: boolean }) {
  const athletes = await listAthletes()
  const results: Array<{ athleteId: number; count?: number; after?: number; error?: string }> = []

  for (const athlete of athletes) {
    try {
      const result = await backfillAthlete(athlete.athlete_id, options)
      results.push(result)
    } catch (error) {
      results.push({
        athleteId: athlete.athlete_id,
        error: errorMessage(error, 'Unknown sync error'),
      })
    }
  }

  return results
}

export async function deleteActivity(activityId: number) {
  const { error } = await getSupabaseAdmin()
    .from('activities')
    .delete()
    .eq('strava_activity_id', activityId)

  if (error) {
    throw error
  }
}

export async function deleteAthleteConnection(athleteId: number) {
  const { error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .delete()
    .eq('athlete_id', athleteId)

  if (error) {
    throw error
  }
}

export async function handleWebhookEvent(event: StravaWebhookEvent) {
  if (event.object_type === 'athlete') {
    if (event.updates?.authorized === 'false') {
      await deleteAthleteConnection(event.owner_id)
    }
    return
  }

  if (event.object_type !== 'activity') {
    return
  }

  if (event.aspect_type === 'delete') {
    await deleteActivity(event.object_id)
    return
  }

  const athlete = await getAthlete(event.owner_id)
  if (!athlete) {
    return
  }

  const accessToken = await getValidAccessToken(athlete)
  const activity = await getActivityByIdWithRetry(accessToken, event.object_id, 3)
  if (!activity) {
    throw new Error(`Strava activity ${event.object_id} was not available after retries`)
  }

  const row = mapStravaActivity(activity, event.owner_id)
  if (row) {
    await upsertActivities([row])
  }
}

export async function saveAthleteTokens(input: {
  athleteId: number
  firstname?: string
  lastname?: string
  scope?: string | null
  accessToken: string
  refreshToken: string
  expiresAt: number
}) {
  const { error } = await getSupabaseAdmin()
    .from('strava_athletes')
    .upsert({
      athlete_id: input.athleteId,
      firstname: input.firstname ?? null,
      lastname: input.lastname ?? null,
      scope: input.scope ?? null,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      expires_at: new Date(input.expiresAt * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      sync_error: null,
    })

  if (error) {
    throw error
  }
}
