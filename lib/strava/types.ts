export type StravaAthleteSummary = {
  id: number
  firstname?: string
  lastname?: string
}

export type StravaTokenResponse = {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete?: StravaAthleteSummary
}

export type StravaSummaryActivity = {
  id: number
  athlete?: { id: number }
  name?: string
  type?: string
  sport_type?: string
  start_date?: string
  start_date_local?: string
  distance?: number
  moving_time?: number
  total_elevation_gain?: number
}

export type StravaAthleteRow = {
  athlete_id: number
  firstname: string | null
  lastname: string | null
  scope: string | null
  access_token: string
  refresh_token: string
  expires_at: string
  connected_at: string
  last_synced_at: string | null
  sync_error: string | null
}

export type ActivityRow = {
  strava_activity_id: number
  athlete_id: number
  type: string | null
  name: string | null
  start_date: string
  distance_in_k: number
  moving_time: number
  total_elevation_gain: number
}

export type StravaWebhookEvent = {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number
  object_type: 'activity' | 'athlete'
  owner_id: number
  subscription_id: number
  updates?: Record<string, string>
}
