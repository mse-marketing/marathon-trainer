/**
 * Konvertiert Marathon Trainer Workouts in Garmin .FIT Workout-Dateien.
 *
 * Die .FIT Datei kann ueber das Share-Sheet an Garmin Connect gesendet werden,
 * wo sie automatisch importiert und auf die Uhr gesynct wird.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Workout, PaceZones } from '../models/types';
import { encodeFitWorkout, WorkoutStepDef } from './fitEncoder';

// === Pace/Speed Conversion ===
// Garmin FIT speed: m/s * 1000 (integer)
// Our pace: sec/km

function paceToSpeed1000(paceSecPerKm: number): number {
  if (paceSecPerKm <= 0) return 0;
  // pace (sec/km) → speed (m/s) = 1000 / pace
  return Math.round((1000 / paceSecPerKm) * 1000);
}

// === FIT Duration/Target Constants ===
const DURATION_TIME = 0;
const DURATION_DISTANCE = 1;
const DURATION_OPEN = 5;

const TARGET_SPEED = 0;
const TARGET_OPEN = 2;

const INTENSITY_ACTIVE = 0;
const INTENSITY_REST = 1;
const INTENSITY_WARMUP = 2;
const INTENSITY_COOLDOWN = 3;

// === Segment to Steps Conversion ===

function convertWorkoutToSteps(workout: Workout, paceZones: PaceZones): WorkoutStepDef[] {
  const steps: WorkoutStepDef[] = [];

  for (const segment of workout.segments) {
    const zone = paceZones[segment.paceZone];
    // Note: speed_low = slower speed (higher pace number = zone.max)
    // speed_high = faster speed (lower pace number = zone.min)
    const speedLow = paceToSpeed1000(zone.max);
    const speedHigh = paceToSpeed1000(zone.min);

    switch (segment.type) {
      case 'warmup': {
        steps.push({
          name: 'Warm-up',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED,
          targetValue: 0,
          speedLow,
          speedHigh,
          intensity: INTENSITY_WARMUP,
        });
        break;
      }

      case 'cooldown': {
        steps.push({
          name: 'Cool-down',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED,
          targetValue: 0,
          speedLow,
          speedHigh,
          intensity: INTENSITY_COOLDOWN,
        });
        break;
      }

      case 'interval': {
        if (segment.repeats && segment.repeats > 1 && segment.distanceKm) {
          // Expand intervals into individual Run + Rest steps (no repeat step)
          const singleDistanceKm = segment.distanceKm / segment.repeats;
          const restDurationMs = parseRestDuration(segment.description);

          for (let r = 0; r < segment.repeats; r++) {
            // Run step
            steps.push({
              name: `${formatIntervalName(singleDistanceKm)} ${r + 1}/${segment.repeats}`,
              durationType: DURATION_DISTANCE,
              durationValue: Math.round(singleDistanceKm * 100000),
              targetType: TARGET_SPEED,
              targetValue: 0,
              speedLow,
              speedHigh,
              intensity: INTENSITY_ACTIVE,
            });

            // Rest step (skip after last rep)
            if (r < segment.repeats - 1) {
              steps.push({
                name: 'Erholung',
                durationType: DURATION_TIME,
                durationValue: restDurationMs,
                targetType: TARGET_OPEN,
                targetValue: 0,
                speedLow: 0,
                speedHigh: 0,
                intensity: INTENSITY_REST,
              });
            }
          }
        } else {
          // Simple interval without repeats
          steps.push({
            name: segment.paceZone === 'tempo' ? 'Tempo' : 'Intervall',
            durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
            durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
            targetType: TARGET_SPEED,
            targetValue: 0,
            speedLow,
            speedHigh,
            intensity: INTENSITY_ACTIVE,
          });
        }
        break;
      }

      case 'main': {
        // Map pace zone to a readable name
        const nameMap: Record<string, string> = {
          easy: 'Easy',
          recovery: 'Recovery',
          marathon: 'Marathon Pace',
          tempo: 'Threshold',
          interval: 'VO2max',
          repetition: 'Speed',
        };

        steps.push({
          name: nameMap[segment.paceZone] || 'Laufen',
          durationType: segment.distanceKm ? DURATION_DISTANCE : DURATION_OPEN,
          durationValue: segment.distanceKm ? Math.round(segment.distanceKm * 100000) : 0,
          targetType: TARGET_SPEED,
          targetValue: 0,
          speedLow,
          speedHigh,
          intensity: INTENSITY_ACTIVE,
        });
        break;
      }

      case 'rest': {
        steps.push({
          name: 'Pause',
          durationType: segment.durationMin
            ? DURATION_TIME
            : DURATION_OPEN,
          durationValue: segment.durationMin
            ? Math.round(segment.durationMin * 60 * 1000)
            : 0,
          targetType: TARGET_OPEN,
          targetValue: 0,
          speedLow: 0,
          speedHigh: 0,
          intensity: INTENSITY_REST,
        });
        break;
      }
    }
  }

  return steps;
}

// Parse rest duration from description like "3 min Trabpause" or "60s Trabpause"
function parseRestDuration(description: string): number {
  const minMatch = description.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60 * 1000;

  const secMatch = description.match(/(\d+)\s*s(?:ek|ec)?/i);
  if (secMatch) return parseInt(secMatch[1]) * 1000;

  // Default: 2 minutes
  return 2 * 60 * 1000;
}

function formatIntervalName(distanceKm: number): string {
  if (distanceKm >= 1) return `${distanceKm.toFixed(1)}km`;
  return `${Math.round(distanceKm * 1000)}m`;
}

// === Public API ===

/**
 * Exportiert ein Workout als .FIT Datei und oeffnet das System Share-Sheet.
 * Der User kann die Datei dann an Garmin Connect senden.
 */
export async function exportWorkoutToGarmin(
  workout: Workout,
  paceZones: PaceZones,
): Promise<void> {
  // 1. Convert to FIT workout steps
  const steps = convertWorkoutToSteps(workout, paceZones);

  // 2. Create a clean workout name (ASCII only, max 24 chars)
  const cleanName = workout.title
    .replace(/[^\w\s\-–.]/g, '')
    .substring(0, 24)
    .trim();

  // 3. Encode to .FIT binary
  const fitData = encodeFitWorkout(cleanName, steps);

  // 4. Write to temp file using new expo-file-system API (SDK 54)
  const fileName = `workout_w${workout.weekNumber}_${workout.type}.fit`;
  const file = new File(Paths.cache, fileName);

  // Create (overwrite if exists) and write binary data directly
  file.create({ overwrite: true });
  file.write(fitData);

  // 5. Share via system share sheet
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing ist auf diesem Geraet nicht verfuegbar.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.ant.fit',
    dialogTitle: 'Workout an Garmin senden',
    UTI: 'com.garmin.fit',
  });
}
