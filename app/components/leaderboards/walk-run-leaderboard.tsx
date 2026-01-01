"use client"

import { useEffect, useState } from "react"
import { getWalkRunLeaderboard } from "@/lib/data/queries"
import { Leaderboard, LeaderboardData } from "../leaderboard"

export function WalkRunLeaderboard() {
  const [data, setData] = useState<LeaderboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const leaderboard = await getWalkRunLeaderboard()
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
      title="Flest km Walk/Run/Hike"
      description="Totalt antall kilometer gått og løpt i 2026"
      data={data}
      unit="km"
      color="var(--chart-1)"
    />
  )
}

