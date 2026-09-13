import { NextResponse } from 'next/server'
import { isUnlocked } from '@/lib/strava/pin'
import { listAthletes } from '@/lib/strava/client'
import { backfillAthlete } from '@/lib/strava/sync'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: 'Låst' }, { status: 401 })
  }

  let athleteId: number | undefined
  try {
    const body = await request.json()
    if (body?.athleteId) {
      athleteId = Number(body.athleteId)
    }
  } catch {
    athleteId = undefined
  }

  if (!athleteId) {
    const athletes = await listAthletes()
    const pending = athletes.find((athlete) => !athlete.last_synced_at || athlete.sync_error)
    athleteId = pending?.athlete_id
  }

  if (!athleteId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const result = await backfillAthlete(athleteId)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('Strava sync-me failed', athleteId, error)
    const message = error instanceof Error ? error.message : 'Henting feilet'
    return NextResponse.json({ error: message, athleteId }, { status: 500 })
  }
}
