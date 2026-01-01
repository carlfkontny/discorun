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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Årets sprekinger - 2026
        </h1>

        <div className="grid gap-6 mb-8">
          {/* Progress Card */}
          <div className="w-full">
            <ProgressCard />
          </div>

          {/* Shirt Holders */}
          <div className="w-full">
            <ShirtHolders />
          </div>

          {/* Road to Finish Chart */}
          <div className="w-full">
            <RoadToFinish />
          </div>
        </div>

        {/* Leaderboards Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
