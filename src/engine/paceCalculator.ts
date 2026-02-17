import { PaceZones } from '../models/types';

/**
 * Echte Daniels-Gilbert VDOT-Formel.
 *
 * Quellen:
 * - Jack Daniels "Daniels' Running Formula" (4th Ed.)
 * - Daniels & Gilbert Oxygen Power Tables
 * - VDOT = VO2 / %VO2max  (both estimated from velocity & duration)
 *
 * Die Formel besteht aus zwei Teilen:
 * 1. VO2-Kostenfunktion: Sauerstoffverbrauch basierend auf Geschwindigkeit
 * 2. Auslastungsfunktion: % von VO2max basierend auf Renndauer
 */

// VO2 cost as function of velocity (m/min)
function vo2FromVelocity(velocityMperMin: number): number {
  return -4.60 + 0.182258 * velocityMperMin + 0.000104 * velocityMperMin * velocityMperMin;
}

// Fraction of VO2max sustainable over given duration (min)
function fractionVO2max(durationMin: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * durationMin)
       + 0.2989558 * Math.exp(-0.1932605 * durationMin);
}

/**
 * Berechnet VDOT aus einer Rennleistung.
 */
export function calculateVDOT(distanceMeters: number, durationMin: number): number {
  const velocity = distanceMeters / durationMin;
  const vo2 = vo2FromVelocity(velocity);
  const fraction = fractionVO2max(durationMin);
  return vo2 / fraction;
}

/**
 * Berechnet die Geschwindigkeit (m/min) fuer eine bestimmte
 * Dauer bei einem gegebenen VDOT-Wert via Newton-Raphson.
 */
function velocityAtVDOT(vdot: number, durationMin: number): number {
  const fraction = fractionVO2max(durationMin);
  const targetVO2 = vdot * fraction;

  let v = 200;
  for (let i = 0; i < 50; i++) {
    const vo2 = vo2FromVelocity(v);
    const dVO2 = 0.182258 + 2 * 0.000104 * v;
    const delta = (vo2 - targetVO2) / dVO2;
    v -= delta;
    if (Math.abs(delta) < 0.001) break;
  }
  return Math.max(v, 50);
}

/**
 * Berechnet die Marathon-Rennzeit (Min) fuer einen VDOT-Wert.
 */
function predictMarathonTime(vdot: number): number {
  let t = 240;
  for (let i = 0; i < 100; i++) {
    const v = velocityAtVDOT(vdot, t);
    const predictedDist = v * t;
    const error = predictedDist - 42195;
    if (Math.abs(error) < 1) break;
    t = t * 42195 / predictedDist;
  }
  return t;
}

function paceFromVelocity(velocityMperMin: number): number {
  return (1000 / velocityMperMin) * 60;
}

/**
 * Berechnet alle 6 Pace-Zonen nach Daniels' Running Formula.
 *
 * Daniels definiert Trainingszonen via % VO2max:
 * - E (Easy):       59-74% VO2max
 * - M (Marathon):   ~80% VO2max, Pace bei vorhergesagter Marathon-Dauer
 * - T (Threshold):  ~88% VO2max, ~60min Renntempo
 * - I (Interval):   ~98% VO2max, ~11min Renntempo
 * - R (Repetition): >100% VO2max, ~3.5min Renntempo
 */
export function calculatePaceZones(
  recentTimeMin: number,
  distanceKm: number
): { paceZones: PaceZones; vdot: number } {
  const distanceMeters = distanceKm * 1000;
  const vdot = calculateVDOT(distanceMeters, recentTimeMin);

  // Easy: 65-79% VO2max
  const easySlowV = velocityAtVDOT(vdot * 0.65, 30);
  const easyFastV = velocityAtVDOT(vdot * 0.79, 30);

  // Recovery: 58-65% VO2max
  const recovSlowV = velocityAtVDOT(vdot * 0.58, 30);
  const recovFastV = velocityAtVDOT(vdot * 0.65, 30);

  // Marathon: Pace bei vorhergesagter Marathon-Dauer
  const marathonTime = predictMarathonTime(vdot);
  const marathonV = velocityAtVDOT(vdot, marathonTime);

  // Threshold (T): ~60 min Renndauer
  const tempoV = velocityAtVDOT(vdot, 60);

  // Interval (I): ~11 min Renndauer
  const intervalV = velocityAtVDOT(vdot, 11);

  // Repetition (R): ~3.5 min Renndauer
  const repV = velocityAtVDOT(vdot, 3.5);

  const paceZones: PaceZones = {
    recovery: {
      min: Math.round(paceFromVelocity(recovFastV)),
      max: Math.round(paceFromVelocity(recovSlowV)),
    },
    easy: {
      min: Math.round(paceFromVelocity(easyFastV)),
      max: Math.round(paceFromVelocity(easySlowV)),
    },
    marathon: {
      min: Math.round(paceFromVelocity(marathonV) - 3),
      max: Math.round(paceFromVelocity(marathonV) + 3),
    },
    tempo: {
      min: Math.round(paceFromVelocity(tempoV) - 3),
      max: Math.round(paceFromVelocity(tempoV) + 3),
    },
    interval: {
      min: Math.round(paceFromVelocity(intervalV) - 3),
      max: Math.round(paceFromVelocity(intervalV) + 3),
    },
    repetition: {
      min: Math.round(paceFromVelocity(repV) - 3),
      max: Math.round(paceFromVelocity(repV) + 3),
    },
  };

  return { paceZones, vdot: Math.round(vdot * 10) / 10 };
}
