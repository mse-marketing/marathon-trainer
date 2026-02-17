import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrainingWeek } from '../models/types';
import { formatShortWeekday } from '../utils/dateUtils';
import { Colors, Radius } from '../theme/colors';
import { Fonts } from '../theme/fonts';

const phaseLabels: Record<string, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

const phaseEmojis: Record<string, string> = {
  base: 'Foundation',
  build: 'Building',
  peak: 'Peak',
  taper: 'Taper',
};

interface WeekCalendarProps {
  week: TrainingWeek;
  onWorkoutPress?: (workoutId: string) => void;
}

export default function WeekCalendar({ week, onWorkoutPress }: WeekCalendarProps) {
  const daySlots = Array.from({ length: 7 }, (_, i) => {
    const workout = week.workouts.find((w) => w.dayOfWeek === i);
    return { dayIndex: i, workout };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.weekTitle}>Woche {week.weekNumber}</Text>
        <View style={[styles.phaseBadge, { backgroundColor: getPhaseColor(week.phase) + '20' }]}>
          <Text style={[styles.phaseText, { color: getPhaseColor(week.phase) }]}>
            {phaseLabels[week.phase]} {week.isDeloadWeek ? '(Deload)' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.daysRow}>
        {daySlots.map(({ dayIndex, workout }) => (
          <TouchableOpacity
            key={dayIndex}
            style={[
              styles.dayCell,
              workout && styles.activeDayCell,
              workout?.completed && styles.completedDayCell,
            ]}
            onPress={() => workout && onWorkoutPress?.(workout.id)}
            disabled={!workout}
          >
            <Text style={[styles.dayLabel, workout && styles.activeDayLabel]}>
              {formatShortWeekday(dayIndex)}
            </Text>
            {workout ? (
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: workout.completed ? Colors.success : getTypeColor(workout.type) },
                ]}
              />
            ) : (
              <Text style={styles.restDash}>--</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.totalKm}>{week.totalDistanceKm} km geplant</Text>
    </View>
  );
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'base': return Colors.phaseBase;
    case 'build': return Colors.phaseBuild;
    case 'peak': return Colors.phasePeak;
    case 'taper': return Colors.phaseTaper;
    default: return Colors.textTertiary;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'easy': return Colors.workoutEasy;
    case 'long': return Colors.workoutLong;
    case 'tempo': return Colors.workoutTempo;
    case 'intervals': return Colors.workoutIntervals;
    case 'recovery': return Colors.workoutRecovery;
    default: return Colors.textTertiary;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Fonts.displayBold,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodySemiBold,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayCell: {
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.sm,
    minWidth: 38,
  },
  activeDayCell: {
    backgroundColor: Colors.backgroundTertiary,
  },
  completedDayCell: {
    backgroundColor: Colors.successMuted,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 4,
    fontFamily: Fonts.bodySemiBold,
  },
  activeDayLabel: {
    color: Colors.textPrimary,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  restDash: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  totalKm: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
