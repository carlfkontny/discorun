import { after, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/strava/app-url'
import { consumeOAuthState } from '@/lib/strava/pin'
import { exchangeCodeForTokens, hasRequiredScopes } from '@/lib/strava/oauth'
import { backfillAthlete, saveAthleteTokens } from '@/lib/strava/sync'

function redirectToConnect(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/koble-til?${query}`, getAppUrl(request)))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  const scope = url.searchParams.get('scope')
  const state = url.searchParams.get('state')

  if (error) {
    return redirectToConnect(request, 'error=denied')
  }

  if (!(await consumeOAuthState(state))) {
    return redirectToConnect(request, 'error=state')
  }

  if (!code) {
    return redirectToConnect(request, 'error=code')
  }

  if (!hasRequiredScopes(scope)) {
    return redirectToConnect(request, 'error=scope')
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const athleteId = tokens.athlete?.id
    if (!athleteId) {
      return redirectToConnect(request, 'error=athlete')
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

    return redirectToConnect(request, `ok=1&athlete=${athleteId}`)
  } catch (callbackError) {
    console.error('Strava callback failed', callbackError)
    return redirectToConnect(request, 'error=token')
  }
}
