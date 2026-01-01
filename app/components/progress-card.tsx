"use client"

import { getTotalWalkRunHikeDistance } from "@/lib/data/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { checkSupabaseConfig } from "@/lib/supabase-debug"

const GOAL_KM = 6500

export function ProgressCard() {
  const [totalKm, setTotalKm] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true)
        const distance = await getTotalWalkRunHikeDistance()
        setTotalKm(distance)
        setError(null)
      } catch (err) {
        console.error('Error loading progress:', err)
        const config = checkSupabaseConfig()
        console.log('Supabase config check:', config)
        
        let errorMessage = err instanceof Error ? err.message : 'Failed to load progress'
        
        // Add helpful hints based on error type
        if (!config.hasUrl || !config.hasKey) {
          errorMessage += '. Check your .env.local file and restart the dev server.'
        } else if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
          errorMessage += '. Check if the table name in lib/data/queries.ts matches your Supabase table name.'
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  const percentage = totalKm !== null ? Math.min((totalKm / GOAL_KM) * 100, 100) : 0
  const remaining = totalKm !== null ? Math.max(GOAL_KM - totalKm, 0) : GOAL_KM

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress mot 6500 km</CardTitle>
        <CardDescription>
          Walk, Run og Hike kombinert i 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Laster...</div>
        ) : error ? (
          <div className="text-destructive">Feil: {error}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{totalKm?.toLocaleString('no-NO', { maximumFractionDigits: 1 })}</span>
              <span className="text-muted-foreground text-lg">/ {GOAL_KM.toLocaleString('no-NO')} km</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fremgang</span>
                <span className="font-medium">{percentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-sm text-muted-foreground">
              {remaining > 0 ? (
                <span>Gjenstår: {remaining.toLocaleString('no-NO', { maximumFractionDigits: 1 })} km</span>
              ) : (
                <span className="font-medium text-primary">Mål oppnådd! 🎉</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

