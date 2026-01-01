"use client";

import { useEffect, useState } from "react";
import { getWalkRunLeaderboard } from "@/lib/data/queries";
import { getAthleteGoal } from "@/lib/data/goals";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Rectangle,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

interface LeaderboardDataWithGoal {
  name: string;
  value: number;
  goal: number;
  fill: string;
}

export function WalkRunLeaderboard() {
  const [data, setData] = useState<LeaderboardDataWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const leaderboard = await getWalkRunLeaderboard();

        // Add goals and colors to each athlete's data
        const dataWithGoals: LeaderboardDataWithGoal[] = leaderboard
          .map((item) => {
            const goal = getAthleteGoal(item.name);
            const percentage =
              goal > 0 ? Math.min((item.value / goal) * 100, 100) : 0;

            // Color based on progress
            let fill = "var(--chart-1)";
            if (percentage >= 100) {
              fill = "var(--chart-3)";
            } else if (percentage >= 75) {
              fill = "var(--chart-1)";
            } else if (percentage >= 50) {
              fill = "var(--chart-4)";
            } else {
              fill = "var(--chart-5)";
            }

            return {
              name: item.name,
              value: item.value,
              goal: goal,
              fill: fill,
            };
          })
          .sort((a, b) => b.value - a.value);

        setData(dataWithGoals);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const chartConfig = {
    value: {
      label: "Faktisk",
      color: "var(--chart-1)",
    },
    goal: {
      label: "Mål",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // Find max value for scaling
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.goal)), 100);

  // Format value
  const formatValue = (value: number) => {
    return `${value.toLocaleString("no-NO", { maximumFractionDigits: 1 })} km`;
  };

  if (loading) {
    return (
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="text-destructive text-sm">Feil: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Flest km Walk/Run/Hike</CardTitle>
        <CardDescription>
          Totalt antall kilometer gått og løpt i 2026 med individuelle mål
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Ingen data tilgjengelig
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              barCategoryGap="8%"
              margin={{
                left: 0,
                right: 20,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                domain={[0, maxValue * 1.1]}
                tickFormatter={(value) => `${Math.round(value)} km`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const entry = payload[0].payload as LeaderboardDataWithGoal;
                  const percentage =
                    entry.goal > 0
                      ? Math.min((entry.value / entry.goal) * 100, 100)
                      : 0;
                  const remaining = Math.max(entry.goal - entry.value, 0);

                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-sm shadow-lg">
                      <div className="font-medium mb-2">{entry.name}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Faktisk:
                          </span>
                          <span className="font-medium">
                            {formatValue(entry.value)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Mål:</span>
                          <span className="font-medium">
                            {formatValue(entry.goal)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t">
                          <span className="text-muted-foreground">
                            Fremgang:
                          </span>
                          <span className="font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        {remaining > 0 && (
                          <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                            <span>Gjenstår:</span>
                            <span>{formatValue(remaining)}</span>
                          </div>
                        )}
                        {remaining <= 0 && (
                          <div className="text-xs text-primary font-medium">
                            Mål oppnådd! 🎉
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="value"
                strokeWidth={2}
                radius={8}
                shape={(props: unknown) => {
                  const barProps = props as {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    payload: LeaderboardDataWithGoal;
                  };
                  const { x, y, width, height, payload } = barProps;
                  const goal = payload.goal;
                  const actual = payload.value;
                  const fill = payload.fill;

                  // For vertical bars in Recharts:
                  // - width represents the horizontal extent (the value scaled to chart)
                  // - height is the vertical bar height (fixed per category)
                  // - x is the left edge, y is the top edge
                  // Goal position: calculate based on ratio of goal to actual
                  // If actual width represents the actual value, goal width = (goal/actual) * width
                  const goalX = actual > 0 ? (goal / actual) * width : 0;

                  return (
                    <g>
                      {/* Actual bar */}
                      <Rectangle
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fill}
                        radius={8}
                      />
                      {/* Goal outline - vertical dashed line at goal position */}
                      {goal > 0 && (
                        <line
                          x1={x + goalX}
                          y1={y}
                          x2={x + goalX}
                          y2={y + height}
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          opacity={0.8}
                        />
                      )}
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
