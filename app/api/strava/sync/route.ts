import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/strava/cron-auth'
import { backfillAllAthletes, backfillAthlete } from '@/lib/strava/sync'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const athleteId = request.nextUrl.searchParams.get('athlete_id')
  const full = request.nextUrl.searchParams.get('full') === '1'

  try {
    if (athleteId) {
      const result = await backfillAthlete(Number(athleteId), { full })
      return NextResponse.json({ ok: true, results: [result] })
    }

    const results = await backfillAllAthletes({ full })
    return NextResponse.json({ ok: true, results })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
