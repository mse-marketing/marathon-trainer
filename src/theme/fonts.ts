import { useFonts } from 'expo-font';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

export function useAppFonts() {
  return useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });
}

export const Fonts = {
  // Display / Headlines
  displayRegular: 'Outfit_400Regular',
  displayMedium: 'Outfit_500Medium',
  displaySemiBold: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',

  // Body / UI text
  bodyRegular: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',

  // Mono / Numbers
  monoRegular: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
};

export const Typography = {
  heroNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 56,
    letterSpacing: -2,
  },
  screenTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
  },
  cardTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 18,
  },
  pace: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
  },
  button: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
  },
  tabLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
};
