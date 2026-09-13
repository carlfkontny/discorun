import { NextResponse } from 'next/server'
import { isUnlocked, isValidPin, setUnlockedCookie } from '@/lib/strava/pin'

export async function GET() {
  try {
    return NextResponse.json({ unlocked: await isUnlocked() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unlock check failed'
    return NextResponse.json({ unlocked: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'Feil kode' }, { status: 401 })
    }

    await setUnlockedCookie()
    return NextResponse.json({ unlocked: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unlock failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
