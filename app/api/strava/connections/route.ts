import { NextResponse } from 'next/server'
import { getAthleteName } from '@/lib/data/athletes'
import { listAthletes } from '@/lib/strava/client'
import { isUnlocked } from '@/lib/strava/pin'

export async function GET() {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: 'Låst' }, { status: 401 })
  }

  const athletes = await listAthletes()
  return NextResponse.json({
    connections: athletes.map((athlete) => {
      const mapped = getAthleteName(athlete.athlete_id)
      return {
        athleteId: athlete.athlete_id,
        name: mapped.startsWith('Athlete ')
          ? athlete.firstname || mapped
          : mapped,
        lastSyncedAt: athlete.last_synced_at,
        syncError: athlete.sync_error,
      }
    }),
  })
}
