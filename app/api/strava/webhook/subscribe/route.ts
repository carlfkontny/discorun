import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/strava/app-url'
import { isAuthorizedCron } from '@/lib/strava/cron-auth'
import { getStravaConfig } from '@/lib/strava/env'

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, clientSecret, verifyToken } = getStravaConfig()
  const callbackUrl = `${getAppUrl()}/api/strava/webhook`

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    callback_url: callbackUrl,
    verify_token: verifyToken,
  })

  const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: payload }, { status: response.status })
  }

  return NextResponse.json(payload)
}
