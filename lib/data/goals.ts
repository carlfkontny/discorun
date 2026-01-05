// Individual athlete goals for 2026 (in km for walk/run/hike)
// Update these values as needed
export const ATHLETE_GOALS: Record<string, number> = {
  Torbjørn: 0, //ikke med
  Henrik: 1200,
  Helle: 850,
  Jens: 780,
  Eirik: 750,
  Carl: 600,
  Joakim: 600,
  Kaia: 300,
  Anders: 300,
  Charlotte: 400,
  Miriam: 600,
  Silje: 100,
  Birgitte: 1200,
};

export function getAthleteGoal(athleteName: string): number {
  return ATHLETE_GOALS[athleteName] || 0;
}

export function getTotalGoal(): number {
  return Object.values(ATHLETE_GOALS).reduce((sum, goal) => sum + goal, 0);
}
