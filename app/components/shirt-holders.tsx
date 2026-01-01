"use client";

import { useEffect, useState } from "react";
import {
  getWalkRunLeaderboard,
  getElevationLeaderboard,
} from "@/lib/data/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ShirtHolders() {
  const [distanceLeader, setDistanceLeader] = useState<string | null>(null);
  const [distanceValue, setDistanceValue] = useState<number | null>(null);
  const [distanceRunnerUp, setDistanceRunnerUp] = useState<string | null>(null);
  const [distanceRunnerUpValue, setDistanceRunnerUpValue] = useState<number | null>(null);
  const [elevationLeader, setElevationLeader] = useState<string | null>(null);
  const [elevationValue, setElevationValue] = useState<number | null>(null);
  const [elevationRunnerUp, setElevationRunnerUp] = useState<string | null>(null);
  const [elevationRunnerUpValue, setElevationRunnerUpValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [leaderboard, elevationData] = await Promise.all([
          getWalkRunLeaderboard(),
          getElevationLeaderboard(),
        ]);

        // Find distance leader (highest km) and runner-up
        if (leaderboard.length > 0) {
          setDistanceLeader(leaderboard[0].name);
          setDistanceValue(leaderboard[0].value);
        }
        if (leaderboard.length > 1) {
          setDistanceRunnerUp(leaderboard[1].name);
          setDistanceRunnerUpValue(leaderboard[1].value);
          console.log("Distance runner-up:", leaderboard[1].name, leaderboard[1].value);
        } else {
          console.log("No distance runner-up - only", leaderboard.length, "athletes");
        }

        // Find elevation leader (highest elevation) and runner-up
        if (elevationData.length > 0) {
          setElevationLeader(elevationData[0].name);
          setElevationValue(elevationData[0].value);
        }
        if (elevationData.length > 1) {
          setElevationRunnerUp(elevationData[1].name);
          setElevationRunnerUpValue(elevationData[1].value);
          console.log("Elevation runner-up:", elevationData[1].name, elevationData[1].value);
        } else {
          console.log("No elevation runner-up - only", elevationData.length, "athletes");
        }

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load shirt holders"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="md:col-span-2 lg:col-span-3">
        <CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:col-span-2 lg:col-span-3">
        <CardContent className="pt-6">
          <div className="text-destructive text-sm">Feil: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Trøyene</CardTitle>
        <CardDescription>
          Nåværende ledere i Walk/Run/Hike konkurransen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Yellow Shirt - Distance Leader */}
          <div className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
            <div className="mb-2">
              <div className="w-20 h-20 bg-yellow-400 dark:bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg border-4 border-yellow-500 dark:border-yellow-600">
                <span className="text-4xl">🟡</span>
              </div>
            </div>
            <div className="text-center w-full">
              <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-0.5">
                Gul trøye
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                Flest kilometer
              </div>
              {distanceLeader ? (
                <>
                  <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-0.5">
                    {distanceLeader}
                  </div>
                  {distanceValue !== null && (
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      {distanceValue.toLocaleString("no-NO", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      km
                    </div>
                  )}
                  {distanceRunnerUp ? (
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700 w-full text-center">
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-0.5">
                        Nærmeste utfordrer
                      </div>
                      <div className="text-base font-semibold text-yellow-800 dark:text-yellow-200">
                        {distanceRunnerUp}
                      </div>
                      {distanceRunnerUpValue !== null && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          {distanceRunnerUpValue.toLocaleString("no-NO", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          km
                          {distanceValue !== null && distanceValue > 0 && (
                            <span className="ml-1">
                              ({((distanceValue - distanceRunnerUpValue) / distanceValue * 100).toFixed(1)}% bak)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700 w-full text-center">
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                        Ingen utfordrer ennå
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Ingen data tilgjengelig
                </div>
              )}
            </div>
          </div>

          {/* Dotted Shirt - Elevation Leader */}
          <div className="flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-red-400 dark:border-red-600 rounded-lg">
            <div className="mb-2">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-lg border-4 border-red-500 dark:border-red-600 relative overflow-hidden">
                <svg
                  className="absolute inset-0 w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="red-dots"
                      x="0"
                      y="0"
                      width="16"
                      height="16"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="8" cy="8" r="2" fill="#dc2626" />
                    </pattern>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="url(#red-dots)"
                    className="opacity-80"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center w-full">
              <div className="text-sm font-medium text-red-900 dark:text-red-100 mb-0.5">
                Prikket trøye
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mb-2">
                Flest høydemeter
              </div>
              {elevationLeader ? (
                <>
                  <div className="text-xl font-bold text-red-900 dark:text-red-100 mb-0.5">
                    {elevationLeader}
                  </div>
                  {elevationValue !== null && (
                    <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {elevationValue.toLocaleString("no-NO")} m
                    </div>
                  )}
                  {elevationRunnerUp ? (
                    <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-700 w-full text-center">
                      <div className="text-xs text-red-600 dark:text-red-400 mb-0.5">
                        Nærmeste utfordrer
                      </div>
                      <div className="text-base font-semibold text-red-800 dark:text-red-200">
                        {elevationRunnerUp}
                      </div>
                      {elevationRunnerUpValue !== null && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {elevationRunnerUpValue.toLocaleString("no-NO")} m
                          {elevationValue !== null && elevationValue > 0 && (
                            <span className="ml-1">
                              ({((elevationValue - elevationRunnerUpValue) / elevationValue * 100).toFixed(1)}% bak)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-700 w-full text-center">
                      <div className="text-xs text-red-600 dark:text-red-400 italic">
                        Ingen utfordrer ennå
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Ingen data tilgjengelig
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

