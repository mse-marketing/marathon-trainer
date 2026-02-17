import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingPlan } from '../models/types';
import { getWeeklyStats } from './ProgressChart';
import { formatPace, formatDuration } from '../utils/formatPace';
import { Colors, Radius } from '../theme/colors';
import { Fonts } from '../theme/fonts';

interface StatsOverviewProps {
  plan: TrainingPlan;
}

export default function StatsOverview({ plan }: StatsOverviewProps) {
  const stats = getWeeklyStats(plan);

  const totalPlannedKm = stats.reduce((s, w) => s + w.plannedKm, 0);
  const totalActualKm = stats.reduce((s, w) => s + w.actualKm, 0);
  const totalCompleted = stats.reduce((s, w) => s + w.completedWorkouts, 0);
  const totalWorkouts = stats.reduce((s, w) => s + w.totalWorkouts, 0);
  const completionRate = totalWorkouts > 0 ? Math.round((totalCompleted / totalWorkouts) * 100) : 0;

  const allCompletedWorkouts = plan.weeks
    .flatMap((w) => w.workouts)
    .filter((w) => w.completed);

  const totalDurationMin = allCompletedWorkouts.reduce(
    (s, w) => s + (w.actualDurationMin || w.estimatedDurationMin),
    0
  );

  const feelings = allCompletedWorkouts.filter((w) => w.feeling).map((w) => w.feeling!);
  const avgFeeling = feelings.length > 0
    ? Math.round((feelings.reduce((a, b) => a + b, 0) / feelings.length) * 10) / 10
    : 0;

  const paces = allCompletedWorkouts
    .filter((w) => w.actualPaceSecPerKm && w.actualPaceSecPerKm > 0)
    .map((w) => w.actualPaceSecPerKm!);
  const avgPace = paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gesamt-Statistiken</Text>
      <View style={styles.grid}>
        <StatCard icon="running" label="Gelaufen" value={`${totalActualKm.toFixed(1)} km`} />
        <StatCard icon="time" label="Trainingszeit" value={formatDuration(totalDurationMin)} />
        <StatCard icon="check" label="Completion" value={`${completionRate}%`} />
        <StatCard icon="smile" label="Avg Feeling" value={avgFeeling > 0 ? `${avgFeeling}/5` : '--'} />
      </View>
      {avgPace > 0 && (
        <Text style={styles.avgPace}>Durchschnittspace: {formatPace(avgPace)} /km</Text>
      )}
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    running: 'walk-outline',
    time: 'time-outline',
    check: 'checkmark-done-outline',
    smile: 'happy-outline',
  };

  return (
    <View style={styles.statCard}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconMap[icon] || 'help-outline'} size={14} color={Colors.accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: 16,
    marginVertical: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontFamily: Fonts.displaySemiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.sm,
    padding: 14,
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
    fontFamily: Fonts.monoBold,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontFamily: Fonts.bodySemiBold,
  },
  avgPace: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Fonts.monoRegular,
  },
});
