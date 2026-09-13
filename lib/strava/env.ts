function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return value
}

export function getStravaConfig() {
  return {
    clientId: required('STRAVA_CLIENT_ID'),
    clientSecret: required('STRAVA_CLIENT_SECRET'),
    redirectUri: required('STRAVA_REDIRECT_URI'),
    verifyToken: required('STRAVA_VERIFY_TOKEN'),
    connectPin: required('STRAVA_CONNECT_PIN'),
    cronSecret: required('CRON_SECRET'),
  }
}

export const YEAR_2026_START_UNIX = Math.floor(Date.UTC(2026, 0, 1) / 1000)
export const YEAR_2027_START_UNIX = Math.floor(Date.UTC(2027, 0, 1) / 1000)

export const STRAVA_SCOPES = 'read,activity:read_all'
export const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
export const STRAVA_OAUTH_AUTHORIZE = 'https://www.strava.com/oauth/authorize'
export const STRAVA_OAUTH_TOKEN = 'https://www.strava.com/api/v3/oauth/token'
