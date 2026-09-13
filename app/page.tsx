import Link from "next/link";
import { RoadToFinish } from "./components/roadToFinish";
import { ProgressCard } from "./components/progress-card";
import { ShirtHolders } from "./components/shirt-holders";
import { WalkRunLeaderboard } from "./components/leaderboards/walk-run-leaderboard";
import { ElevationLeaderboard } from "./components/leaderboards/elevation-leaderboard";
import { StrengthLeaderboard } from "./components/leaderboards/strength-leaderboard";
import { BikeLeaderboard } from "./components/leaderboards/bike-leaderboard";
import { SkiingLeaderboard } from "./components/leaderboards/skiing-leaderboard";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 pr-2">
            <p className="mb-1 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              2026
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Årets sprekinger
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Felles oversikt over walk, run, hike og de andre øktene gjennom året.
            </p>
          </div>
          <Link
            href="/koble-til"
            className="inline-flex h-9 shrink-0 items-center justify-center self-start rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            Koble til Strava
          </Link>
        </header>

        <div className="mb-6 grid min-w-0 items-stretch gap-4 sm:gap-6 xl:grid-cols-2">
          <ProgressCard />
          <ShirtHolders />
        </div>

        <div className="mb-6 min-w-0">
          <RoadToFinish />
        </div>

        <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <WalkRunLeaderboard />
          <ElevationLeaderboard />
          <StrengthLeaderboard />
          <BikeLeaderboard />
          <SkiingLeaderboard />
        </div>
      </div>
    </div>
  );
}
