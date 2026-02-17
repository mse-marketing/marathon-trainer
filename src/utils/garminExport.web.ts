/**
 * Garmin Export – Web Fallback.
 *
 * Auf Web: Erstellt die .FIT Datei als Blob und bietet sie zum Download an.
 * expo-file-system und expo-sharing sind auf Web nicht verfuegbar.
 */

import { Workout, PaceZones } from '../models/types';
import { encodeFitWorkout, WorkoutStepDef } from './fitEncoder';

// Re-use the same pace/step conversion logic (inlined to avoid circular deps)

function paceToSpeed1000(paceSecPerKm: number): number {
  if (paceSecPerKm <= 0) return 0;
  return Math.round((1000 / paceSecPerKm) * 1000);
}

const DURATION_TIME = 0;
const DURATION_DISTANCE = 1;
const DURATION_OPEN = 5;
const TARGET_SPEED = 0;
const TARGET_OPEN = 2;
const INTENSITY_ACTIVE = 0;
const INTENSITY_REST = 1;
const INTENSITY_WARMUP = 2;
const INTENSITY_COOLDOWN = 3;

function convertWorkoutToSteps(workout: Workout, paceZones: PaceZones): WorkoutStepDef[] {
  const steps: WorkoutStepDef[] = [];

  for (const segment of workout.segments) {
    const zone = paceZones[segment.paceZone];
    const speedLow = paceToSpeed1000(zone.max);
    const speedHigh = paceToSpeed1000(zone.min);

    switch (segment.type) {
      case 'warmup':
        steps.push({
          name: 'Warm-up',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED, targetValue: 0, speedLow, speedHigh,
          intensity: INTENSITY_WARMUP,
        });
        break;
      case 'cooldown':
        steps.push({
          name: 'Cool-down',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED, targetValue: 0, speedLow, speedHigh,
          intensity: INTENSITY_COOLDOWN,
        });
        break;
      case 'interval': {
        if (segment.repeats && segment.repeats > 1 && segment.distanceKm) {
          const singleDistanceKm = segment.distanceKm / segment.repeats;
          const restDurationMs = parseRestDuration(segment.description);
          for (let r = 0; r < segment.repeats; r++) {
            steps.push({
              name: `${formatIntervalName(singleDistanceKm)} ${r + 1}/${segment.repeats}`,
              durationType: DURATION_DISTANCE,
              durationValue: Math.round(singleDistanceKm * 100000),
              targetType: TARGET_SPEED, targetValue: 0, speedLow, speedHigh,
              intensity: INTENSITY_ACTIVE,
            });
            if (r < segment.repeats - 1) {
              steps.push({
                name: 'Erholung', durationType: DURATION_TIME, durationValue: restDurationMs,
                targetType: TARGET_OPEN, targetValue: 0, speedLow: 0, speedHigh: 0,
                intensity: INTENSITY_REST,
              });
            }
          }
        } else {
          steps.push({
            name: segment.paceZone === 'tempo' ? 'Tempo' : 'Intervall',
            durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
            durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
            targetType: TARGET_SPEED, targetValue: 0, speedLow, speedHigh,
            intensity: INTENSITY_ACTIVE,
          });
        }
        break;
      }
      case 'main': {
        const nameMap: Record<string, string> = {
          easy: 'Easy', recovery: 'Recovery', marathon: 'Marathon Pace',
          tempo: 'Threshold', interval: 'VO2max', repetition: 'Speed',
        };
        steps.push({
          name: nameMap[segment.paceZone] || 'Laufen',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED, targetValue: 0, speedLow, speedHigh,
          intensity: INTENSITY_ACTIVE,
        });
        break;
      }
      case 'rest':
        steps.push({
          name: 'Pause',
          durationType: segment.durationMin ? DURATION_TIME : DURATION_OPEN,
          durationValue: segment.durationMin ? Math.round(segment.durationMin * 60 * 1000) : 0,
          targetType: TARGET_OPEN, targetValue: 0, speedLow: 0, speedHigh: 0,
          intensity: INTENSITY_REST,
        });
        break;
    }
  }
  return steps;
}

function parseRestDuration(description: string): number {
  const minMatch = description.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60 * 1000;
  const secMatch = description.match(/(\d+)\s*s(?:ek|ec)?/i);
  if (secMatch) return parseInt(secMatch[1]) * 1000;
  return 2 * 60 * 1000;
}

function formatIntervalName(distanceKm: number): string {
  if (distanceKm >= 1) return `${distanceKm.toFixed(1)}km`;
  return `${Math.round(distanceKm * 1000)}m`;
}

/**
 * Web version: Creates a .FIT file and triggers a browser download.
 */
export async function exportWorkoutToGarmin(
  workout: Workout,
  paceZones: PaceZones,
): Promise<void> {
  const steps = convertWorkoutToSteps(workout, paceZones);

  const cleanName = workout.title
    .replace(/[^\w\s\-–.]/g, '')
    .substring(0, 24)
    .trim();

  const fitData = encodeFitWorkout(cleanName, steps);
  const fileName = `workout_w${workout.weekNumber}_${workout.type}.fit`;

  // Web: Use Blob + download link
  const blob = new Blob([fitData], { type: 'application/vnd.ant.fit' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
