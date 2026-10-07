import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { colors, fonts, NATIVE_DRIVER } from '@/constants/theme';

import { T } from './T';

/** Same size as the native splash image (app.json), so the intro picks up exactly where it left off. */
const MARK = 120;
const RING = MARK + 28;

/**
 * Plays once on launch, over the first screen: a ring opens out round the mark as it takes a breath,
 * the mark lifts and the name rises in beneath it, then the whole thing fades away.
 */
export function LaunchIntro({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [ring] = useState(() => new Animated.Value(0));
  const [breath] = useState(() => new Animated.Value(0));
  const [lift] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const out = Animated.timing(fade, { toValue: 0, duration: reduceMotion ? 250 : 320, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE_DRIVER });
    const anim = reduceMotion
      ? Animated.sequence([Animated.delay(300), out])
      : Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(ring, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
            Animated.sequence([
              Animated.timing(breath, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
              Animated.timing(breath, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
            ]),
          ]),
          Animated.timing(lift, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
          Animated.delay(380),
          out,
        ]);
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
  }, [ring, breath, lift, fade, reduceMotion, onDone]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const rise = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const textRise = lift.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.group, { transform: [{ translateY: rise }] }]}>
        <View style={styles.markWrap}>
          {reduceMotion ? null : (
            <Animated.View style={[styles.ring, { opacity: ring, transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }]} />
          )}
          <Animated.View style={{ transform: [{ scale }] }}>
            <Image source={require('../../assets/images/splash-icon.png')} style={styles.mark} contentFit="contain" />
          </Animated.View>
        </View>
        <Animated.View style={[styles.text, { opacity: reduceMotion ? 1 : lift, transform: [{ translateY: reduceMotion ? 0 : textRise }] }]}>
          <T style={styles.name}>Mobility</T>
          <T variant="kicker" color={colors.greenText} style={styles.tagline}>
            Loosen up · Move better
          </T>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bgTop, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  // The text sits below the mark without moving it, so the mark starts dead centre like the native splash.
  group: { alignItems: 'center', height: MARK, overflow: 'visible' },
  markWrap: { width: MARK, height: MARK, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    left: (MARK - RING) / 2,
    top: (MARK - RING) / 2,
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(47,122,86,0.35)',
  },
  mark: { width: MARK, height: MARK },
  text: { position: 'absolute', top: MARK + 26, alignItems: 'center', width: 320 },
  name: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.6, color: colors.ink },
  tagline: { marginTop: 8, letterSpacing: 1.6 },
});
