"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getMonthlyWalkRunHikeData } from "@/lib/data/queries";
import { getTotalGoal } from "@/lib/data/goals";

const chartConfig = {
  target: {
    label: "Mål",
    color: "var(--chart-2)",
  },
  actual: {
    label: "Faktisk",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RoadToFinish() {
  const [chartData, setChartData] = useState<
    Array<{ month: string; actual: number; target: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getMonthlyWalkRunHikeData();
        setChartData(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Road to Finish</CardTitle>
        <CardDescription>
          Kumulativ progresjon mot {getTotalGoal().toLocaleString("no-NO")} km i 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Laster...</div>
        ) : error ? (
          <div className="text-destructive">Feil: {error}</div>
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Ingen data tilgjengelig
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full min-w-0 max-h-[260px] sm:h-[260px]">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} km`}
                domain={[0, "auto"]}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="target"
                type="monotone"
                stroke="var(--color-target)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="actual"
                type="monotone"
                stroke="var(--color-actual)"
                strokeWidth={2}
                dot={{ fill: "var(--color-actual)", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
