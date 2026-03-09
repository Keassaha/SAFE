export function computeMontant(dureeMinutes: number, tauxHoraire: number): number {
  return Math.round((dureeMinutes / 60) * tauxHoraire * 100) / 100;
}

/** Arrondit la durée au multiple supérieur (ex: 67 min, 6 min → 72). */
export function roundDurationMinutes(minutes: number, roundingMinutes: number): number {
  if (roundingMinutes <= 0) return minutes;
  return Math.ceil(minutes / roundingMinutes) * roundingMinutes;
}
