"use client"

import { useEffect, useState } from "react"
import { getStrengthWorkoutsLeaderboard } from "@/lib/data/queries"
import { Leaderboard, LeaderboardData } from "../leaderboard"

export function StrengthLeaderboard() {
  const [data, setData] = useState<LeaderboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const leaderboard = await getStrengthWorkoutsLeaderboard()
        setData(leaderboard)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="text-muted-foreground text-sm">Laster...</div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">Feil: {error}</div>
    )
  }

  return (
    <Leaderboard
      title="Flest styrkeøkter"
      description="Antall styrketreningsøkter (≥30 min) i 2026"
      data={data}
      unit="økter"
      color="var(--chart-3)"
    />
  )
}

