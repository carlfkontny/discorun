import { NextRequest } from 'next/server'
import { getStravaConfig } from './env'

export function isAuthorizedCron(request: NextRequest) {
  const expected = `Bearer ${getStravaConfig().cronSecret}`
  const header = request.headers.get('authorization')
  const querySecret = request.nextUrl.searchParams.get('secret')
  return header === expected || querySecret === getStravaConfig().cronSecret
}
