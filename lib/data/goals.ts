// Individual athlete goals for 2026 (in km for walk/run/hike)
// Update these values as needed
export const ATHLETE_GOALS: Record<string, number> = {
  "Torbjørn": 800, //ikke satt
  "Henrik": 1200,
  "Helle": 600, //ikke satt
  "Jens": 750, //ikke satt
  "Eirik": 750,
  "Carl": 600,
  "Joakim": 600,
  "Kaia": 300,
  "Anders": 600, //ikke satt
  "Charlotte": 550, //ikke satt
  "Miriam": 600, 
  "Silje": 100, 
  "Birgitte": 1200,
}

export function getAthleteGoal(athleteName: string): number {
  return ATHLETE_GOALS[athleteName] || 0
}

