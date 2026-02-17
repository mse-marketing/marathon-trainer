import { create } from 'zustand';
import { TrainingPlan, UserProfile, Workout } from '../models/types';
import { generateTrainingPlan } from '../engine/planGenerator';
import { savePlan, loadPlan, setOnboardingComplete } from './storage';

interface TrainingState {
  plan: TrainingPlan | null;
  isLoading: boolean;
  onboardingComplete: boolean;

  setPlan: (plan: TrainingPlan) => void;
  generatePlan: (profile: UserProfile) => TrainingPlan;
  loadStoredPlan: () => Promise<void>;
  completeWorkout: (
    workoutId: string,
    data: {
      actualDistanceKm?: number;
      actualDurationMin?: number;
      feeling?: 1 | 2 | 3 | 4 | 5;
      notes?: string;
    }
  ) => void;
  setOnboardingDone: () => void;
  resetApp: () => void;

  // Computed helpers
  getCurrentWeek: () => number;
  getTodayWorkout: () => Workout | null;
  getWorkoutById: (id: string) => Workout | null;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  plan: null,
  isLoading: true,
  onboardingComplete: false,

  setPlan: (plan) => {
    set({ plan });
    savePlan(plan);
  },

  generatePlan: (profile) => {
    const plan = generateTrainingPlan(profile);
    set({ plan, onboardingComplete: true });
    savePlan(plan);
    setOnboardingComplete(true);
    return plan;
  },

  loadStoredPlan: async () => {
    set({ isLoading: true });
    const plan = await loadPlan();
    const { isOnboardingComplete } = await import('./storage');
    const onboardingDone = await isOnboardingComplete();
    set({ plan, onboardingComplete: onboardingDone, isLoading: false });
  },

  completeWorkout: (workoutId, data) => {
    const { plan } = get();
    if (!plan) return;

    const updatedWeeks = plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((workout) =>
        workout.id === workoutId
          ? {
              ...workout,
              completed: true,
              actualDistanceKm: data.actualDistanceKm,
              actualDurationMin: data.actualDurationMin,
              actualPaceSecPerKm:
                data.actualDurationMin && data.actualDistanceKm
                  ? Math.round((data.actualDurationMin * 60) / data.actualDistanceKm)
                  : undefined,
              feeling: data.feeling,
              notes: data.notes,
            }
          : workout
      ),
    }));

    const updatedPlan = { ...plan, weeks: updatedWeeks };
    set({ plan: updatedPlan });
    savePlan(updatedPlan);
  },

  setOnboardingDone: () => {
    set({ onboardingComplete: true });
    setOnboardingComplete(true);
  },

  resetApp: async () => {
    const { clearAll } = await import('./storage');
    await clearAll();
    set({ plan: null, onboardingComplete: false });
  },

  getCurrentWeek: () => {
    const { plan } = get();
    if (!plan) return 1;
    const now = new Date();
    const planStart = new Date(plan.createdAt);
    const diffMs = now.getTime() - planStart.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.min(Math.max(diffWeeks, 1), plan.totalWeeks);
  },

  getTodayWorkout: () => {
    const { plan } = get();
    if (!plan) return null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (const week of plan.weeks) {
      for (const workout of week.workouts) {
        if (workout.date.split('T')[0] === todayStr) {
          return workout;
        }
      }
    }

    // If no workout today, find the next upcoming one
    let closest: Workout | null = null;
    let closestDiff = Infinity;
    for (const week of plan.weeks) {
      for (const workout of week.workouts) {
        const workoutDate = new Date(workout.date);
        const diff = workoutDate.getTime() - today.getTime();
        if (diff > 0 && diff < closestDiff && !workout.completed) {
          closestDiff = diff;
          closest = workout;
        }
      }
    }
    return closest;
  },

  getWorkoutById: (id) => {
    const { plan } = get();
    if (!plan) return null;
    for (const week of plan.weeks) {
      for (const workout of week.workouts) {
        if (workout.id === id) return workout;
      }
    }
    return null;
  },
}));
