/**
 * Garmin Connect – Web Fallback.
 *
 * WebView ist auf Web nicht verfuegbar. Zeigt einen Hinweis,
 * dass Garmin Export nur in der nativen App funktioniert.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../src/theme/colors';
import { Fonts } from '../src/theme/fonts';

export default function GarminConnectWebFallback() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Garmin Connect</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="watch-outline" size={48} color={Colors.textTertiary} />
        </View>
        <Text style={styles.title}>Nicht verfuegbar im Browser</Text>
        <Text style={styles.subtitle}>
          Garmin Export funktioniert nur in der nativen App (iOS / Android).
          {'\n\n'}
          Oeffne die App auf deinem Handy, um Workouts an deine Garmin-Uhr zu senden.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Zurueck</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 17, fontWeight: '600', color: Colors.textPrimary,
    fontFamily: Fonts.displaySemiBold,
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: {
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: Fonts.displayBold, textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, fontFamily: Fonts.bodyRegular, marginBottom: 32,
  },
  backBtn: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 32,
  },
  backBtnText: {
    fontSize: 15, fontWeight: '600', color: Colors.textPrimary,
    fontFamily: Fonts.displaySemiBold,
  },
});
