import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../models/types';
import { formatPaceRange, formatDuration } from '../utils/formatPace';
import { getRelativeDay } from '../utils/dateUtils';
import { useTrainingStore } from '../store/useTrainingStore';
import { Colors, Radius } from '../theme/colors';
import { Fonts } from '../theme/fonts';
import { usePressAnimation } from '../hooks/useAnimations';

const typeColors: Record<string, string> = {
  easy: Colors.workoutEasy,
  long: Colors.workoutLong,
  tempo: Colors.workoutTempo,
  intervals: Colors.workoutIntervals,
  recovery: Colors.workoutRecovery,
  race_pace: Colors.workoutRacePace,
  rest: Colors.workoutRest,
  long_mp: Colors.workoutLongMp,
  medium_long: Colors.workoutMediumLong,
  repetition: Colors.workoutRepetition,
  progression: Colors.workoutProgression,
};

const typeLabels: Record<string, string> = {
  easy: 'Easy Run',
  long: 'Long Run',
  tempo: 'Tempo',
  intervals: 'Intervalle',
  recovery: 'Recovery',
  race_pace: 'Race Pace',
  rest: 'Ruhetag',
  long_mp: 'MP Long Run',
  medium_long: 'Medium Long',
  repetition: 'Repetitions',
  progression: 'Progression',
};

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
  compact?: boolean;
}

export default function WorkoutCard({ workout, onPress, compact = false }: WorkoutCardProps) {
  const plan = useTrainingStore((s) => s.plan);
  const color = typeColors[workout.type] || '#666';
  const { scale, onPressIn, onPressOut } = usePressAnimation();

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.compactCard, { borderLeftColor: color }]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <View style={styles.compactRow}>
            <Text style={[styles.compactType, { color }]}>{typeLabels[workout.type]}</Text>
            {workout.completed && <Ionicons name="checkmark-circle" size={14} color={Colors.success} />}
          </View>
          <Text style={styles.compactTitle}>{workout.totalDistanceKm} km</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeText, { color }]}>{typeLabels[workout.type]}</Text>
          </View>
          {workout.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Erledigt</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{workout.description}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{workout.totalDistanceKm.toFixed(1)} km</Text>
          <Text style={styles.statDivider}>|</Text>
          <Text style={styles.stat}>~{formatDuration(workout.estimatedDurationMin)}</Text>
          {plan && (
            <>
              <Text style={styles.statDivider}>|</Text>
              <Text style={styles.stat}>
                {formatPaceRange(
                  plan.paceZones[workout.segments[0]?.paceZone || 'easy'].min,
                  plan.paceZones[workout.segments[0]?.paceZone || 'easy'].max
                )}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: Fonts.bodySemiBold,
  },
  completedBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.displayBold,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: Fonts.bodyRegular,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Fonts.monoRegular,
  },
  statDivider: {
    marginHorizontal: 8,
    color: Colors.textTertiary,
  },
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 10,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactType: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
  },
  compactTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.monoRegular,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
});
