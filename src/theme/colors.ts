// === Marathon Trainer Dark Theme ===
// Athletic-Premium Dark Theme inspired by Runna
// Context-specific for scientific marathon training (Daniels/Pfitzinger)

export const Colors = {
  // Core Backgrounds
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#1C2333',
  backgroundInput: '#1C2333',

  // Cards
  card: '#161B22',
  cardElevated: '#1C2333',
  cardBorder: '#2A2F3A',

  // Text Hierarchy
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textOnAccent: '#FFFFFF',

  // Accent (Purple)
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',
  accentMuted: 'rgba(139, 92, 246, 0.15)',
  accentGradientStart: '#8B5CF6',
  accentGradientEnd: '#6366F1',

  // Status
  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.15)',

  // Workout Types
  workoutEasy: '#22C55E',
  workoutLong: '#3B82F6',
  workoutTempo: '#F59E0B',
  workoutIntervals: '#EF4444',
  workoutRecovery: '#A855F7',
  workoutRacePace: '#EC4899',
  workoutRest: '#6B7280',
  workoutLongMp: '#2563EB',
  workoutMediumLong: '#14B8A6',
  workoutRepetition: '#DC2626',
  workoutProgression: '#9333EA',

  // Phases
  phaseBase: '#3B82F6',
  phaseBuild: '#F59E0B',
  phasePeak: '#EF4444',
  phaseTaper: '#22C55E',

  // Pace Zones
  paceRecovery: '#A855F7',
  paceEasy: '#22C55E',
  paceMarathon: '#3B82F6',
  paceTempo: '#F59E0B',
  paceInterval: '#EF4444',
  paceRepetition: '#DC2626',

  // Tab Bar
  tabBarBackground: '#0D1117',
  tabBarBorder: '#1C2333',
  tabBarActive: '#8B5CF6',
  tabBarInactive: '#6E7681',

  // Progress
  progressTrack: '#2A2F3A',
  progressFill: '#8B5CF6',

  // Divider
  divider: '#21262D',

  // Shadows
  shadowPurple: 'rgba(139, 92, 246, 0.3)',
  shadowBlack: 'rgba(0, 0, 0, 0.5)',

  // Gradient Backgrounds
  accentGlow: 'rgba(139, 92, 246, 0.08)',
  backgroundGradientTop: '#1A0D2E',
};

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  button: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
