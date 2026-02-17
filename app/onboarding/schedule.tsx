import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput,
  ScrollView, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingStore } from '../../src/store/useTrainingStore';
import { UserProfile, RunLevel } from '../../src/models/types';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/fonts';

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function ScheduleScreen() {
  const { level, fitnessTime, fitnessDistance } = useLocalSearchParams<{
    level: string;
    fitnessTime: string;
    fitnessDistance: string;
  }>();

  const generatePlan = useTrainingStore((s) => s.generatePlan);

  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 6]); // Di, Do, So
  const [weeklyKm, setWeeklyKm] = useState('25');
  const [goalHours, setGoalHours] = useState('3');
  const [goalMinutes, setGoalMinutes] = useState('45');

  // Marathon Prag: 3. Mai 2026
  const marathonDate = '2026-05-03';

  const runsPerWeek = selectedDays.length as 3 | 4 | 5;
  const isValid = selectedDays.length >= 3 && selectedDays.length <= 5 && parseInt(weeklyKm) > 0;

  const toggleDay = (index: number) => {
    if (selectedDays.includes(index)) {
      if (selectedDays.length > 3) {
        setSelectedDays(selectedDays.filter((d) => d !== index));
      }
    } else {
      if (selectedDays.length < 5) {
        setSelectedDays([...selectedDays, index].sort());
      }
    }
  };

  const handleGenerate = () => {
    Keyboard.dismiss();
    const goalTimeMin = parseInt(goalHours) * 60 + parseInt(goalMinutes || '0');

    const profile: UserProfile = {
      level: (level as RunLevel) || 'intermediate',
      marathonDate,
      goalTime: goalTimeMin,
      currentFitness: parseFloat(fitnessTime),
      fitnessDistanceKm: parseFloat(fitnessDistance),
      runsPerWeek: Math.min(5, Math.max(3, selectedDays.length)) as 3 | 4 | 5,
      runDays: selectedDays,
      weeklyKmBase: parseInt(weeklyKm),
      height: 184,
      weight: 82,
    };

    try {
      generatePlan(profile);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Fehler', 'Trainingsplan konnte nicht erstellt werden.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.step}>Schritt 3 von 4</Text>
            <Text style={styles.title}>Dein Zeitplan</Text>

            <Text style={styles.sectionTitle}>Marathon</Text>
            <View style={styles.marathonInfo}>
              <Text style={styles.marathonText}><Ionicons name="flag" size={18} color={Colors.accentLight} /> Prague Marathon</Text>
              <Text style={styles.marathonDate}>3. Mai 2026</Text>
            </View>

            <Text style={styles.sectionTitle}>Zielzeit</Text>
            <View style={styles.goalRow}>
              <View style={styles.goalInputWrapper}>
                <TextInput
                  style={styles.goalInput}
                  value={goalHours}
                  onChangeText={setGoalHours}
                  keyboardType="number-pad"
                  maxLength={1}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.goalLabel}>Std</Text>
              </View>
              <Text style={styles.goalSep}>:</Text>
              <View style={styles.goalInputWrapper}>
                <TextInput
                  style={styles.goalInput}
                  value={goalMinutes}
                  onChangeText={setGoalMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.goalLabel}>Min</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Aktuelle Wochenkilometer</Text>
            <View style={styles.kmRow}>
              <TextInput
                style={styles.kmInput}
                value={weeklyKm}
                onChangeText={setWeeklyKm}
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.kmLabel}>km / Woche</Text>
            </View>

            <Text style={styles.sectionTitle}>Lauftage ({selectedDays.length} von 3-5)</Text>
            <View style={styles.daysRow}>
              {weekDays.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayBtn, selectedDays.includes(i) && styles.selectedDayBtn]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayBtnText, selectedDays.includes(i) && styles.selectedDayText]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Dein Plan</Text>
              <Text style={styles.summaryItem}>Level: {level === 'beginner' ? 'Anfaenger' : level === 'advanced' ? 'Erfahren' : 'Fortgeschritten'}</Text>
              <Text style={styles.summaryItem}>Laeufe/Woche: {selectedDays.length}</Text>
              <Text style={styles.summaryItem}>Basis: {weeklyKm} km/Woche</Text>
              <Text style={styles.summaryItem}>Zielzeit: {goalHours}:{(goalMinutes || '00').padStart(2, '0')}h</Text>
            </View>

            <TouchableOpacity
              style={[!isValid && styles.disabledButton, {marginTop: 24}]}
              onPress={handleGenerate}
              disabled={!isValid}
              activeOpacity={0.85}
            >
              {isValid ? (
                <LinearGradient
                  colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.generateButton}
                >
                  <Text style={styles.generateButtonText}>Trainingsplan generieren</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.generateButton, styles.disabledButton]}>
                  <Text style={styles.generateButtonText}>Trainingsplan generieren</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, paddingTop: 20 },
  step: { fontSize: 13, color: Colors.accent, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: Fonts.displayBold, color: Colors.textPrimary, marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 10, marginTop: 20 },
  marathonInfo: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  marathonText: { fontSize: 17, fontFamily: Fonts.displayBold, color: Colors.accentLight, marginBottom: 4 },
  marathonDate: { fontSize: 14, color: Colors.textSecondary },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  goalInputWrapper: { alignItems: 'center' },
  goalInput: {
    backgroundColor: Colors.backgroundInput,
    width: 70,
    height: 50,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Fonts.monoBold,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  goalLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  goalSep: { fontSize: 24, fontWeight: '700', color: Colors.textSecondary, marginBottom: 16 },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kmInput: {
    backgroundColor: Colors.backgroundInput,
    width: 80,
    height: 50,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Fonts.monoBold,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  kmLabel: { fontSize: 15, color: Colors.textSecondary },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  selectedDayBtn: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  dayBtnText: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary },
  selectedDayText: { color: Colors.accentLight },
  summaryCard: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  summaryTitle: { fontSize: 15, fontFamily: Fonts.displaySemiBold, color: Colors.accentLight, marginBottom: 8 },
  summaryItem: { fontSize: 14, fontFamily: Fonts.bodyRegular, color: Colors.textSecondary, marginBottom: 4 },
  generateButton: {
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.button,
  },
  disabledButton: {
    backgroundColor: Colors.progressTrack,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: { color: Colors.textOnAccent, fontSize: 17, fontFamily: Fonts.displayBold },
});
