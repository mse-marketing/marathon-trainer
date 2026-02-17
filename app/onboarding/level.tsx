import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { RunLevel } from '../../src/models/types';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/fonts';

const levels: { key: RunLevel; title: string; description: string; kmRange: string }[] = [
  {
    key: 'beginner',
    title: 'Anfaenger',
    description: 'Ich laufe seit weniger als einem Jahr regelmaessig',
    kmRange: '< 20 km/Woche',
  },
  {
    key: 'intermediate',
    title: 'Fortgeschritten',
    description: 'Ich laufe seit 1-3 Jahren und habe schon Wettkampferfahrung',
    kmRange: '20-40 km/Woche',
  },
  {
    key: 'advanced',
    title: 'Erfahren',
    description: 'Ich laufe seit ueber 3 Jahren und habe Marathon-Erfahrung',
    kmRange: '> 40 km/Woche',
  },
];

export default function LevelScreen() {
  const [selected, setSelected] = useState<RunLevel | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Schritt 1 von 4</Text>
        <Text style={styles.title}>Dein Lauf-Level</Text>
        <Text style={styles.subtitle}>Waehle das Level, das am besten zu dir passt</Text>

        {levels.map((level) => (
          <TouchableOpacity
            key={level.key}
            style={[styles.card, selected === level.key && styles.selectedCard]}
            onPress={() => setSelected(level.key)}
          >
            <Text style={[styles.cardTitle, selected === level.key && styles.selectedText]}>
              {level.title}
            </Text>
            <Text style={[styles.cardDesc, selected === level.key && styles.selectedDesc]}>
              {level.description}
            </Text>
            <Text style={[styles.cardKm, selected === level.key && styles.selectedDesc]}>
              {level.kmRange}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[!selected && styles.disabledButton, {marginTop: 'auto', marginBottom: 20}]}
          onPress={() => {
            if (selected) {
              router.push({ pathname: '/onboarding/goal', params: { level: selected } });
            }
          }}
          disabled={!selected}
          activeOpacity={0.85}
        >
          {selected ? (
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, paddingTop: 20 },
  step: { fontSize: 13, color: Colors.accent, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: Fonts.displayBold, color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: Fonts.bodyRegular, color: Colors.textSecondary, marginBottom: 24 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  selectedCard: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  cardTitle: { fontSize: 18, fontFamily: Fonts.displaySemiBold, color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 14, fontFamily: Fonts.bodyRegular, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  cardKm: { fontSize: 13, fontFamily: Fonts.monoRegular, color: Colors.textTertiary },
  selectedText: { color: Colors.accentLight },
  selectedDesc: { color: Colors.accentLight },
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
