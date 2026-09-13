import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getStravaConfig } from './env'

export const UNLOCK_COOKIE = 'discorun_connect'
export const OAUTH_STATE_COOKIE = 'discorun_strava_state'

const COOKIE_MAX_AGE = 60 * 60 * 24

function unlockValue(pin: string) {
  return createHmac('sha256', pin).update('unlocked').digest('hex')
}

export function isValidPin(pin: string) {
  const expected = getStravaConfig().connectPin
  const a = Buffer.from(pin)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

export async function isUnlocked() {
  const jar = await cookies()
  const value = jar.get(UNLOCK_COOKIE)?.value
  if (!value) {
    return false
  }
  const expected = unlockValue(getStravaConfig().connectPin)
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

export async function setUnlockedCookie() {
  const jar = await cookies()
  jar.set(UNLOCK_COOKIE, unlockValue(getStravaConfig().connectPin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function setOAuthStateCookie(state: string) {
  const jar = await cookies()
  jar.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
}

export async function consumeOAuthState(state: string | null) {
  const jar = await cookies()
  const expected = jar.get(OAUTH_STATE_COOKIE)?.value
  jar.delete(OAUTH_STATE_COOKIE)
  if (!state || !expected) {
    return false
  }
  const a = Buffer.from(state)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}
