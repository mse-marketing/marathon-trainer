import * as Crypto from 'expo-crypto';
import { Workout, PaceZones, TrainingPhase, WorkoutSegment } from '../models/types';

function generateId(): string {
  return Crypto.randomUUID();
}

// === EASY RUN (Daniels E-Pace) ===
export function createEasyRun(distanceKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 3);
  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'easy', phase: 'base',
    title: `Easy Run – ${d.toFixed(1)} km`,
    description: 'Lockerer Dauerlauf in der Easy-Zone (Daniels E-Pace). Du solltest dich problemlos unterhalten koennen.',
    totalDistanceKm: d,
    estimatedDurationMin: Math.round((d * paces.easy.min) / 60),
    segments: [
      { type: 'warmup', distanceKm: 1, paceZone: 'recovery', description: '1 km einlaufen' },
      { type: 'main', distanceKm: Math.max(d - 2, 1), paceZone: 'easy', description: 'Hauptteil Easy Pace (E)' },
      { type: 'cooldown', distanceKm: 1, paceZone: 'recovery', description: '1 km auslaufen' },
    ],
    completed: false,
  };
}

// === LONG RUN – rein aerob (Pfitzinger Endurance) ===
export function createLongRun(distanceKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 8);
  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'long', phase: 'base',
    title: `Long Run – ${d.toFixed(1)} km`,
    description: d >= 30
      ? 'Langer Dauerlauf – Renn-Vorbereitung! 48h vorher Carb Loading starten (8-10g Kohlenhydrate/kg). Waehrend des Laufs: 60-90g Kohlenhydrate/Stunde ab Km 5.'
      : d >= 24
      ? 'Langer Dauerlauf. Vorabend kohlenhydratreich essen. Ab 60 Min: 30-60g Kohlenhydrate/Stunde (Gel oder Iso-Drink).'
      : 'Langer, lockerer Dauerlauf. Fokus: Zeit auf den Beinen, aerobe Grundlage aufbauen.',
    totalDistanceKm: d,
    estimatedDurationMin: Math.round((d * paces.easy.min) / 60),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'recovery', description: '2 km einlaufen' },
      { type: 'main', distanceKm: Math.max(d - 3, 1), paceZone: 'easy', description: 'Easy Pace – entspannt bleiben' },
      { type: 'cooldown', distanceKm: 1, paceZone: 'recovery', description: '1 km auslaufen' },
    ],
    completed: false,
  };
}

// === LONG RUN MIT MARATHON-PACE (Pfitzinger MP Long Run) ===
// Das Herzstück der Marathon-Vorbereitung nach Pfitzinger
export function createLongRunMP(distanceKm: number, mpKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 10);
  const mp = Math.min(mpKm, Math.round(d * 0.45));

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'long_mp', phase: 'build',
    title: `MP Long Run – ${d.toFixed(0)} km (${mp} km @ MP)`,
    description: d >= 30
      ? `Renn-Simulation! ${mp} km @ Marathon Pace. CARB LOADING 48h vorher. Waehrend: 60-90g KH/h ab Km 5 – genau wie am Race Day!`
      : `Pfitzinger-Stil: ${mp} km in Marathon-Pace eingebaut. Vorabend kohlenhydratreich essen, ab 60 Min Gels/Iso-Drink zufuehren.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (2 * paces.recovery.min + (d - mp - 3) * paces.easy.min + mp * paces.marathon.min + 1 * paces.recovery.min) / 60
    ),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'recovery', description: '2 km einlaufen' },
      { type: 'main', distanceKm: Math.max(d - mp - 3, 2), paceZone: 'easy', description: 'Easy Pace' },
      { type: 'main', distanceKm: mp, paceZone: 'marathon', description: `${mp} km @ Marathon Pace – Renn-Simulation!` },
      { type: 'cooldown', distanceKm: 1, paceZone: 'recovery', description: '1 km auslaufen' },
    ],
    completed: false,
  };
}

// === MEDIUM-LONG RUN (Pfitzinger) ===
// Der "geheime Schluessel" in Pfitzingers System – Mittwochs-Langer-Lauf
export function createMediumLongRun(distanceKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 6);
  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'medium_long', phase: 'base',
    title: `Medium Long Run – ${d.toFixed(1)} km`,
    description: 'Pfitzinger Medium-Long Run: Laenger als ein normaler Easy Run, trainiert die aerobe Kapazitaet ohne die Ermuedung eines echten Long Runs.',
    totalDistanceKm: d,
    estimatedDurationMin: Math.round((d * paces.easy.min) / 60),
    segments: [
      { type: 'warmup', distanceKm: 1, paceZone: 'recovery', description: '1 km einlaufen' },
      { type: 'main', distanceKm: Math.max(d - 2, 1), paceZone: 'easy', description: 'Steady Easy Pace' },
      { type: 'cooldown', distanceKm: 1, paceZone: 'recovery', description: '1 km auslaufen' },
    ],
    completed: false,
  };
}

// === TEMPO / THRESHOLD RUN (Daniels T-Pace) ===
// Laktatschwelle verbessern – Daniels empfiehlt 20-40min T-Pace am Stueck
export function createTempoRun(distanceKm: number, tempoKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 5);
  const t = Math.max(1, Math.min(tempoKm, d - 3));

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'tempo', phase: 'base',
    title: `Tempo Run – ${t} km @ T-Pace`,
    description: `Daniels Threshold-Lauf: ${t} km an der Laktatschwelle. Sollte sich "angenehm hart" anfuehlen – du kannst noch in kurzen Saetzen sprechen.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (2 * paces.easy.min + t * paces.tempo.min + (d - t - 2) * paces.easy.min) / 60
    ),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'easy', description: '2 km einlaufen' },
      { type: 'main', distanceKm: t, paceZone: 'tempo', description: `${t} km @ Threshold Pace (T)` },
      { type: 'cooldown', distanceKm: Math.max(d - t - 2, 1), paceZone: 'easy', description: 'Auslaufen' },
    ],
    completed: false,
  };
}

// === TEMPO INTERVALS (Daniels Cruise Intervals) ===
// Alternative zum durchgaengigen Tempo: 3-4 x 1.5-2km @ T-Pace
export function createCruiseIntervals(distanceKm: number, repKm: number, repeats: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 6);
  const totalTempoKm = repKm * repeats;

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'tempo', phase: 'build',
    title: `Cruise Intervals – ${repeats}x ${repKm.toFixed(1)} km @ T-Pace`,
    description: `Daniels Cruise Intervals: ${repeats} Wiederholungen a ${repKm.toFixed(1)} km mit 60s Trabpause. Effektiver als durchgaengiges Tempo bei gleichem Trainingseffekt.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (2 * paces.easy.min + totalTempoKm * paces.tempo.min + (d - totalTempoKm - 2) * paces.easy.min) / 60
    ),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'easy', description: '2 km einlaufen' },
      {
        type: 'interval', distanceKm: totalTempoKm, paceZone: 'tempo', repeats,
        description: `${repeats}x ${repKm.toFixed(1)} km @ T-Pace, 60s Trabpause`,
      },
      { type: 'cooldown', distanceKm: Math.max(d - totalTempoKm - 2, 1), paceZone: 'easy', description: 'Auslaufen' },
    ],
    completed: false,
  };
}

// === VO2MAX INTERVALS (Daniels I-Pace) ===
// Maximale Sauerstoffaufnahme trainieren – 3-5min Belastungen
export function createIntervalSession(
  totalKm: number, intervalDistanceM: number, repeats: number, paces: PaceZones
): Workout {
  const d = Math.max(totalKm, 6);
  const intervalKm = (intervalDistanceM * repeats) / 1000;
  const restDescription = intervalDistanceM >= 1000
    ? `${repeats}x ${intervalDistanceM}m @ I-Pace, 3 min Trabpause (50-90% der Belastungszeit)`
    : `${repeats}x ${intervalDistanceM}m @ I-Pace, 2 min Trabpause`;

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'intervals', phase: 'build',
    title: `VO2max Intervalle – ${repeats}x ${intervalDistanceM}m`,
    description: `Daniels I-Pace: ${repeats} Wiederholungen a ${intervalDistanceM}m. Maximiert die Sauerstoffaufnahme (VO2max). Trabpause = 50-90% der Belastungszeit.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (2 * paces.easy.min + intervalKm * paces.interval.min + (d - intervalKm - 2) * paces.easy.min) / 60
    ),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'easy', description: '2 km einlaufen + Lauf-ABC + 4 Steigerungen' },
      { type: 'interval', distanceKm: intervalKm, paceZone: 'interval', repeats, description: restDescription },
      { type: 'cooldown', distanceKm: Math.max(d - intervalKm - 2, 1), paceZone: 'easy', description: 'Auslaufen' },
    ],
    completed: false,
  };
}

// === REPETITION SESSION (Daniels R-Pace) ===
// Laufökonomie + neuromuskulaere Kraft – kurze, schnelle Wiederholungen
export function createRepetitionSession(totalKm: number, repDistanceM: number, repeats: number, paces: PaceZones): Workout {
  const d = Math.max(totalKm, 5);
  const repKm = (repDistanceM * repeats) / 1000;

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'repetition', phase: 'build',
    title: `Repetitions – ${repeats}x ${repDistanceM}m`,
    description: `Daniels R-Pace: ${repeats}x ${repDistanceM}m schnell mit voller Erholung. Verbessert Laufoekonomie und neuromuskulaere Kraft.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (2 * paces.easy.min + repKm * paces.repetition.min + (d - repKm - 2) * paces.easy.min) / 60
    ),
    segments: [
      { type: 'warmup', distanceKm: 2, paceZone: 'easy', description: '2 km einlaufen + Lauf-ABC + Steigerungen' },
      {
        type: 'interval', distanceKm: repKm, paceZone: 'repetition', repeats,
        description: `${repeats}x ${repDistanceM}m @ R-Pace, volle Erholung (Trabpause = Belastungszeit)`,
      },
      { type: 'cooldown', distanceKm: Math.max(d - repKm - 2, 1), paceZone: 'easy', description: 'Auslaufen' },
    ],
    completed: false,
  };
}

// === PROGRESSION RUN ===
// Startet easy, steigert sich bis Tempo – trainiert "Finish Strong" Mentalitaet
export function createProgressionRun(distanceKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 6);
  const easyKm = Math.round(d * 0.5);
  const mpKm = Math.round(d * 0.3);
  const tempoKm = Math.max(d - easyKm - mpKm, 1);

  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'progression', phase: 'build',
    title: `Progression Run – ${d.toFixed(0)} km`,
    description: `Starte easy und steigere dich: Easy → Marathon Pace → Tempo. Trainiert den "Negativsplit" fuer den Marathon.`,
    totalDistanceKm: d,
    estimatedDurationMin: Math.round(
      (easyKm * paces.easy.min + mpKm * paces.marathon.min + tempoKm * paces.tempo.min) / 60
    ),
    segments: [
      { type: 'main', distanceKm: easyKm, paceZone: 'easy', description: `${easyKm} km Easy Pace – einlaufen` },
      { type: 'main', distanceKm: mpKm, paceZone: 'marathon', description: `${mpKm} km Marathon Pace – Tempo erhoehen` },
      { type: 'main', distanceKm: tempoKm, paceZone: 'tempo', description: `${tempoKm} km Threshold Pace – stark finishen!` },
    ],
    completed: false,
  };
}

// === RECOVERY RUN ===
export function createRecoveryRun(distanceKm: number, paces: PaceZones): Workout {
  const d = Math.max(distanceKm, 3);
  return {
    id: generateId(), weekNumber: 0, dayOfWeek: 0, date: '', type: 'recovery', phase: 'base',
    title: `Recovery Run – ${d.toFixed(1)} km`,
    description: 'Sehr lockerer Regenerationslauf. Ego zuhause lassen! Dient der aktiven Erholung.',
    totalDistanceKm: d,
    estimatedDurationMin: Math.round((d * paces.recovery.min) / 60),
    segments: [
      { type: 'main', distanceKm: d, paceZone: 'recovery', description: 'Recovery Pace – wirklich ganz locker' },
    ],
    completed: false,
  };
}
