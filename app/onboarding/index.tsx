import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '../../src/theme/colors';
import { Fonts, Typography } from '../../src/theme/fonts';
import { useFadeIn } from '../../src/hooks/useAnimations';

export default function WelcomeScreen() {
  const logoAnim = useFadeIn(0);
  const titleAnim = useFadeIn(150);
  const subtitleAnim = useFadeIn(300);
  const feature1 = useFadeIn(450);
  const feature2 = useFadeIn(530);
  const feature3 = useFadeIn(610);
  const feature4 = useFadeIn(690);
  const buttonAnim = useFadeIn(850);

  return (
    <LinearGradient
      colors={['#1A0D2E', '#0D1117', '#0D1117']}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 0.6}}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.content}>
          <Animated.View style={logoAnim}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>M</Text>
            </View>
          </Animated.View>
          <Animated.View style={titleAnim}>
            <Text style={styles.title}>Marathon Trainer</Text>
          </Animated.View>
          <Animated.View style={subtitleAnim}>
            <Text style={styles.subtitle}>
              Dein personalisierter Trainingsplan{'\n'}fuer die Marathon-Vorbereitung
            </Text>
          </Animated.View>

          <View style={styles.features}>
            <Animated.View style={feature1}>
              <FeatureItem iconName="speedometer-outline" text="VDOT-basierte Pace-Zonen" />
            </Animated.View>
            <Animated.View style={feature2}>
              <FeatureItem iconName="layers-outline" text="8-16 Wochen Periodisierung" />
            </Animated.View>
            <Animated.View style={feature3}>
              <FeatureItem iconName="analytics-outline" text="Fortschritts-Tracking" />
            </Animated.View>
            <Animated.View style={feature4}>
              <FeatureItem iconName="person-outline" text="Personalisiert fuer dein Level" />
            </Animated.View>
          </View>

          <Animated.View style={[{width: '100%'}, buttonAnim]}>
            <TouchableOpacity
              onPress={() => router.push('/onboarding/level')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Trainingsplan erstellen</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({ iconName, text }: { iconName: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconCircle}>
        <Ionicons name={iconName as any} size={16} color={Colors.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentMuted,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    color: Colors.accent,
    fontFamily: Fonts.displayBold,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.displayBold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 16,
    color: Colors.accent,
  },
  featureText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyMedium,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: Radius.full,
    width: '100%',
    alignItems: 'center',
    ...Shadows.button,
  },
  startButtonText: {
    color: Colors.textOnAccent,
    fontSize: 17,
    fontFamily: Fonts.displayBold,
  },
});
