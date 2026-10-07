import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { NATIVE_DRIVER } from '@/constants/theme';
import { playSound } from '@/lib/sounds';

/** Time between one item of a list coming in and the next, in ms. */
export const STAGGER = 70;

/**
 * A soft pop for each of `count` items as it lands: the first `start` ms after the screen opens, then one every `stagger` ms.
 * With Reduce Motion everything appears at once, so there's no cascade to hear.
 */
export function usePopSounds(start: number | undefined, count: number, stagger = STAGGER) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (start === undefined || reduceMotion) return;
    const timers = Array.from({ length: count }, (_, i) => setTimeout(() => playSound('pop'), start + i * stagger));
    return () => timers.forEach(clearTimeout);
  }, [start, count, stagger, reduceMotion]);
}

/**
 * Brings its children in once, `delay` ms after the screen opens: `rise` fades and lifts them,
 * `pop` springs them up from small (for chips and buttons). Stays still with Reduce Motion on, or with `still`.
 */
export function Appear({
  delay = 0,
  kind = 'rise',
  still = false,
  style,
  children,
}: {
  delay?: number;
  kind?: 'rise' | 'pop';
  still?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion() || still;
  const [progress] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.sequence([
      Animated.delay(delay),
      kind === 'pop'
        ? Animated.spring(progress, { toValue: 1, friction: 6, tension: 140, useNativeDriver: NATIVE_DRIVER })
        : Animated.timing(progress, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [progress, delay, kind, reduceMotion]);

  // The spring overshoots a little past 1, which gives the pop its bounce; opacity is clamped.
  const opacity = progress.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });
  const transform =
    kind === 'pop'
      ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }]
      : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }];

  return <Animated.View style={[style, { opacity, transform }]}>{children}</Animated.View>;
}
