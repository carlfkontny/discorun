import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/strava/app-url'
import { buildAuthorizeUrl, createOAuthState } from '@/lib/strava/oauth'
import { isUnlocked, setOAuthStateCookie } from '@/lib/strava/pin'

export async function GET(request: Request) {
  if (!(await isUnlocked())) {
    return NextResponse.redirect(new URL('/koble-til?error=pin', getAppUrl(request)))
  }

  const state = createOAuthState()
  await setOAuthStateCookie(state)
  return NextResponse.redirect(buildAuthorizeUrl(state, request))
}
