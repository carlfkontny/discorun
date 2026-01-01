"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface LeaderboardData {
  name: string
  value: number
}

interface LeaderboardProps {
  title: string
  description?: string
  data: LeaderboardData[]
  unit: string
  color?: string
}

export function Leaderboard({ title, description, data, unit, color = "var(--chart-1)" }: LeaderboardProps) {
  const chartConfig = {
    value: {
      label: title,
      color: color,
    },
  } satisfies ChartConfig

  // Format value based on unit
  const formatValue = (value: number) => {
    if (unit === 'km') {
      return `${value.toLocaleString('no-NO', { maximumFractionDigits: 1 })} km`
    } else if (unit === 'm') {
      return `${value.toLocaleString('no-NO')} m`
    } else {
      return `${value.toLocaleString('no-NO')} ${unit}`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground text-sm">Ingen data tilgjengelig</div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                left: 0,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

