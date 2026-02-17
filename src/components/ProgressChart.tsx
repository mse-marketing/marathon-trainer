import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { TrainingPlan, WeeklyStats } from '../models/types';
import { Colors, Radius } from '../theme/colors';
import { Fonts } from '../theme/fonts';

const screenWidth = Dimensions.get('window').width - 48;

const chartConfig = {
  backgroundColor: Colors.card,
  backgroundGradientFrom: Colors.card,
  backgroundGradientTo: Colors.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple
  labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`, // Gray text
  style: { borderRadius: 12 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#8B5CF6' },
  propsForBackgroundLines: { stroke: '#21262D', strokeDasharray: '4,4' },
  barPercentage: 0.6,
  fillShadowGradient: '#8B5CF6',
  fillShadowGradientOpacity: 0.3,
};

interface ProgressChartProps {
  plan: TrainingPlan;
}

export function WeeklyKmChart({ plan }: ProgressChartProps) {
  const stats = getWeeklyStats(plan);
  const labels = stats.map((s) => `W${s.weekNumber}`);
  const planned = stats.map((s) => s.plannedKm);
  const actual = stats.map((s) => s.actualKm);

  // Show max 8 weeks of labels for readability
  const displayLabels = labels.length > 8
    ? labels.map((l, i) => i % 2 === 0 ? l : '')
    : labels;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Km pro Woche</Text>
      <BarChart
        data={{
          labels: displayLabels,
          datasets: [
            { data: planned, color: (opacity = 1) => `rgba(139, 92, 246, ${opacity * 0.3})` },
            { data: actual.some((v) => v > 0) ? actual : [0], color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})` },
          ],
        }}
        width={screenWidth}
        height={200}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars={false}
        yAxisLabel=""
        yAxisSuffix=" km"
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]} />
          <Text style={styles.legendText}>Geplant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Gelaufen</Text>
        </View>
      </View>
    </View>
  );
}

export function PaceChart({ plan }: ProgressChartProps) {
  const stats = getWeeklyStats(plan).filter((s) => s.avgPaceSecPerKm > 0);

  if (stats.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pace-Entwicklung</Text>
        <Text style={styles.noData}>Mindestens 2 Wochen mit Daten noetig</Text>
      </View>
    );
  }

  const labels = stats.map((s) => `W${s.weekNumber}`);
  const paces = stats.map((s) => Math.round(s.avgPaceSecPerKm / 6) / 10); // convert to min/km

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pace-Entwicklung (min/km)</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: paces }],
        }}
        width={screenWidth}
        height={180}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#F59E0B' },
        }}
        style={styles.chart}
        bezier
        yAxisSuffix=""
        yAxisLabel=""
      />
    </View>
  );
}

export function getWeeklyStats(plan: TrainingPlan): WeeklyStats[] {
  return plan.weeks.map((week) => {
    const completedWorkouts = week.workouts.filter((w) => w.completed);
    const actualKm = completedWorkouts.reduce((sum, w) => sum + (w.actualDistanceKm || w.totalDistanceKm), 0);
    const paces = completedWorkouts
      .filter((w) => w.actualPaceSecPerKm && w.actualPaceSecPerKm > 0)
      .map((w) => w.actualPaceSecPerKm!);
    const feelings = completedWorkouts
      .filter((w) => w.feeling)
      .map((w) => w.feeling!);

    return {
      weekNumber: week.weekNumber,
      plannedKm: week.totalDistanceKm,
      actualKm: Math.round(actualKm * 10) / 10,
      completedWorkouts: completedWorkouts.length,
      totalWorkouts: week.workouts.length,
      avgPaceSecPerKm: paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : 0,
      avgFeeling: feelings.length > 0 ? Math.round((feelings.reduce((a, b) => a + b, 0) / feelings.length) * 10) / 10 : 0,
    };
  });
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontFamily: Fonts.displaySemiBold,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyRegular,
  },
  noData: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    padding: 20,
    fontFamily: Fonts.bodyRegular,
  },
});
