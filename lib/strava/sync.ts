import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  getActivityById,
  getAthlete,
  getValidAccessToken,
  listAthleteActivities,
  listAthletes,
} from './client'
import { mapStravaActivity } from './map-activity'
import type { ActivityRow, StravaWebhookEvent } from './types'

async function upsertActivities(rows: ActivityRow[]) {
  if (rows.length === 0) {
    return
  }

  const { error } = await getSupabaseAdmin()
    .from('activities')
    .upsert(rows, { onConflict: 'strava_activity_id' })

  if (error) {
    throw error
  }
}

export async function backfillAthlete(athleteId: number) {
  const athlete = await getAthlete(athleteId)
  if (!athlete) {
    throw new Error(`No connected athlete ${athleteId}`)
  }

  try {
    const accessToken = await getValidAccessToken(athlete)
    const activities = await listAthleteActivities(accessToken)
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
      throw error
    }

    return { athleteId, count: rows.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error'
    await getSupabaseAdmin()
      .from('strava_athletes')
      .update({ sync_error: message })
      .eq('athlete_id', athleteId)
    throw error
  }
}

export async function backfillAllAthletes() {
  const athletes = await listAthletes()
  const results: Array<{ athleteId: number; count?: number; error?: string }> = []

  for (const athlete of athletes) {
    try {
      const result = await backfillAthlete(athlete.athlete_id)
      results.push(result)
    } catch (error) {
      results.push({
        athleteId: athlete.athlete_id,
        error: error instanceof Error ? error.message : 'Unknown sync error',
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
  const activity = await getActivityById(accessToken, event.object_id)
  if (!activity) {
    await deleteActivity(event.object_id)
    return
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
