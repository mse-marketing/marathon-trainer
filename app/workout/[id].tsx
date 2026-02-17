import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingStore } from '../../src/store/useTrainingStore';
import { formatPace, formatPaceRange, formatDuration } from '../../src/utils/formatPace';
import { formatDate, formatWeekday } from '../../src/utils/dateUtils';
import { getNutritionTips } from '../../src/utils/nutritionTips';
import { convertWorkoutToGarminJson } from '../../src/utils/garminApi';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts, Typography } from '../../src/theme/fonts';

const segmentColors: Record<string, string> = {
  warmup: '#22C55E',
  main: '#F59E0B',
  cooldown: '#22C55E',
  interval: '#EF4444',
  rest: '#6B7280',
};

const segmentLabels: Record<string, string> = {
  warmup: 'Warm-up',
  main: 'Hauptteil',
  cooldown: 'Cool-down',
  interval: 'Intervall',
  rest: 'Pause',
};

const paceZoneColors: Record<string, string> = {
  recovery: '#A855F7',
  easy: '#22C55E',
  marathon: '#3B82F6',
  tempo: '#F59E0B',
  interval: '#EF4444',
  repetition: '#DC2626',
};

const feelingEmojis = [
  { value: 1 as const, emoji: '\u{1F62B}', label: 'Sehr hart' },
  { value: 2 as const, emoji: '\u{1F615}', label: 'Hart' },
  { value: 3 as const, emoji: '\u{1F610}', label: 'OK' },
  { value: 4 as const, emoji: '\u{1F60A}', label: 'Gut' },
  { value: 5 as const, emoji: '\u{1F525}', label: 'Super' },
];

const tips: Record<string, string> = {
  easy: 'Easy Runs sollten sich wirklich leicht anfuehlen. Du solltest dich problemlos unterhalten koennen.',
  long: 'Fokus auf Zeit auf den Beinen. Ernaehrung nicht vergessen – ab 90 min Kohlenhydrate zufuehren.',
  tempo: 'Der Tempobereich sollte sich "angenehm hart" anfuehlen. Du kannst noch in kurzen Saetzen sprechen.',
  intervals: 'Volle Konzentration auf die Intervalle. Die Trabpause aktiv nutzen, nicht stehen bleiben.',
  recovery: 'Recovery Runs sind aktive Regeneration. Wirklich langsam laufen – Ego zuhause lassen!',
  long_mp: 'MP Long Run nach Pfitzinger: Die Marathon-Pace-Abschnitte simulieren Rennbedingungen. Nicht schneller als MP laufen!',
  medium_long: 'Medium Long Run: Laenger als ein normaler Easy Run, aber kuerzer als dein Long Run. Trainiert die aerobe Kapazitaet.',
  repetition: 'R-Pace nach Daniels: Kurz und schnell mit voller Erholung. Fokus auf saubere Lauftechnik.',
  progression: 'Starte bewusst langsam und steigere dich. Die letzten Kilometer sollten sich wie die Schlussphase eines Marathons anfuehlen.',
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getWorkoutById = useTrainingStore((s) => s.getWorkoutById);
  const completeWorkout = useTrainingStore((s) => s.completeWorkout);
  const plan = useTrainingStore((s) => s.plan);

  const workout = getWorkoutById(id);

  const [showComplete, setShowComplete] = useState(false);
  const [actualKm, setActualKm] = useState('');
  const [actualMin, setActualMin] = useState('');
  const [feeling, setFeeling] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [notes, setNotes] = useState('');

  if (!workout || !plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout nicht gefunden</Text>
      </View>
    );
  }

  const phaseLabels: Record<string, string> = {
    base: 'Base',
    build: 'Build',
    peak: 'Peak',
    taper: 'Taper',
  };

  const handleGarminExport = () => {
    const garminJson = convertWorkoutToGarminJson(workout, plan.paceZones);
    router.push({
      pathname: '/garmin-connect',
      params: { workoutJson: JSON.stringify(garminJson), workoutName: workout.title },
    });
  };

  const handleComplete = () => {
    Keyboard.dismiss();
    completeWorkout(workout.id, {
      actualDistanceKm: actualKm ? parseFloat(actualKm) : undefined,
      actualDurationMin: actualMin ? parseFloat(actualMin) : undefined,
      feeling: feeling || undefined,
      notes: notes || undefined,
    });
    Alert.alert('Erledigt!', 'Workout wurde als erledigt markiert.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.workoutTitle}>{workout.title}</Text>
            <Text style={styles.meta}>
              Woche {workout.weekNumber} · {formatWeekday(workout.date)} · {formatDate(workout.date)}
            </Text>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseText}>Phase: {phaseLabels[workout.phase]}</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{workout.totalDistanceKm.toFixed(1)} km</Text>
              <Text style={styles.quickStatLabel}>Distanz</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>~{formatDuration(workout.estimatedDurationMin)}</Text>
              <Text style={styles.quickStatLabel}>Dauer</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{workout.description}</Text>

          {/* Segments */}
          <Text style={styles.sectionTitle}>Ablauf</Text>
          {workout.segments.map((segment, i) => {
            const paceZone = plan.paceZones[segment.paceZone];
            const color = segmentColors[segment.type] || '#666';

            return (
              <View key={i} style={[styles.segmentCard, { borderLeftColor: color }]}>
                <View style={styles.segmentHeader}>
                  <View style={[styles.segmentDot, { backgroundColor: color }]} />
                  <Text style={[styles.segmentType, { color }]}>{segmentLabels[segment.type]}</Text>
                </View>
                <Text style={styles.segmentDesc}>{segment.description}</Text>
                <Text style={[styles.segmentPace, { color: paceZoneColors[segment.paceZone] || '#666' }]}>
                  {formatPaceRange(paceZone.min, paceZone.max)}
                </Text>
                {segment.distanceKm && (
                  <Text style={styles.segmentDist}>{segment.distanceKm.toFixed(1)} km</Text>
                )}
              </View>
            );
          })}

          {/* Tip */}
          {tips[workout.type] && (
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
              <Text style={styles.tipText}>{tips[workout.type]}</Text>
            </View>
          )}

          {/* Nutrition / Carb Loading */}
          <NutritionSection workoutType={workout.type} distanceKm={workout.totalDistanceKm} />

          {/* Garmin Export */}
          {!workout.completed && (
            <TouchableOpacity
              style={styles.garminButton}
              onPress={handleGarminExport}
              activeOpacity={0.8}
            >
              <Ionicons name="watch-outline" size={18} color={Colors.accent} />
              <Text style={styles.garminButtonText}>An Garmin senden</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Complete Section */}
          {workout.completed ? (
            <View style={styles.completedCard}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success} style={{ marginBottom: 8 }} />
              <Text style={styles.completedTitle}>Erledigt!</Text>
              {workout.actualDistanceKm && (
                <Text style={styles.completedStat}>Distanz: {workout.actualDistanceKm} km</Text>
              )}
              {workout.actualDurationMin && (
                <Text style={styles.completedStat}>Dauer: {formatDuration(workout.actualDurationMin)}</Text>
              )}
              {workout.actualPaceSecPerKm && (
                <Text style={styles.completedStat}>Pace: {formatPace(workout.actualPaceSecPerKm)} /km</Text>
              )}
              {workout.feeling && (
                <Text style={styles.completedStat}>
                  Feeling: {feelingEmojis.find((f) => f.value === workout.feeling)?.emoji}{' '}
                  {feelingEmojis.find((f) => f.value === workout.feeling)?.label}
                </Text>
              )}
              {workout.notes && (
                <Text style={styles.completedStat}>Notizen: {workout.notes}</Text>
              )}
            </View>
          ) : (
            <>
              {!showComplete ? (
                <TouchableOpacity onPress={() => setShowComplete(true)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.completeButton}
                  >
                    <Text style={styles.completeButtonText}>Als erledigt markieren</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.completeForm}>
                  <Text style={styles.sectionTitle}>Workout abschliessen</Text>

                  <Text style={styles.inputLabel}>Tatsaechliche Distanz (km)</Text>
                  <TextInput
                    style={styles.input}
                    value={actualKm}
                    onChangeText={setActualKm}
                    keyboardType="decimal-pad"
                    placeholder={workout.totalDistanceKm.toString()}
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  <Text style={styles.inputLabel}>Tatsaechliche Dauer (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={actualMin}
                    onChangeText={setActualMin}
                    keyboardType="decimal-pad"
                    placeholder={workout.estimatedDurationMin.toString()}
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  <Text style={styles.inputLabel}>Wie hast du dich gefuehlt?</Text>
                  <View style={styles.feelingRow}>
                    {feelingEmojis.map((f) => (
                      <TouchableOpacity
                        key={f.value}
                        style={[styles.feelingBtn, feeling === f.value && styles.selectedFeelingBtn]}
                        onPress={() => setFeeling(f.value)}
                      >
                        <Text style={styles.feelingEmoji}>{f.emoji}</Text>
                        <Text style={styles.feelingLabel}>{f.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Notizen (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Wie war das Training?"
                    placeholderTextColor={Colors.textTertiary}
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  <TouchableOpacity style={styles.submitButton} onPress={handleComplete}>
                    <Text style={styles.submitButtonText}>Erledigt!</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function NutritionSection({ workoutType, distanceKm }: { workoutType: string; distanceKm: number }) {
  const nutrition = getNutritionTips(workoutType as any, distanceKm);
  if (!nutrition) return null;

  return (
    <View style={styles.nutritionCard}>
      <View style={styles.nutritionHeader}>
        <Ionicons name="nutrition-outline" size={20} color="#22C55E" />
        <Text style={styles.nutritionTitle}>{nutrition.title}</Text>
      </View>
      <View style={styles.nutritionTimingBadge}>
        <Ionicons name="time-outline" size={12} color={Colors.accent} />
        <Text style={styles.nutritionTimingText}>{nutrition.timing}</Text>
      </View>

      <Text style={styles.nutritionSubtitle}>Vorbereitung</Text>
      {nutrition.details.map((detail, i) => (
        <View key={i} style={styles.nutritionBullet}>
          <Text style={styles.nutritionBulletDot}>{'\u2022'}</Text>
          <Text style={styles.nutritionBulletText}>{detail}</Text>
        </View>
      ))}

      {nutrition.duringRun && (
        <>
          <Text style={styles.nutritionSubtitle}>Waehrend des Laufs</Text>
          <View style={styles.nutritionHighlight}>
            <Ionicons name="flash-outline" size={14} color="#F59E0B" />
            <Text style={styles.nutritionHighlightText}>{nutrition.duringRun}</Text>
          </View>
        </>
      )}

      {nutrition.afterRun && (
        <>
          <Text style={styles.nutritionSubtitle}>Nach dem Lauf</Text>
          <View style={styles.nutritionHighlight}>
            <Ionicons name="medkit-outline" size={14} color="#22C55E" />
            <Text style={styles.nutritionHighlightText}>{nutrition.afterRun}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  errorContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.textSecondary },

  header: { marginBottom: 16 },
  workoutTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 4, fontFamily: Fonts.displayBold },
  meta: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, fontFamily: Fonts.bodyRegular },
  phaseBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  phaseText: { fontSize: 12, fontWeight: '700', color: Colors.accentLight, fontFamily: Fonts.bodySemiBold },

  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 16,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 20, fontWeight: '700', color: Colors.accent, fontFamily: Fonts.monoBold },
  quickStatLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 2, fontFamily: Fonts.bodySemiBold },
  quickStatDivider: { width: 1, backgroundColor: Colors.divider },

  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20, fontFamily: Fonts.bodyRegular },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, fontFamily: Fonts.displaySemiBold },

  segmentCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.sm,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  segmentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  segmentType: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', fontFamily: Fonts.bodySemiBold },
  segmentDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4, fontFamily: Fonts.bodyRegular },
  segmentPace: { fontSize: 13, fontWeight: '600', fontFamily: Fonts.monoRegular },
  segmentDist: { fontSize: 12, color: Colors.textTertiary, marginTop: 2, fontFamily: Fonts.monoRegular },

  garminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  garminButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Fonts.displaySemiBold,
  },

  tipCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontFamily: Fonts.bodyRegular },

  completedCard: {
    backgroundColor: Colors.successMuted,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Radius.md,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  completedTitle: { fontSize: 18, fontWeight: '700', color: Colors.success, marginBottom: 10, fontFamily: Fonts.displayBold },
  completedStat: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4, fontFamily: Fonts.bodyRegular },

  completeButton: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: 20,
    ...Shadows.button,
  },
  completeButtonText: { color: Colors.textOnAccent, fontSize: 17, fontWeight: '700', fontFamily: Fonts.displayBold },

  completeForm: { marginTop: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 12, fontFamily: Fonts.bodySemiBold },
  input: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    fontFamily: Fonts.bodyRegular,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },

  feelingRow: { flexDirection: 'row', gap: 8 },
  feelingBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  selectedFeelingBtn: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  feelingEmoji: { fontSize: 22, marginBottom: 4 },
  feelingLabel: { fontSize: 10, color: Colors.textTertiary, fontFamily: Fonts.bodySemiBold },

  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: Colors.textOnAccent, fontSize: 17, fontWeight: '700', fontFamily: Fonts.displayBold },

  // Nutrition Section
  nutritionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: '#22C55E40',
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nutritionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22C55E',
    fontFamily: Fonts.displaySemiBold,
    flex: 1,
  },
  nutritionTimingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  nutritionTimingText: {
    fontSize: 11,
    color: Colors.accentLight,
    fontFamily: Fonts.bodySemiBold,
  },
  nutritionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
    fontFamily: Fonts.displaySemiBold,
  },
  nutritionBullet: {
    flexDirection: 'row',
    paddingRight: 16,
    marginBottom: 4,
  },
  nutritionBulletDot: {
    color: '#22C55E',
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  nutritionBulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontFamily: Fonts.bodyRegular,
  },
  nutritionHighlight: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.sm,
    padding: 10,
    gap: 8,
  },
  nutritionHighlightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontFamily: Fonts.bodyRegular,
  },
});
