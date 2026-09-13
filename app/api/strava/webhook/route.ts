import { after, NextResponse } from 'next/server'
import { getStravaConfig } from '@/lib/strava/env'
import { handleWebhookEvent } from '@/lib/strava/sync'
import type { StravaWebhookEvent } from '@/lib/strava/types'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const challenge = url.searchParams.get('hub.challenge')
  const verifyToken = url.searchParams.get('hub.verify_token')

  if (mode === 'subscribe' && challenge && verifyToken === getStravaConfig().verifyToken) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }

  return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 })
}

export async function POST(request: Request) {
  let event: StravaWebhookEvent
  try {
    event = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  after(async () => {
    try {
      await handleWebhookEvent(event)
    } catch (error) {
      console.error('Strava webhook failed', error)
    }
  })

  return NextResponse.json({ ok: true })
}
