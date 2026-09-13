import { after, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/strava/app-url'
import { consumeOAuthState } from '@/lib/strava/pin'
import { exchangeCodeForTokens, hasRequiredScopes } from '@/lib/strava/oauth'
import { backfillAthlete, saveAthleteTokens } from '@/lib/strava/sync'

function redirectToConnect(query: string) {
  return NextResponse.redirect(new URL(`/koble-til?${query}`, getAppUrl()))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const scope = url.searchParams.get('scope')
  const state = url.searchParams.get('state')

  if (error) {
    return redirectToConnect('error=denied')
  }

  if (!(await consumeOAuthState(state))) {
    return redirectToConnect('error=state')
  }

  if (!code) {
    return redirectToConnect('error=code')
  }

  if (!hasRequiredScopes(scope)) {
    return redirectToConnect('error=scope')
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const athleteId = tokens.athlete?.id
    if (!athleteId) {
      return redirectToConnect('error=athlete')
    }

    await saveAthleteTokens({
      athleteId,
      firstname: tokens.athlete?.firstname,
      lastname: tokens.athlete?.lastname,
      scope,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at,
    })

    after(async () => {
      try {
        await backfillAthlete(athleteId)
      } catch (backfillError) {
        console.error('Strava backfill failed', backfillError)
      }
    })

    return redirectToConnect(`ok=1&athlete=${athleteId}`)
  } catch (callbackError) {
    console.error('Strava callback failed', callbackError)
    return redirectToConnect('error=token')
  }
}
