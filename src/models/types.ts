export type RunLevel = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutType =
  | 'easy'
  | 'long'
  | 'long_mp'        // Long Run mit Marathon-Pace-Anteil (Pfitzinger)
  | 'medium_long'    // Medium-Long Run (Pfitzinger)
  | 'tempo'
  | 'intervals'
  | 'repetition'     // Repetition pace (Daniels R-pace)
  | 'recovery'
  | 'race_pace'
  | 'progression'    // Progression Run (starts easy, finishes tempo)
  | 'rest';

export type TrainingPhase = 'base' | 'build' | 'peak' | 'taper';

export interface UserProfile {
  level: RunLevel;
  marathonDate: string;
  goalTime: number;              // Zielzeit in Minuten
  currentFitness: number;        // Letzte Bestzeit in Minuten
  fitnessDistanceKm: number;     // Distanz des Fitness-Tests (5, 10, 21.1)
  runsPerWeek: 3 | 4 | 5;
  runDays: number[];             // 0=Mo ... 6=So
  weeklyKmBase: number;          // Aktuelle Wochenkilometer
  height?: number;
  weight?: number;
}

export interface PaceZones {
  recovery: { min: number; max: number };   // sec/km
  easy: { min: number; max: number };
  marathon: { min: number; max: number };
  tempo: { min: number; max: number };       // Threshold (T-pace)
  interval: { min: number; max: number };    // VO2max (I-pace)
  repetition: { min: number; max: number };  // Speed (R-pace, Daniels)
}

export interface WorkoutSegment {
  type: 'warmup' | 'main' | 'cooldown' | 'interval' | 'rest';
  durationMin?: number;
  distanceKm?: number;
  paceZone: keyof PaceZones;
  repeats?: number;
  description: string;
}

export interface Workout {
  id: string;
  weekNumber: number;
  dayOfWeek: number;
  date: string;
  type: WorkoutType;
  phase: TrainingPhase;
  title: string;
  description: string;
  totalDistanceKm: number;
  estimatedDurationMin: number;
  segments: WorkoutSegment[];
  completed: boolean;
  actualDistanceKm?: number;
  actualDurationMin?: number;
  actualPaceSecPerKm?: number;
  feeling?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  phase: TrainingPhase;
  totalDistanceKm: number;
  workouts: Workout[];
  isDeloadWeek: boolean;
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  userProfile: UserProfile;
  paceZones: PaceZones;
  vdot: number;                  // Berechneter VDOT-Wert
  weeks: TrainingWeek[];
  totalWeeks: number;
}

export interface WeeklyStats {
  weekNumber: number;
  plannedKm: number;
  actualKm: number;
  completedWorkouts: number;
  totalWorkouts: number;
  avgPaceSecPerKm: number;
  avgFeeling: number;
}
