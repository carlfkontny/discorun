'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Connection = {
  athleteId: number
  name: string
  lastSyncedAt: string | null
  syncError: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  pin: 'Skriv inn koden før du kobler til Strava.',
  denied: 'Du avviste tilgangen hos Strava.',
  state: 'Sesjonen utløp. Prøv å koble til på nytt.',
  code: 'Manglet autorisasjonskode fra Strava.',
  scope: 'Du må godta at appen leser øktene dine.',
  athlete: 'Fant ikke Strava-profilen.',
  token: 'Kunne ikke fullføre innloggingen. Prøv å koble til på nytt.',
}

function statusOf(connection: Connection) {
  if (connection.lastSyncedAt && !connection.syncError) {
    return 'ready' as const
  }
  if (connection.syncError) {
    return 'error' as const
  }
  return 'loading' as const
}

export function ConnectForm({
  initialError,
  initialOk,
  initialAthleteId,
}: {
  initialError?: string
  initialOk?: boolean
  initialAthleteId?: number
}) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncingId, setSyncingId] = useState<number | null>(initialOk && initialAthleteId ? initialAthleteId : null)
  const [error, setError] = useState(initialError ? ERROR_MESSAGES[initialError] ?? initialError : '')
  const [connections, setConnections] = useState<Connection[]>([])

  const focus = useMemo(() => {
    if (initialAthleteId) {
      return connections.find((connection) => connection.athleteId === initialAthleteId)
    }
    return connections.find((connection) => statusOf(connection) !== 'ready') ?? connections[0]
  }, [connections, initialAthleteId])

  const focusStatus = focus ? statusOf(focus) : null
  const waiting = Boolean(syncingId) || focusStatus === 'loading'

  async function loadConnections() {
    const response = await fetch('/api/strava/connections')
    if (!response.ok) {
      return [] as Connection[]
    }
    const data = await response.json()
    const next = (data.connections ?? []) as Connection[]
    setConnections(next)
    return next
  }

  async function startSync(athleteId?: number) {
    const targetId = athleteId ?? initialAthleteId
    setError('')
    setSyncingId(targetId ?? -1)

    try {
      const response = await fetch('/api/strava/sync-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: targetId }),
      })
      const data = await response.json()
      await loadConnections()
      if (!response.ok) {
        setError(data.error || 'Øktene ble ikke hentet. Prøv «Hent økter på nytt».')
      }
      return data
    } catch {
      setError('Øktene ble ikke hentet. Prøv «Hent økter på nytt».')
    } finally {
      setSyncingId(null)
      await loadConnections()
    }
  }

  useEffect(() => {
    let cancelled = false

    async function checkUnlock() {
      try {
        const response = await fetch('/api/strava/unlock')
        const data = await response.json()
        if (cancelled) {
          return
        }
        setUnlocked(Boolean(data.unlocked))
        if (data.unlocked) {
          await loadConnections()
        }
      } catch {
        if (!cancelled) {
          setError('Kunne ikke sjekke tilgang.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkUnlock()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!unlocked || !initialOk) {
      return
    }

    startSync(initialAthleteId)

    const interval = window.setInterval(() => {
      loadConnections()
    }, 3000)

    return () => {
      window.clearInterval(interval)
    }
    // Run once after unlock when returning from Strava.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, initialOk, initialAthleteId])

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/strava/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Feil kode')
        return
      }
      setUnlocked(true)
      await loadConnections()
    } catch {
      setError('Kunne ikke sjekke koden.')
    } finally {
      setSubmitting(false)
    }
  }

  const title = !unlocked
    ? 'Koble til Strava'
    : waiting
      ? 'Henter øktene dine'
      : focusStatus === 'ready'
        ? 'Du er i gang'
        : focusStatus === 'error'
          ? 'Koblet til, men henting feilet'
          : 'Koble til Strava'

  const description = !unlocked
    ? 'Skriv inn den felles koden for å fortsette.'
    : waiting
      ? 'Bli i dette vinduet. Ikke trykk «Koble til Strava» på nytt.'
      : focusStatus === 'ready'
        ? 'Øktene ligger i dashboardet. Koble til en annen person bare hvis det er noen andre som skal inn.'
        : focusStatus === 'error'
          ? 'Strava-kontoen er godkjent. Prøv å hente øktene på nytt — du trenger ikke logge inn hos Strava igjen.'
          : 'Godkjenn at Discorun leser øktene dine. Vi henter hele 2026.'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {waiting && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">
              {focus?.name ? `${focus.name} er koblet til.` : 'Du er koblet til.'} Øktene for 2026 hentes nå.
            </p>
            <p className="mt-1">Bli her til statusen blir ferdig. Det kan ta et minutt.</p>
          </div>
        )}

        {focusStatus === 'ready' && !waiting && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950">
            <p className="font-medium">Øktene er hentet.</p>
            <p className="mt-1">Du kan gå til dashboardet. Trykk ikke «Koble til Strava» med mindre en ny person skal inn.</p>
          </div>
        )}

        {focusStatus === 'error' && !waiting && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            <p className="font-medium">Du er koblet til, men øktene ble ikke hentet.</p>
            <p className="mt-1">Bruk «Hent økter på nytt». Ikke start Strava-innloggingen på nytt.</p>
            {error && <p className="mt-2 break-words text-xs opacity-80">{error}</p>}
          </div>
        )}

        {error && focusStatus !== 'error' && !waiting && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Laster…</p>
        ) : !unlocked ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                Felles kode
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? 'Sjekker…' : 'Lås opp'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {waiting && (
              <div className="flex items-center gap-3 rounded-md border px-4 py-3 text-sm">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Henter økter fra Strava…
              </div>
            )}

            {focusStatus === 'error' && !waiting && (
              <button
                type="button"
                onClick={() => startSync(focus?.athleteId)}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Hent økter på nytt
              </button>
            )}

            {focusStatus === 'ready' && !waiting && (
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Gå til dashboardet
              </Link>
            )}

            {!waiting && focusStatus !== 'error' && focusStatus !== 'ready' && (
              <a
                href="/api/strava/authorize"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Koble til Strava
              </a>
            )}

            {connections.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold">Status</h2>
                <ul className="divide-y rounded-md border text-sm">
                  {connections.map((connection) => {
                    const status = statusOf(connection)
                    const label =
                      syncingId === connection.athleteId || status === 'loading'
                        ? 'Henter… bli i vinduet'
                        : status === 'ready'
                          ? 'Ferdig'
                          : 'Feilet — hent på nytt'
                    return (
                      <li key={connection.athleteId} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span>{connection.name}</span>
                        <span className={status === 'error' ? 'text-red-700' : 'text-muted-foreground'}>
                          {label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {!waiting && (focusStatus === 'ready' || focusStatus === 'error') && (
              <a href="/api/strava/authorize" className="block text-center text-sm text-muted-foreground underline">
                Koble til en annen person
              </a>
            )}
          </div>
        )}

        <Link href="/" className="inline-block text-sm text-muted-foreground underline">
          Tilbake til dashboardet
        </Link>
      </CardContent>
    </Card>
  )
}
