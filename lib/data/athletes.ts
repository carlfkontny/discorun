export const ATHLETE_NAMES: Record<number, string> = {
  20749962: "Torbjørn",
  23372809: "Henrik",
  11395648: "Helle",
  81469496: "Jens",
  10598450: "Eirik",
  10960485: "Carl",
  14755260: "Joakim",
  106424727: "Kaia",
  29147412: "Anders",
  115334835: "Charlotte",
  29120278: "Miriam",
  87844878: "Silje",
  1703320: "Birgitte"
}

export function getAthleteName(athleteId: number): string {
  return ATHLETE_NAMES[athleteId] || `Athlete ${athleteId}`
}

