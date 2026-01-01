// Individual athlete goals for 2026 (in km for walk/run/hike)
// Update these values as needed
export const ATHLETE_GOALS: Record<string, number> = {
  "Torbjørn": 800,
  "Henrik": 700,
  "Helle": 600,
  "Jens": 750,
  "Eirik": 650,
  "Carl": 900,
  "Joakim": 550,
  "Kaia": 500,
  "Anders": 600,
  "Charlotte": 550,
  "Miriam": 500,
  "Silje": 600,
}

export function getAthleteGoal(athleteName: string): number {
  return ATHLETE_GOALS[athleteName] || 0
}

