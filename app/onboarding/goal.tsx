import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput,
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/fonts';

const distances = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 21.1, label: 'Halbmarathon' },
];

export default function GoalScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const timeInMin = parseInt(minutes || '0') + parseInt(seconds || '0') / 60;
  const isValid = timeInMin > 5;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.step}>Schritt 2 von 4</Text>
            <Text style={styles.title}>Dein Fitness-Level</Text>
            <Text style={styles.subtitle}>Gib deine letzte Bestzeit ein, damit wir deine Pace-Zonen berechnen koennen</Text>

            <Text style={styles.sectionTitle}>Distanz</Text>
            <View style={styles.distanceRow}>
              {distances.map((d) => (
                <TouchableOpacity
                  key={d.km}
                  style={[styles.distanceBtn, selectedDistance === d.km && styles.selectedDistBtn]}
                  onPress={() => setSelectedDistance(d.km)}
                >
                  <Text style={[styles.distanceBtnText, selectedDistance === d.km && styles.selectedDistText]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Deine Bestzeit</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="00"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.timeLabel}>min</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.timeLabel}>sek</Text>
              </View>
            </View>

            {isValid && (
              <View style={styles.pacePreview}>
                <Text style={styles.pacePreviewText}>
                  Pace: {Math.floor(timeInMin / (selectedDistance))}:{Math.round(((timeInMin / selectedDistance) % 1) * 60).toString().padStart(2, '0')} /km
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[!isValid && styles.disabledButton, {marginTop: 'auto', marginBottom: 20}]}
              onPress={() => {
                Keyboard.dismiss();
                if (isValid) {
                  router.push({
                    pathname: '/onboarding/schedule',
                    params: {
                      level,
                      fitnessTime: timeInMin.toString(),
                      fitnessDistance: selectedDistance.toString(),
                    },
                  });
                }
              }}
              disabled={!isValid}
              activeOpacity={0.85}
            >
              {isValid ? (
                <LinearGradient
                  colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>Weiter</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.nextButton, styles.disabledButton]}>
                  <Text style={styles.nextButtonText}>Weiter</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, paddingTop: 20 },
  contentInner: { flexGrow: 1, paddingBottom: 40 },
  step: { fontSize: 13, color: Colors.accent, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: Fonts.displayBold, color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: Fonts.bodyRegular, color: Colors.textSecondary, lineHeight: 22, marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 10, marginTop: 8 },
  distanceRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  distanceBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  selectedDistBtn: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  distanceBtnText: { fontSize: 14, fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary },
  selectedDistText: { color: Colors.accentLight },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  timeInputWrapper: { alignItems: 'center' },
  timeInput: {
    backgroundColor: Colors.backgroundInput,
    width: 80,
    height: 56,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: Fonts.monoBold,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  timeLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  timeSeparator: { fontSize: 28, fontWeight: '700', color: Colors.textSecondary, marginBottom: 16 },
  pacePreview: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  pacePreviewText: { fontSize: 15, fontFamily: Fonts.monoRegular, color: Colors.accentLight },
  nextButton: {
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
  nextButtonText: { color: Colors.textOnAccent, fontSize: 17, fontFamily: Fonts.displayBold },
});
