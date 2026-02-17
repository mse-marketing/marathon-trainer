import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../theme/colors';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  gradientColors?: [string, string, ...string[]];
  borderWidth?: number;
}

export default function GradientCard({
  children,
  style,
  innerStyle,
  gradientColors = [Colors.accentGradientStart, Colors.accentGradientEnd],
  borderWidth = 1,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.outer, { borderRadius: Radius.md, padding: borderWidth }, style]}
    >
      <View style={[styles.inner, { borderRadius: Radius.md - borderWidth }, innerStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {},
  inner: {
    backgroundColor: Colors.card,
    padding: 16,
  },
});
