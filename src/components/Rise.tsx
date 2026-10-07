import type { ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/** Fades and lifts its children in as `intro` runs 0 → 1, a beat after the item before (by `order`). */
export function Rise({ intro, order, style, children }: { intro: Animated.Value; order: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const start = order * 0.12;
  const progress = intro.interpolate({ inputRange: [start, Math.min(1, start + 0.5)], outputRange: [0, 1], extrapolate: 'clamp' });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY: lift }] }]}>{children}</Animated.View>;
}
