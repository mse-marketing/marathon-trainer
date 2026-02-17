import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaceZones } from '../models/types';
import { formatPace } from '../utils/formatPace';
import { Colors, Radius } from '../theme/colors';
import { Fonts } from '../theme/fonts';

const zoneConfig = [
  { key: 'recovery' as keyof PaceZones, label: 'Recovery', color: Colors.paceRecovery },
  { key: 'easy' as keyof PaceZones, label: 'Easy', color: Colors.paceEasy },
  { key: 'marathon' as keyof PaceZones, label: 'Marathon', color: Colors.paceMarathon },
  { key: 'tempo' as keyof PaceZones, label: 'Tempo', color: Colors.paceTempo },
  { key: 'interval' as keyof PaceZones, label: 'Intervall', color: Colors.paceInterval },
  { key: 'repetition' as keyof PaceZones, label: 'Repetition (R)', color: Colors.paceRepetition },
];

interface PaceZoneBarProps {
  paceZones: PaceZones;
}

export default function PaceZoneBar({ paceZones }: PaceZoneBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deine Pace-Zonen</Text>
      {zoneConfig.map(({ key, label, color }) => {
        const zone = paceZones[key];
        return (
          <View key={key} style={styles.row}>
            <View style={[styles.colorBar, { backgroundColor: color }]} />
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.pace}>
              {formatPace(zone.min)} - {formatPace(zone.max)} /km
            </Text>
          </View>
        );
      })}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  colorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: Fonts.bodySemiBold,
  },
  pace: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Fonts.monoRegular,
  },
});
