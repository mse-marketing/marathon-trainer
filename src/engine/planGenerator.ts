import * as Crypto from 'expo-crypto';
import { UserProfile, TrainingPlan, TrainingWeek, Workout, PaceZones, TrainingPhase, WorkoutType } from '../models/types';
import { calculatePaceZones } from './paceCalculator';
import { createPeriodization } from './periodization';
import {
  createEasyRun, createLongRun, createLongRunMP, createMediumLongRun,
  createTempoRun, createCruiseIntervals, createIntervalSession,
  createRepetitionSession, createProgressionRun, createRecoveryRun,
} from './workoutFactory';
import { addDays, startOfWeek, addWeeks } from 'date-fns';

/**
 * Wissenschaftlich fundierter Marathon-Trainingsplan-Generator.
 *
 * Hybrid-Ansatz: Das Beste aus den fuehrenden Methoden kombiniert:
 *
 * VON JACK DANIELS:
 * - VDOT-basierte Pace-Zonen (echte Daniels-Gilbert-Formel)
 * - 6 Trainingszonen: E, M, T, I, R
 * - 2 Quality-Workouts pro Woche (Q1 + Q2)
 * - 80/20-Regel: 80% Easy, 20% Quality
 * - Cruise Intervals als Tempo-Alternative
 *
 * VON PFITZINGER:
 * - Medium-Long Run (MLR) als zweiter "langer Lauf" unter der Woche
 * - Long Runs mit progressiven Marathon-Pace-Anteilen (MP Long Runs)
 * - Long Run Progression: 22→26→28→30→32→30→22→16 km
 * - Pfitzinger Taper: 75%→60%→40% ueber 3 Wochen
 *
 * VON DER FORSCHUNG:
 * - Max 10% Steigerungs-Regel (wir nutzen 5-8%)
 * - 3:1 Deload-Muster (3 Wochen Load, 1 Woche Recovery)
 * - Long Run max 30% des Wochenumfangs (oder 32km Cap)
 * - Block-Periodisierung: Base→Build→Peak→Taper
 */

function getDateForWeekDay(planStart: Date, weekNum: number, dayOfWeek: number): Date {
  const weekStart = addWeeks(startOfWeek(planStart, { weekStartsOn: 1 }), weekNum - 1);
  return addDays(weekStart, dayOfWeek);
}

export function generateTrainingPlan(profile: UserProfile): TrainingPlan {
  const today = new Date();
  const raceDate = new Date(profile.marathonDate);
  const totalWeeks = Math.max(
    8,
    Math.min(16, Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  );

  const { paceZones, vdot } = calculatePaceZones(profile.currentFitness, profile.fitnessDistanceKm);
  const { phases, deloadWeeks, weeklyKmMultiplier } = createPeriodization(totalWeeks);

  // Peak-Wochenkilometer: Wissenschaftlich fundierte Progression
  // Forschung: max 7-8% Steigerung pro Loading-Woche (unter 10%-Regel)
  // Bei 3:1 Deload-Muster: ~75% der Wochen sind Loading-Wochen
  // Niedrigere Basen haben mehr Wachstumspotenzial (8% statt 7%)
  const taperWeeks = totalWeeks >= 12 ? 3 : 2;
  const loadingWeeks = Math.round((totalWeeks - taperWeeks) * 0.75);
  const growthRate = profile.weeklyKmBase < 35 ? 1.08 : 1.07;
  const peakWeeklyKm = Math.round(profile.weeklyKmBase * Math.pow(growthRate, loadingWeeks));

  // Long Run Progression nach Pfitzinger (angepasst an Peak-km)
  const longRunProgression = buildLongRunProgression(totalWeeks, phases, deloadWeeks, peakWeeklyKm);

  const weeks: TrainingWeek[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const phase = phases[w - 1];
    const isDeload = deloadWeeks.has(w);
    const weekKm = Math.round(peakWeeklyKm * weeklyKmMultiplier[w - 1]);
    const longKm = longRunProgression[w - 1];

    const workouts = distributeWorkouts(
      w, totalWeeks, phase, isDeload, weekKm, longKm, profile, paceZones, today
    );

    weeks.push({
      weekNumber: w,
      phase,
      totalDistanceKm: weekKm,
      workouts,
      isDeloadWeek: isDeload,
    });
  }

  return {
    id: Crypto.randomUUID(),
    createdAt: today.toISOString(),
    userProfile: profile,
    paceZones,
    vdot,
    weeks,
    totalWeeks,
  };
}

/**
 * Pfitzinger-Stil Long Run Progression.
 * Baut progressiv auf bis 30-35km, mit Reduktion in Deload und Taper-Wochen.
 *
 * Marathon-Wissenschaft: Der laengste Long Run sollte 30-35km sein (Pfitzinger/Daniels).
 * - Pfitzinger 18/55: Peak Long Run = 32km bei 88km/Woche
 * - Pfitzinger 18/70: Peak Long Run = 35km bei 113km/Woche
 * - Daniels: Long Run = 25-30% des Wochenumfangs, max 2.5h
 * - Hanson: Cap bei 26km (aber hoehere Wochenumfaenge als Kompensation)
 */
function buildLongRunProgression(
  totalWeeks: number,
  phases: TrainingPhase[],
  deloadWeeks: Set<number>,
  peakWeeklyKm: number,
): number[] {
  const progression: number[] = [];

  // Startpunkt: ~30% des Peak-Wochenumfangs, minimum 14km
  const startLongRun = Math.max(14, Math.round(peakWeeklyKm * 0.30));

  // Marathon-spezifisches Minimum (Pfitzinger/Daniels):
  // - 14+ Wochen: 32km (Standard Pfitzinger)
  // - 10-13 Wochen: 30km (oder 32km wenn Peak-Volumen es hergibt, >= 55km/w)
  // - 8-9 Wochen: 28km (Kompromiss bei kurzer Vorbereitung)
  const minPeakLongRun = totalWeeks >= 14 ? 32
    : totalWeeks >= 10 ? (peakWeeklyKm >= 55 ? 32 : 30)
    : 28;

  // Maximum: 35km (Pfitzinger Advanced) oder 45% des Peak-Wochenumfangs
  // Safety: Long Run darf nie mehr als 60% des Peak-Wochenumfangs betragen
  // (Higdon Novice erlaubt bis ~50%, wir sind mit 60% etwas grosszuegiger)
  const hardMax = Math.round(peakWeeklyKm * 0.60);
  const maxLongRun = Math.min(
    hardMax,
    Math.max(minPeakLongRun, Math.min(35, Math.round(peakWeeklyKm * 0.45))),
  );

  // Berechne dynamische Steigerung pro Woche ueber Base+Build
  const buildUpWeeks = phases.filter((p) => p === 'base' || p === 'build').length;
  const kmPerWeek = buildUpWeeks > 1 ? (maxLongRun - startLongRun) / (buildUpWeeks - 1) : 2;

  for (let w = 1; w <= totalWeeks; w++) {
    const phase = phases[w - 1];
    const isDeload = deloadWeeks.has(w);

    let km: number;
    switch (phase) {
      case 'base': {
        // Progressive Steigerung: dynamisch berechnet
        const baseWeekIdx = phases.slice(0, w).filter((p) => p === 'base').length;
        km = Math.min(startLongRun + (baseWeekIdx - 1) * kmPerWeek, maxLongRun - 4);
        break;
      }
      case 'build': {
        // Weiter aufbauen Richtung Peak
        const totalBuildUpIdx = phases.slice(0, w).filter((p) => p === 'base' || p === 'build').length;
        km = Math.min(startLongRun + (totalBuildUpIdx - 1) * kmPerWeek, maxLongRun);
        break;
      }
      case 'peak': {
        // Hoechste Long Runs: voller Peak
        km = maxLongRun;
        break;
      }
      case 'taper': {
        // Progressiv kuerzer: 70% → 55% → 35% des Peak
        const numTaperWeeks = phases.filter((p) => p === 'taper').length;
        const taperIdx = phases.slice(0, w).filter((p) => p === 'taper').length;
        const taperFactors = numTaperWeeks === 3 ? [0.70, 0.55, 0.35] : [0.60, 0.35];
        km = Math.round(maxLongRun * (taperFactors[taperIdx - 1] ?? 0.35));
        break;
      }
    }

    // Deload: -25%
    if (isDeload) km = Math.round(km * 0.75);

    // Minimum 8km Long Run
    progression.push(Math.max(8, Math.round(km)));
  }

  return progression;
}

/**
 * Intelligente Workout-Verteilung nach Daniels/Pfitzinger Hybrid.
 *
 * Daniels-Prinzip: 2 Quality-Workouts (Q1, Q2) + Easy-Tage
 * Pfitzinger-Prinzip: Medium-Long Run unter der Woche
 *
 * Wochen-Muster (4 Laeufe):
 *   Base:  Easy | Tempo (Q1) | MLR | Long Run
 *   Build: Easy | Intervals (Q1) | Tempo/Cruise (Q2) | MP Long Run
 *   Peak:  Easy | VO2max (Q1) | Progression (Q2) | MP Long Run
 *   Taper: Easy | Short Tempo | Easy | Short Long
 *
 * Wochen-Muster (5 Laeufe):
 *   + Recovery Run am Tag nach Quality
 *
 * 80/20-Regel: Nur ~20% der Wochen-km sind "hart" (T/I/R/MP)
 */
function distributeWorkouts(
  weekNum: number,
  totalWeeks: number,
  phase: TrainingPhase,
  isDeload: boolean,
  weekKm: number,
  longRunKm: number,
  profile: UserProfile,
  paces: PaceZones,
  planStart: Date,
): Workout[] {
  const { runsPerWeek, runDays } = profile;
  const workouts: Workout[] = [];

  // Calculate remaining km after long run
  const remainingKm = weekKm - longRunKm;
  const otherRuns = runsPerWeek - 1;
  const avgOtherKm = Math.max(4, Math.round(remainingKm / otherRuns));

  // Medium-Long Run: 60-70% of Long Run km (Pfitzinger)
  const mediumLongKm = Math.round(longRunKm * 0.6);

  // Build workout schedule based on phase and runs/week
  const schedule = buildWeekSchedule(
    phase, isDeload, runsPerWeek, weekNum, totalWeeks, avgOtherKm, longRunKm, mediumLongKm, paces
  );

  // Map workouts to actual days
  for (let i = 0; i < schedule.length; i++) {
    const workout = schedule[i];
    const day = runDays[i % runDays.length];
    const date = getDateForWeekDay(planStart, weekNum, day);

    workout.weekNumber = weekNum;
    workout.dayOfWeek = day;
    workout.date = date.toISOString();
    workout.phase = phase;
    workout.completed = false;

    workouts.push(workout);
  }

  return workouts;
}

function buildWeekSchedule(
  phase: TrainingPhase,
  isDeload: boolean,
  runsPerWeek: 3 | 4 | 5,
  weekNum: number,
  totalWeeks: number,
  avgKm: number,
  longKm: number,
  mlrKm: number,
  paces: PaceZones,
): Workout[] {
  // Deload: vereinfacht – nur Easy + kurzer Tempo + kuerzerer Long
  if (isDeload) {
    return buildDeloadWeek(runsPerWeek, avgKm, longKm, paces);
  }

  switch (phase) {
    case 'base':
      return buildBaseWeek(runsPerWeek, avgKm, longKm, mlrKm, paces, weekNum);
    case 'build':
      return buildBuildWeek(runsPerWeek, avgKm, longKm, mlrKm, paces, weekNum);
    case 'peak':
      return buildPeakWeek(runsPerWeek, avgKm, longKm, mlrKm, paces, weekNum);
    case 'taper':
      return buildTaperWeek(runsPerWeek, avgKm, longKm, paces, weekNum, totalWeeks);
  }
}

// === BASE PHASE ===
// Fokus: Aerobe Grundlage, Laufökonomie
// Daniels: nur E + leichtes T, kein I
function buildBaseWeek(runs: number, km: number, longKm: number, mlrKm: number, p: PaceZones, w: number): Workout[] {
  const tempoKm = Math.max(2, Math.round(km * 0.35));
  const workouts: Workout[] = [];

  if (runs >= 5) workouts.push(createEasyRun(km, p));
  workouts.push(createTempoRun(km + 1, tempoKm, p));          // Q1: Threshold
  if (runs >= 4) workouts.push(createMediumLongRun(mlrKm, p)); // MLR
  workouts.push(createEasyRun(km, p));
  workouts.push(createLongRun(longKm, p));                     // Long Run (rein aerob in Base)

  return workouts.slice(0, runs);
}

// === BUILD PHASE ===
// Fokus: Intensitaet aufbauen, MP Long Runs einfuehren
// Daniels: T + I, Pfitzinger: MP in Long Runs
function buildBuildWeek(runs: number, km: number, longKm: number, mlrKm: number, p: PaceZones, w: number): Workout[] {
  const workouts: Workout[] = [];
  const useIntervals = w % 2 === 0;
  const mpKm = Math.round(longKm * 0.3); // 30% des Long Runs in MP

  if (runs >= 5) workouts.push(createRecoveryRun(Math.max(4, km - 2), p));

  // Q1: Alternierend VO2max Intervalle oder Cruise Intervals
  if (useIntervals) {
    workouts.push(createIntervalSession(km + 1, 1000, 5, p));
  } else {
    workouts.push(createCruiseIntervals(km + 1, 1.6, 4, p));
  }

  if (runs >= 4) workouts.push(createMediumLongRun(mlrKm, p));
  workouts.push(createEasyRun(km, p));

  // Long Run: mit Marathon-Pace-Anteil (Pfitzinger)
  workouts.push(createLongRunMP(longKm, mpKm, p));

  return workouts.slice(0, runs);
}

// === PEAK PHASE ===
// Fokus: Hoechstbelastung, alle Systeme auf Maximum, race-specific
function buildPeakWeek(runs: number, km: number, longKm: number, mlrKm: number, p: PaceZones, w: number): Workout[] {
  const workouts: Workout[] = [];
  const mpKm = Math.round(longKm * 0.4); // 40% MP in Peak Long Runs

  if (runs >= 5) workouts.push(createRecoveryRun(Math.max(4, km - 2), p));

  // Q1: VO2max (Daniels I-Pace)
  workouts.push(createIntervalSession(km + 1, 1200, 5, p));

  // Q2: Progression Run oder Tempo
  if (runs >= 4) {
    workouts.push(createProgressionRun(km + 2, p));
  }

  workouts.push(createEasyRun(km, p));

  // Long Run: laengster mit hohem MP-Anteil
  workouts.push(createLongRunMP(longKm, mpKm, p));

  return workouts.slice(0, runs);
}

// === TAPER PHASE ===
// Fokus: Frische aufbauen, Intensitaet halten, Umfang reduzieren
// Pfitzinger: Volumen runter, kurze Speed-Touches behalten
function buildTaperWeek(runs: number, km: number, longKm: number, p: PaceZones, w: number, totalWeeks: number): Workout[] {
  const workouts: Workout[] = [];
  const isRaceWeek = w === totalWeeks;

  if (isRaceWeek) {
    // Race Week: ganz leicht
    workouts.push(createEasyRun(Math.max(4, km - 2), p));
    if (runs >= 4) workouts.push(createEasyRun(3, p));
    // Kurzer Tempo-Touch um die Beine "aufzuwecken"
    workouts.push(createTempoRun(5, 2, p));
    if (runs >= 5) workouts.push(createRecoveryRun(3, p));
    // Kein Long Run in Race Week
    workouts.push(createEasyRun(4, p));
  } else {
    if (runs >= 5) workouts.push(createRecoveryRun(Math.max(3, km - 3), p));
    // Kurzer Tempo: Intensitaet halten, Umfang runter
    workouts.push(createTempoRun(km, Math.max(2, Math.round(km * 0.3)), p));
    if (runs >= 4) workouts.push(createEasyRun(km, p));
    workouts.push(createEasyRun(km, p));
    workouts.push(createLongRun(longKm, p));
  }

  return workouts.slice(0, runs);
}

// === DELOAD WEEK ===
// 3:1 Muster: Nach 3 harten Wochen, 1 leichte Woche
function buildDeloadWeek(runs: number, km: number, longKm: number, p: PaceZones): Workout[] {
  const workouts: Workout[] = [];
  const deloadKm = Math.max(3, km - 2);

  if (runs >= 5) workouts.push(createRecoveryRun(deloadKm, p));
  // Nur leichtes Tempo: Intensitaet erinnern, nicht belasten
  workouts.push(createTempoRun(deloadKm + 1, Math.max(2, Math.round(deloadKm * 0.25)), p));
  if (runs >= 4) workouts.push(createEasyRun(deloadKm, p));
  workouts.push(createEasyRun(deloadKm, p));
  workouts.push(createLongRun(longKm, p)); // Kuerzerer Long Run

  return workouts.slice(0, runs);
}
