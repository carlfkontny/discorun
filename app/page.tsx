import { RoadToFinish } from "./components/roadToFinish";
import { ProgressCard } from "./components/progress-card";
import { WalkRunLeaderboard } from "./components/leaderboards/walk-run-leaderboard";
import { ElevationLeaderboard } from "./components/leaderboards/elevation-leaderboard";
import { StrengthLeaderboard } from "./components/leaderboards/strength-leaderboard";
import { BikeLeaderboard } from "./components/leaderboards/bike-leaderboard";
import { SkiingLeaderboard } from "./components/leaderboards/skiing-leaderboard";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Årets sprekinger - 2026
      </h1>

      <div className="grid gap-6 mb-8">
        {/* Progress Card */}
        <div className="w-full">
          <ProgressCard />
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
  );
}
