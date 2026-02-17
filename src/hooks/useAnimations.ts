import { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';

const useNative = Platform.OS !== 'web';

export function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: useNative,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: useNative,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export function useCountUp(targetValue: number, duration = 1200) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      useNativeDriver: false,
    }).start();
  }, [targetValue]);

  return animatedValue;
}

export function usePressAnimation() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: useNative,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: useNative,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}
