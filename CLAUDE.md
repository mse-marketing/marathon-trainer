# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marathon Trainer is a React Native (Expo SDK 54) app for personalized marathon training. It generates scientific training plans using a Daniels/Pfitzinger hybrid methodology with VDOT-based pace zones and block periodization.

The app is written in German (UI text, descriptions, workout titles).

## Development Commands

```bash
# Start dev server (local)
npx expo start

# Start with tunnel for physical device via Expo Go
npx expo start --tunnel

# Platform-specific
npx expo start --ios
npx expo start --android
npx expo start --web
```

No test runner, linter, or build pipeline is configured.

## Architecture

### Routing (Expo Router v6, file-based)

- `app/_layout.tsx` — Root Stack: conditionally routes to onboarding or tabs
- `app/(tabs)/` — Bottom tabs: Dashboard (`index`), Plan (`plan`), Progress (`progress`)
- `app/onboarding/` — 4-step flow: welcome → level → goal → schedule
- `app/workout/[id].tsx` — Dynamic workout detail screen
- `app/garmin-connect.tsx` — Garmin OAuth modal

### Training Engine (`src/engine/`)

This is the core domain logic — a pipeline that transforms user input into a complete training plan:

1. **paceCalculator.ts** — Jack Daniels VDOT formulas. Calculates VDOT from race performance, derives 6 pace zones (recovery, easy, marathon, tempo, interval, repetition) using Newton-Raphson iteration on VO2 equations.

2. **periodization.ts** — Pfitzinger-style block periodization with 3:1 deload pattern. Phases: Base (40%) → Build (40%) → Peak (2wk) → Taper (2-3wk). Outputs volume multipliers per week.

3. **planGenerator.ts** — Orchestrator. Takes a `UserProfile`, calls pace calculator + periodization, then distributes workouts across weeks. Implements long run progression (8% growth, 10% weekly cap, 30-35km peak), workout distribution per phase, and deload/taper reductions.

4. **workoutFactory.ts** — Builders for each workout type (easy, long, MP long, medium long, tempo, cruise intervals, VO2max intervals, reps, progression, recovery). Each returns structured segments with warmup/main/cooldown and pace zones.

### State Management

- **Zustand store** (`src/store/useTrainingStore.ts`) — Single store with plan state, loading state, onboarding flag. Key actions: `generatePlan()`, `completeWorkout()`, `loadStoredPlan()`, `resetApp()`. Computed selectors: `getCurrentWeek()`, `getTodayWorkout()`, `getWorkoutById()`.
- **AsyncStorage** (`src/store/storage.ts`) — Persistence layer. Keys: `marathon_training_plan`, `marathon_user_profile`, `marathon_onboarding_complete`.

### Type System (`src/models/types.ts`)

All core interfaces live here. Key types: `UserProfile`, `TrainingPlan`, `TrainingWeek`, `Workout`, `WorkoutSegment`, `PaceZones`. `WorkoutType` and `TrainingPhase` are string literal unions used throughout the engine and UI.

### Theme (`src/theme/`)

- **colors.ts** — Dark theme. Background `#0D1117`, accent purple `#8B5CF6`. Each workout type and training phase has a distinct color.
- **fonts.ts** — DM Sans (headings), Outfit (body), Jetbrains Mono (pace/technical values).

### Key Utilities

- `src/utils/formatPace.ts` — Pace range formatting (sec/km → "5:20-5:30")
- `src/utils/dateUtils.ts` — Date calculations for plan scheduling
- `src/utils/garminApi.ts` / `garminExport.ts` / `fitEncoder.ts` — Garmin Connect OAuth, workout export, FIT file encoding
- `src/hooks/useAnimations.ts` — `useFadeIn()`, `useCountUp()`, `usePressAnimation()` animation hooks

## Data Flow

```
UserProfile (onboarding input)
  → paceCalculator.calculatePaceZones() → VDOT + 6 pace zones
  → planGenerator.generateTrainingPlan() → periodized weeks + workouts
  → useTrainingStore.generatePlan() → persisted to AsyncStorage
  → Tabs UI reads from store
  → completeWorkout() records actuals (distance, duration, feeling, notes)
```

## Training Science Reference

The engine implements: Daniels 80/20 rule, VDOT pace zones, Pfitzinger block periodization, 3:1 deload cycles, progressive overload (5-8% weekly), long run cap at 32-35km, marathon-pace segments in build/peak long runs, and Pfitzinger taper curves.
