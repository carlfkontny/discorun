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

type Step = 'pin' | 'authorize' | 'syncing' | 'ready' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  pin: 'Skriv inn koden før du kobler til Strava.',
  denied: 'Du avviste tilgangen hos Strava. Prøv igjen og godta lesing av økter.',
  state: 'Sesjonen utløp. Trykk «Godkjenn med Strava» på nytt.',
  code: 'Manglet autorisasjonskode fra Strava. Prøv å godkjenne på nytt.',
  scope: 'Du må godta at appen leser øktene dine hos Strava.',
  athlete: 'Fant ikke Strava-profilen.',
  token: 'Kunne ikke fullføre innloggingen. Prøv å godkjenne med Strava på nytt.',
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

function StepList({ current }: { current: Step }) {
  const items = [
    { id: 'pin', label: '1. Kode' },
    { id: 'authorize', label: '2. Strava' },
    { id: 'sync', label: '3. Økter' },
  ] as const

  const activeIndex = current === 'pin' ? 0 : current === 'authorize' ? 1 : 2

  return (
    <ol className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
      {items.map((item, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        return (
          <li
            key={item.id}
            className={
              done
                ? 'rounded-md bg-green-50 px-2 py-2 font-medium text-green-800'
                : active
                  ? 'rounded-md bg-primary px-2 py-2 font-medium text-primary-foreground'
                  : 'rounded-md bg-muted px-2 py-2 text-muted-foreground'
            }
          >
            {item.label}
          </li>
        )
      })}
    </ol>
  )
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
  const [syncingId, setSyncingId] = useState<number | null>(
    initialOk && initialAthleteId ? initialAthleteId : null
  )
  const [error, setError] = useState(initialError ? ERROR_MESSAGES[initialError] ?? initialError : '')
  const [connections, setConnections] = useState<Connection[]>([])

  const myConnection = useMemo(() => {
    if (!initialAthleteId) {
      return undefined
    }
    return connections.find((connection) => connection.athleteId === initialAthleteId)
  }, [connections, initialAthleteId])

  const myStatus = myConnection ? statusOf(myConnection) : null

  const step: Step = !unlocked
    ? 'pin'
    : initialOk && (syncingId || myStatus === 'loading')
      ? 'syncing'
      : initialOk && myStatus === 'ready'
        ? 'ready'
        : initialOk && myStatus === 'error'
          ? 'error'
          : 'authorize'

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

  const copy = {
    pin: {
      title: 'Koble til Strava',
      description: 'Tre steg: felles kode, godkjenning hos Strava, og så henter vi øktene dine for 2026.',
    },
    authorize: {
      title: 'Godkjenn hos Strava',
      description: 'Du sendes til Strava. Logg inn med din egen konto og godta at Discorun kan lese øktene dine.',
    },
    syncing: {
      title: 'Henter øktene dine',
      description: 'Bli i dette vinduet. Vi henter hele 2026 — det kan ta et minutt.',
    },
    ready: {
      title: 'Du er med',
      description: 'Øktene dine ligger i dashboardet.',
    },
    error: {
      title: 'Koblet til, men henting feilet',
      description: 'Strava-kontoen er godkjent. Prøv å hente øktene på nytt — du trenger ikke logge inn hos Strava igjen.',
    },
  }[step]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StepList current={step === 'error' ? 'syncing' : step} />

        {step === 'authorize' && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
            <p className="font-medium">Viktig: du må godkjenne hos Strava selv.</p>
            <p className="mt-1">
              Det holder ikke å se at andre allerede er med. Trykk knappen under, logg inn med
              din Strava-konto og godta lesing av økter.
            </p>
          </div>
        )}

        {step === 'syncing' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">
              {myConnection?.name ? `${myConnection.name} er godkjent hos Strava.` : 'Du er godkjent hos Strava.'}{' '}
              Øktene for 2026 hentes nå.
            </p>
            <p className="mt-1">Ikke trykk «Godkjenn med Strava» på nytt.</p>
          </div>
        )}

        {step === 'ready' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950">
            <p className="font-medium">
              {myConnection?.name ? `${myConnection.name}, øktene dine er hentet.` : 'Øktene dine er hentet.'}
            </p>
            <p className="mt-1">Du kan gå til dashboardet. En ny person må starte fra «Koble til Strava» selv.</p>
          </div>
        )}

        {step === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            <p className="font-medium">Du er koblet til, men øktene ble ikke hentet.</p>
            <p className="mt-1">Bruk «Hent økter på nytt». Ikke start Strava-innloggingen på nytt.</p>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Laster…</p>
        ) : step === 'pin' ? (
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
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? 'Sjekker…' : 'Fortsett'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {step === 'syncing' && (
              <div className="flex items-center gap-3 rounded-md border px-4 py-3 text-sm">
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Henter økter fra Strava…
              </div>
            )}

            {step === 'error' && (
              <button
                type="button"
                onClick={() => startSync(myConnection?.athleteId)}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Hent økter på nytt
              </button>
            )}

            {step === 'ready' && (
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Gå til dashboardet
              </Link>
            )}

            {step === 'authorize' && (
              <a
                href="/api/strava/authorize"
                className="inline-flex w-full items-center justify-center rounded-md bg-[#fc4c02] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e34402]"
              >
                Godkjenn med Strava
              </a>
            )}

            {connections.length > 0 && step === 'authorize' && (
              <div>
                <h2 className="mb-2 text-sm font-semibold">Allerede med</h2>
                <p className="mb-2 text-xs text-muted-foreground">
                  Dette er andre som har godkjent. Du er ikke ferdig før du har gjort det samme.
                </p>
                <ul className="divide-y rounded-md border text-sm">
                  {connections.map((connection) => {
                    const status = statusOf(connection)
                    return (
                      <li key={connection.athleteId} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span>{connection.name}</span>
                        <span className="text-muted-foreground">
                          {status === 'ready' ? 'Ferdig' : status === 'error' ? 'Feilet' : 'Henter…'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {step === 'ready' && (
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
