/**
 * Konvertiert Marathon Trainer Workouts in das Garmin Connect JSON Format.
 *
 * Das JSON wird via WebView an die Garmin Connect REST API gesendet:
 * POST /modern/proxy/workout-service/workout
 */

import { Workout, WorkoutSegment, PaceZones } from '../models/types';

// === Garmin JSON Types ===

interface GarminSportType {
  sportTypeId: number;
  sportTypeKey: string;
}

interface GarminStepType {
  stepTypeId: number;
  stepTypeKey: string;
}

interface GarminEndCondition {
  conditionTypeId: number;
  conditionTypeKey: string;
}

interface GarminTargetType {
  workoutTargetTypeId: number;
  workoutTargetTypeKey: string;
}

interface GarminPreferredUnit {
  unitKey: string;
}

interface ExecutableStepDTO {
  type: 'ExecutableStepDTO';
  stepId: null;
  stepOrder: number;
  childStepId: null;
  description: string | null;
  stepType: GarminStepType;
  endCondition: GarminEndCondition;
  preferredEndConditionUnit: GarminPreferredUnit | null;
  endConditionValue: number | null;
  targetType: GarminTargetType;
  targetValueOne: number | null;
  targetValueTwo: number | null;
  zoneNumber: null;
}

interface RepeatGroupDTO {
  type: 'RepeatGroupDTO';
  stepId: null;
  stepOrder: number;
  stepType: GarminStepType;
  numberOfIterations: number;
  smartRepeat: false;
  childStepId: null;
  workoutSteps: ExecutableStepDTO[];
}

type GarminWorkoutStep = ExecutableStepDTO | RepeatGroupDTO;

interface GarminWorkoutSegment {
  segmentOrder: number;
  sportType: GarminSportType;
  workoutSteps: GarminWorkoutStep[];
}

export interface GarminWorkoutJson {
  workoutId: null;
  ownerId: null;
  workoutName: string;
  description: string | null;
  sportType: GarminSportType;
  workoutSegments: GarminWorkoutSegment[];
}

// === Constants ===

const SPORT_RUNNING: GarminSportType = { sportTypeId: 1, sportTypeKey: 'running' };

const STEP_TYPE = {
  warmup: { stepTypeId: 1, stepTypeKey: 'warmup' } as GarminStepType,
  cooldown: { stepTypeId: 2, stepTypeKey: 'cooldown' } as GarminStepType,
  interval: { stepTypeId: 3, stepTypeKey: 'interval' } as GarminStepType,
  recovery: { stepTypeId: 4, stepTypeKey: 'recovery' } as GarminStepType,
  rest: { stepTypeId: 5, stepTypeKey: 'rest' } as GarminStepType,
  repeat: { stepTypeId: 6, stepTypeKey: 'repeat' } as GarminStepType,
};

const END_CONDITION = {
  lapButton: { conditionTypeId: 1, conditionTypeKey: 'lap.button' } as GarminEndCondition,
  time: { conditionTypeId: 2, conditionTypeKey: 'time' } as GarminEndCondition,
  distance: { conditionTypeId: 3, conditionTypeKey: 'distance' } as GarminEndCondition,
  iterations: { conditionTypeId: 7, conditionTypeKey: 'iterations' } as GarminEndCondition,
};

const TARGET_TYPE = {
  noTarget: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' } as GarminTargetType,
  pace: { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' } as GarminTargetType,
};

// === Conversion ===

function paceToMps(paceSecPerKm: number): number {
  if (paceSecPerKm <= 0) return 0;
  return 1000 / paceSecPerKm;
}

function buildExecutableStep(
  stepOrder: number,
  stepType: GarminStepType,
  segment: WorkoutSegment,
  paceZones: PaceZones,
  description: string | null,
): ExecutableStepDTO {
  const zone = paceZones[segment.paceZone];
  // targetValueOne = slower speed (from zone.max = higher pace number)
  // targetValueTwo = faster speed (from zone.min = lower pace number)
  const speedLow = paceToMps(zone.max);
  const speedHigh = paceToMps(zone.min);

  let endCondition: GarminEndCondition;
  let endConditionValue: number | null;
  let preferredUnit: GarminPreferredUnit | null = null;

  if (segment.distanceKm) {
    endCondition = END_CONDITION.distance;
    endConditionValue = Math.round(segment.distanceKm * 1000); // meters
    preferredUnit = { unitKey: 'meter' };
  } else if (segment.durationMin) {
    endCondition = END_CONDITION.time;
    endConditionValue = Math.round(segment.durationMin * 60); // seconds
    preferredUnit = { unitKey: 'second' };
  } else {
    endCondition = END_CONDITION.lapButton;
    endConditionValue = null;
  }

  return {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder,
    childStepId: null,
    description,
    stepType,
    endCondition,
    preferredEndConditionUnit: preferredUnit,
    endConditionValue,
    targetType: TARGET_TYPE.pace,
    targetValueOne: speedLow,
    targetValueTwo: speedHigh,
    zoneNumber: null,
  };
}

function buildRestStep(
  stepOrder: number,
  stepType: GarminStepType,
  durationSec: number | null,
  description: string | null,
): ExecutableStepDTO {
  return {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder,
    childStepId: null,
    description,
    stepType,
    endCondition: durationSec ? END_CONDITION.time : END_CONDITION.lapButton,
    preferredEndConditionUnit: durationSec ? { unitKey: 'second' } : null,
    endConditionValue: durationSec,
    targetType: TARGET_TYPE.noTarget,
    targetValueOne: null,
    targetValueTwo: null,
    zoneNumber: null,
  };
}

function parseRestDuration(description: string): number {
  const minMatch = description.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;

  const secMatch = description.match(/(\d+)\s*s(?:ek|ec)?/i);
  if (secMatch) return parseInt(secMatch[1]);

  return 120; // Default: 2 minutes
}

// === Main Export ===

export function convertWorkoutToGarminJson(
  workout: Workout,
  paceZones: PaceZones,
): GarminWorkoutJson {
  const steps: GarminWorkoutStep[] = [];
  let stepOrder = 1;

  for (const segment of workout.segments) {
    switch (segment.type) {
      case 'warmup': {
        steps.push(buildExecutableStep(stepOrder++, STEP_TYPE.warmup, segment, paceZones, 'Warm-up'));
        break;
      }

      case 'cooldown': {
        steps.push(buildExecutableStep(stepOrder++, STEP_TYPE.cooldown, segment, paceZones, 'Cool-down'));
        break;
      }

      case 'main': {
        const nameMap: Record<string, string> = {
          easy: 'Easy', recovery: 'Recovery', marathon: 'Marathon Pace',
          tempo: 'Threshold', interval: 'VO2max', repetition: 'Speed',
        };
        steps.push(buildExecutableStep(
          stepOrder++, STEP_TYPE.interval, segment, paceZones,
          nameMap[segment.paceZone] || 'Run',
        ));
        break;
      }

      case 'interval': {
        if (segment.repeats && segment.repeats > 1 && segment.distanceKm) {
          const singleDistanceKm = segment.distanceKm / segment.repeats;
          const restDurationSec = parseRestDuration(segment.description);
          const zone = paceZones[segment.paceZone];

          const intervalStep: ExecutableStepDTO = {
            type: 'ExecutableStepDTO',
            stepId: null,
            stepOrder: 1,
            childStepId: null,
            description: `${singleDistanceKm >= 1 ? singleDistanceKm.toFixed(1) + 'km' : Math.round(singleDistanceKm * 1000) + 'm'}`,
            stepType: STEP_TYPE.interval,
            endCondition: END_CONDITION.distance,
            preferredEndConditionUnit: { unitKey: 'meter' },
            endConditionValue: Math.round(singleDistanceKm * 1000),
            targetType: TARGET_TYPE.pace,
            targetValueOne: paceToMps(zone.max),
            targetValueTwo: paceToMps(zone.min),
            zoneNumber: null,
          };

          const recoveryStep = buildRestStep(2, STEP_TYPE.recovery, restDurationSec, 'Erholung');

          const repeatGroup: RepeatGroupDTO = {
            type: 'RepeatGroupDTO',
            stepId: null,
            stepOrder: stepOrder++,
            stepType: STEP_TYPE.repeat,
            numberOfIterations: segment.repeats,
            smartRepeat: false,
            childStepId: null,
            workoutSteps: [intervalStep, recoveryStep],
          };

          steps.push(repeatGroup);
        } else {
          steps.push(buildExecutableStep(
            stepOrder++, STEP_TYPE.interval, segment, paceZones,
            segment.paceZone === 'tempo' ? 'Tempo' : 'Intervall',
          ));
        }
        break;
      }

      case 'rest': {
        const durationSec = segment.durationMin ? Math.round(segment.durationMin * 60) : null;
        steps.push(buildRestStep(stepOrder++, STEP_TYPE.rest, durationSec, 'Pause'));
        break;
      }
    }
  }

  const cleanName = workout.title
    .replace(/[^\w\s\-–.]/g, '')
    .substring(0, 50)
    .trim();

  return {
    workoutId: null,
    ownerId: null,
    workoutName: cleanName || `W${workout.weekNumber} ${workout.type}`,
    description: workout.description || null,
    sportType: SPORT_RUNNING,
    workoutSegments: [{
      segmentOrder: 1,
      sportType: SPORT_RUNNING,
      workoutSteps: steps,
    }],
  };
}
