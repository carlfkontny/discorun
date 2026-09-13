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

export function chartHeightForRows(count: number) {
  return Math.max(220, count * 40 + 32)
}

export function Leaderboard({ title, description, data, unit, color = "var(--chart-1)" }: LeaderboardProps) {
  const chartConfig = {
    value: {
      label: title,
      color: color,
    },
  } satisfies ChartConfig

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
    <Card className="h-full min-w-0">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg leading-snug">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="min-w-0 overflow-x-auto px-4 sm:px-6">
        {data.length === 0 ? (
          <div className="text-muted-foreground text-sm">Ingen data tilgjengelig</div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full min-w-0"
            style={{ height: chartHeightForRows(data.length) }}
          >
            <BarChart
              data={data}
              layout="vertical"
              barCategoryGap={8}
              barSize={22}
              margin={{
                left: 4,
                right: 8,
                top: 4,
                bottom: 4,
              }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={88}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
