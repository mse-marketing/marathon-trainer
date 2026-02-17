import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTrainingStore } from '../../src/store/useTrainingStore';
import { WeeklyKmChart, PaceChart } from '../../src/components/ProgressChart';
import StatsOverview from '../../src/components/StatsOverview';
import PaceZoneBar from '../../src/components/PaceZoneBar';
import { Colors, Radius } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/fonts';

export default function ProgressScreen() {
  const plan = useTrainingStore((s) => s.plan);
  const resetApp = useTrainingStore((s) => s.resetApp);

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kein Trainingsplan vorhanden</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleReset = () => {
    Alert.alert(
      'Plan zuruecksetzen?',
      'Alle Daten werden geloescht. Du kannst danach einen neuen Plan erstellen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zuruecksetzen',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Weekly Km Chart */}
        <WeeklyKmChart plan={plan} />

        {/* Pace Chart */}
        <PaceChart plan={plan} />

        {/* Stats Overview */}
        <StatsOverview plan={plan} />

        {/* Pace Zones */}
        <PaceZoneBar paceZones={plan.paceZones} />

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Plan zuruecksetzen</Text>
        </TouchableOpacity>

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
  resetButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  resetButtonText: { fontSize: 15, fontWeight: '600', color: Colors.error, fontFamily: Fonts.bodySemiBold },
});
