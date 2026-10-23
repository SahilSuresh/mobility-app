import { router, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { tap } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';

/** The tabs in the order they sit on the bar, and the path that opens each. */
export const TAB_ORDER = ['index', 'plan', 'routines', 'progress', 'settings'] as const;
const PATHS: Record<(typeof TAB_ORDER)[number], string> = { index: '/', plan: '/plan', routines: '/routines', progress: '/progress', settings: '/settings' };

/** A swipe has to travel this far sideways before it counts, so a slow drag still changes tab... */
const DISTANCE = 56;
/** ...or move this fast, so a quick flick does too. */
const VELOCITY = 650;

/**
 * Swipe left or right anywhere on a tab's page to move to the next or previous tab, like the bar had been tapped:
 * the same tock and tap, and the tab bar's highlight follows (the pages slide with the Tabs' "shift" animation).
 * Scrolling up and down is untouched: the swipe only starts once a finger has clearly moved sideways, and gives
 * up as soon as it moves up or down instead. Taps and buttons are untouched too, as a swipe needs real movement.
 */
export function SwipeTabs({ children }: { children: ReactNode }) {
  const segments = useSegments() as string[];
  // Inside "(tabs)" the second segment names the tab; the Today tab (index) has none.
  const current = (segments[1] ?? 'index') as (typeof TAB_ORDER)[number];

  const go = (step: -1 | 1) => {
    const at = TAB_ORDER.indexOf(current);
    const next = TAB_ORDER[at + step];
    if (at < 0 || !next) return;
    tap();
    playSound('tab');
    router.navigate(PATHS[next] as never);
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-28, 28])
    .failOffsetY([-14, 14])
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX < -DISTANCE || e.velocityX < -VELOCITY) go(1);
      else if (e.translationX > DISTANCE || e.velocityX > VELOCITY) go(-1);
    });

  return (
    <GestureDetector gesture={swipe}>
      {/* A plain view, so the detector has one native child to attach to. */}
      <GestureHost>{children}</GestureHost>
    </GestureDetector>
  );
}

function GestureHost({ children }: { children: ReactNode }) {
  return <Animated.View style={styles.fill}>{children}</Animated.View>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
