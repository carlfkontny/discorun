import { randomBytes } from 'crypto'
import { getStravaRedirectUri } from './app-url'
import {
  STRAVA_OAUTH_AUTHORIZE,
  STRAVA_OAUTH_TOKEN,
  STRAVA_SCOPES,
  getStravaConfig,
} from './env'
import { stravaFetch } from './http'
import type { StravaTokenResponse } from './types'

export function createOAuthState() {
  return randomBytes(24).toString('hex')
}

export function buildAuthorizeUrl(state: string, request?: Request) {
  const { clientId } = getStravaConfig()
  const url = new URL(STRAVA_OAUTH_AUTHORIZE)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', getStravaRedirectUri(request))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('approval_prompt', 'force')
  url.searchParams.set('scope', STRAVA_SCOPES)
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeCodeForTokens(code: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaConfig()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
  })

  const response = await stravaFetch(STRAVA_OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Strava token exchange failed: ${response.status} ${text}`)
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaConfig()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await stravaFetch(STRAVA_OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Strava token refresh failed: ${response.status} ${text}`)
  }

  return response.json()
}

export function hasRequiredScopes(scope: string | null | undefined) {
  if (!scope) {
    return false
  }
  const granted = scope.split(/[,\s]+/).filter(Boolean)
  return granted.includes('activity:read') || granted.includes('activity:read_all')
}
