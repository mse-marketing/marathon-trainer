import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useTrainingStore } from '../../src/store/useTrainingStore';
import WeekCalendar from '../../src/components/WeekCalendar';
import WorkoutCard from '../../src/components/WorkoutCard';
import { Colors, Radius } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/fonts';

const phaseColors: Record<string, string> = {
  base: Colors.phaseBase,
  build: Colors.phaseBuild,
  peak: Colors.phasePeak,
  taper: Colors.phaseTaper,
};

export default function PlanScreen() {
  const plan = useTrainingStore((s) => s.plan);
  const getCurrentWeek = useTrainingStore((s) => s.getCurrentWeek);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kein Trainingsplan vorhanden</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeek = getCurrentWeek();
  const activeWeek = selectedWeek ?? currentWeek;
  const weekData = plan.weeks[activeWeek - 1];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Week selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekSelector}
          contentContainerStyle={styles.weekSelectorContent}
        >
          {plan.weeks.map((week) => (
            <TouchableOpacity
              key={week.weekNumber}
              style={[
                styles.weekBtn,
                activeWeek === week.weekNumber && styles.activeWeekBtn,
                { borderBottomColor: phaseColors[week.phase] || Colors.textTertiary },
              ]}
              onPress={() => setSelectedWeek(week.weekNumber)}
            >
              <Text
                style={[
                  styles.weekBtnText,
                  activeWeek === week.weekNumber && styles.activeWeekBtnText,
                ]}
              >
                W{week.weekNumber}
              </Text>
              {week.weekNumber === currentWeek && (
                <View style={styles.currentDot} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Week Calendar */}
        {weekData && (
          <WeekCalendar
            week={weekData}
            onWorkoutPress={(id) => router.push(`/workout/${id}`)}
          />
        )}

        {/* Workouts list */}
        <Text style={styles.sectionTitle}>Workouts in Woche {activeWeek}</Text>
        {weekData?.workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={() => router.push(`/workout/${workout.id}`)}
          />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontFamily: Fonts.bodyRegular },
  weekSelector: { marginBottom: 16, marginHorizontal: -16 },
  weekSelectorContent: { paddingHorizontal: 16, gap: 4 },
  weekBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomWidth: 3,
    minWidth: 48,
    alignItems: 'center',
  },
  activeWeekBtn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  weekBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary, fontFamily: Fonts.bodySemiBold },
  activeWeekBtnText: { color: Colors.textOnAccent, fontFamily: Fonts.bodySemiBold },
  currentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Fonts.displaySemiBold,
  },
});
