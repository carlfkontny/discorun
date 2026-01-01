"use client"

import { useEffect, useState } from "react"
import { getBikeLeaderboard } from "@/lib/data/queries"
import { Leaderboard, LeaderboardData } from "../leaderboard"

export function BikeLeaderboard() {
  const [data, setData] = useState<LeaderboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const leaderboard = await getBikeLeaderboard()
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
      title="Flest km på sykkel"
      description="Totalt antall kilometer syklet i 2026"
      data={data}
      unit="km"
      color="var(--chart-4)"
    />
  )
}

