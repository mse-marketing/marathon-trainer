import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingStore } from '../../src/store/useTrainingStore';
import { getDaysUntil } from '../../src/utils/dateUtils';
import WorkoutCard from '../../src/components/WorkoutCard';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts, Typography } from '../../src/theme/fonts';
import { useFadeIn } from '../../src/hooks/useAnimations';

const phaseLabels: Record<string, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

export default function DashboardScreen() {
  const plan = useTrainingStore((s) => s.plan);
  const getCurrentWeek = useTrainingStore((s) => s.getCurrentWeek);
  const getTodayWorkout = useTrainingStore((s) => s.getTodayWorkout);

  const countdownAnim = useFadeIn(0);
  const workoutAnim = useFadeIn(100);
  const weekAnim = useFadeIn(200);
  const streakAnim = useFadeIn(300);

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kein Trainingsplan vorhanden</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.replace('/onboarding')}
          >
            <Text style={styles.createButtonText}>Plan erstellen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeek = getCurrentWeek();
  const todayWorkout = getTodayWorkout();
  const daysUntilRace = getDaysUntil(plan.userProfile.marathonDate);
  const progress = Math.round((currentWeek / plan.totalWeeks) * 100);
  const currentWeekData = plan.weeks[currentWeek - 1];

  const completedThisWeek = currentWeekData?.workouts.filter((w) => w.completed).length || 0;
  const totalThisWeek = currentWeekData?.workouts.length || 0;
  const kmThisWeek = currentWeekData?.workouts
    .filter((w) => w.completed)
    .reduce((sum, w) => sum + (w.actualDistanceKm || w.totalDistanceKm), 0) || 0;
  const kmPlannedThisWeek = currentWeekData?.totalDistanceKm || 0;

  const allWorkouts = plan.weeks.flatMap((w) => w.workouts).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  for (const w of allWorkouts) {
    if (w.completed) streak++;
    else if (new Date(w.date) < new Date()) break;
  }

  const countAnim = React.useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = React.useState(0);

  React.useEffect(() => {
    const listener = countAnim.addListener(({ value }) => setDisplayCount(Math.round(value)));
    Animated.timing(countAnim, {
      toValue: daysUntilRace,
      duration: 1500,
      useNativeDriver: false,
    }).start();
    return () => countAnim.removeListener(listener);
  }, [daysUntilRace]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Countdown */}
        <Animated.View style={countdownAnim}>
          <LinearGradient
            colors={['#1A0D2E', Colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.countdownCard}
          >
            <Text style={styles.countdownDays}>{displayCount}</Text>
            <Text style={styles.countdownLabel}>TAGE BIS ZUM MARATHON</Text>
            <View style={styles.progressBarOuter}>
              <LinearGradient
                colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarInner, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{progress}% des Plans absolviert</Text>
          </LinearGradient>
        </Animated.View>

        {/* Today's Workout */}
        <Animated.View style={workoutAnim}>
          <Text style={styles.sectionTitle}>
            {todayWorkout ? 'Naechstes Workout' : 'Kein Workout heute'}
          </Text>
          {todayWorkout && (
            <WorkoutCard
              workout={todayWorkout}
              onPress={() => router.push(`/workout/${todayWorkout.id}`)}
            />
          )}
        </Animated.View>

        {/* Week Summary */}
        <Animated.View style={weekAnim}>
          <View style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Woche {currentWeek}/{plan.totalWeeks}</Text>
              <View style={styles.phaseBadge}>
                <Text style={styles.phaseText}>
                  {phaseLabels[currentWeekData?.phase || 'base']}
                  {currentWeekData?.isDeloadWeek ? ' (Deload)' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.dotsRow}>
              {currentWeekData?.workouts.map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    w.completed ? styles.dotCompleted : styles.dotPending,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.weekStat}>
              {completedThisWeek}/{totalThisWeek} Laeufe erledigt
            </Text>
            <Text style={styles.weekStat}>
              {kmThisWeek.toFixed(1)}/{kmPlannedThisWeek} km gelaufen
            </Text>
          </View>
        </Animated.View>

        {/* Streak */}
        {streak > 0 && (
          <Animated.View style={streakAnim}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.streakCard}
            >
              <Ionicons name="flame" size={24} color={Colors.warning} />
              <Text style={styles.streakText}>Streak: {streak} Workouts in Folge</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 16, fontFamily: Fonts.bodyRegular },
  createButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.full,
    ...Shadows.button,
  },
  createButtonText: { color: Colors.textOnAccent, fontSize: 15, fontWeight: '700', fontFamily: Fonts.displayBold },

  countdownCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.lg,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    ...Shadows.glow,
  },
  countdownDays: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -2,
    marginBottom: 4,
    fontFamily: Fonts.monoBold,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  progressBarOuter: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarInner: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  progressText: { fontSize: 13, color: Colors.textTertiary, fontFamily: Fonts.bodyRegular },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
    fontFamily: Fonts.displaySemiBold,
  },

  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, fontFamily: Fonts.displayBold },
  phaseBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  phaseText: { fontSize: 12, fontWeight: '700', color: Colors.accentLight, fontFamily: Fonts.bodySemiBold },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dot: { width: 24, height: 24, borderRadius: 12 },
  dotCompleted: { backgroundColor: Colors.success },
  dotPending: { backgroundColor: Colors.progressTrack },
  weekStat: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4, fontFamily: Fonts.bodyRegular },

  streakCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  streakIcon: { fontSize: 24, color: Colors.warning },
  streakText: { fontSize: 15, fontWeight: '600', color: Colors.warning, fontFamily: Fonts.displaySemiBold },
});
