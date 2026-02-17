import { TrainingPhase } from '../models/types';

/**
 * Wissenschaftlich fundierte Marathon-Periodisierung.
 *
 * Basiert auf:
 * - Pfitzinger "Advanced Marathoning": 3+1 Mesocycle-Struktur
 * - Daniels: 2 Quality-Workouts / Woche, progressive Intensitaet
 * - Forschung (PMC11065819): max 5-10% Steigerung/Woche
 * - Deload-Wochen alle 3 Wochen (3:1 Load:Recovery)
 *
 * Phasen-Struktur (11-Wochen-Beispiel fuer Prag-Marathon):
 * - Base (W1-3):   Aerobe Grundlage, nur E + Long + leichtes T
 * - Build (W4-7):  Progressive Overload, T + I + MP-Long Runs
 * - Peak (W8-9):   Hoechstbelastung, laengste Long Runs, alle Workout-Typen
 * - Taper (W10-11): 60% → 40% Umfang, Intensitaet bleibt, Frische aufbauen
 */
export function createPeriodization(totalWeeks: number): {
  phases: TrainingPhase[];
  deloadWeeks: Set<number>;
  weeklyKmMultiplier: number[];
  longRunKm: number[];
} {
  const phases: TrainingPhase[] = [];
  const deloadWeeks = new Set<number>();
  const weeklyKmMultiplier: number[] = [];
  const longRunKm: number[] = [];

  // Phase-Verteilung: Pfitzinger-Stil
  const taperWeeks = totalWeeks >= 12 ? 3 : 2;
  const peakWeeks = 2;
  const remainingWeeks = totalWeeks - taperWeeks - peakWeeks;
  const baseWeeks = Math.max(2, Math.ceil(remainingWeeks * 0.4));
  const buildWeeks = remainingWeeks - baseWeeks;

  for (let w = 1; w <= totalWeeks; w++) {
    if (w <= baseWeeks) {
      phases.push('base');
    } else if (w <= baseWeeks + buildWeeks) {
      phases.push('build');
    } else if (w <= baseWeeks + buildWeeks + peakWeeks) {
      phases.push('peak');
    } else {
      phases.push('taper');
    }

    // Deload: 3:1 Muster (jede 3. Woche in Base/Build, Woche 3, 6, 9...)
    // Nicht in Peak oder Taper
    if (w % 3 === 0 && w <= baseWeeks + buildWeeks) {
      deloadWeeks.add(w);
    }
  }

  // Km-Multiplikatoren: wissenschaftliche Progression
  // Basis: max +8% pro Woche (konservativ unter 10%-Regel)
  // Deload: -25-30% Reduktion
  // Taper: Pfitzinger-Stil 75% → 60% → 40%
  for (let w = 1; w <= totalWeeks; w++) {
    const phase = phases[w - 1];
    const isDeload = deloadWeeks.has(w);

    let multiplier: number;
    switch (phase) {
      case 'base': {
        // Sanfter Anstieg: 75% → 90% des Peak-Volumens
        const baseProgress = (w - 1) / Math.max(baseWeeks - 1, 1);
        multiplier = 0.75 + baseProgress * 0.15;
        break;
      }
      case 'build': {
        // Staerkerer Anstieg: 90% → 100% des Peak-Volumens
        const buildProgress = (w - baseWeeks - 1) / Math.max(buildWeeks - 1, 1);
        multiplier = 0.90 + buildProgress * 0.10;
        break;
      }
      case 'peak':
        multiplier = 1.0;
        break;
      case 'taper': {
        // Pfitzinger Taper: progressive Reduktion
        const taperWeekNum = w - (totalWeeks - taperWeeks);
        if (taperWeeks === 3) {
          multiplier = [0.75, 0.60, 0.40][taperWeekNum - 1] ?? 0.40;
        } else {
          multiplier = [0.65, 0.40][taperWeekNum - 1] ?? 0.40;
        }
        break;
      }
    }

    weeklyKmMultiplier.push(isDeload ? multiplier * 0.72 : multiplier);
  }

  return { phases, deloadWeeks, weeklyKmMultiplier, longRunKm };
}
