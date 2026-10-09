import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { colors, NATIVE_DRIVER, REGION_COLORS, shade, shadows } from '@/constants/theme';
import { ART, ART_BACKGROUND, ART_INK } from '@/data/art';
import { getExercise } from '@/data/exercises';
import type { Exercise } from '@/data/types';

import { Icon, type IconName } from './Icon';
import { PoseBubble, SWITCH, SWITCH_CYCLE } from './PoseBubble';

type Props = {
  exercise: Exercise;
  size: number;
  shadow?: boolean;
  /** A white ring, for drawings that overlap in a row. */
  outline?: boolean;
  /** Switch between the starting position and the exercise, like the drawn poses do. */
  breathe?: boolean;
  /** Where in the switch cycle to start (0–1), so a list of moves doesn't switch in step. */
  phase?: number;
  /** The drawn poses' dot on the area worked; illustrations don't need it. */
  dot?: boolean;
  /** Flip left to right: the second side of a two-sided move, so the picture matches the side being worked. */
  mirrored?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * An exercise's picture in a round frame, at any size from a list thumbnail to the player. Moves with illustrations
 * show them: playing, it switches from the relaxed start to the exercise and back with a soft crossfade (paused, or
 * with reduced motion, it shows the exercise). Moves without illustrations yet fall back to the drawn pose.
 */
export function ExerciseArt({ exercise, size, shadow, outline, breathe, phase = 0, dot, mirrored, style }: Props) {
  const art = ART[exercise.id];
  const reduceMotion = useReducedMotion();
  const playing = !!art && !!breathe && !reduceMotion;
  // 1 shows the exercise, 0 the starting position.
  const [show] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!playing) {
      show.setValue(1);
      return;
    }
    show.setValue(0);
    const change = (to: number) => Animated.timing(show, { toValue: to, duration: SWITCH.fade, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER });
    const loop = Animated.sequence([
      Animated.delay((phase % 1) * SWITCH_CYCLE),
      Animated.loop(Animated.sequence([Animated.delay(SWITCH.start), change(1), Animated.delay(SWITCH.hold), change(0)])),
    ]);
    loop.start();
    return () => loop.stop();
  }, [playing, phase, show]);

  if (!art) {
    return (
      <PoseBubble
        pose={exercise.pose}
        size={size}
        color={REGION_COLORS[exercise.area]}
        shadow={shadow}
        outline={outline}
        breathe={breathe}
        phase={phase}
        dot={dot}
        style={[style, mirrored && styles.mirrored]}
      />
    );
  }

  // The pictures are square, cut so the figure fills the circle; the round frame trims only plain background and the mat's ends.
  const picture = { width: size, height: size, top: 0, left: 0 };

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: art.background, overflow: 'hidden' },
        outline && { borderWidth: 2, borderColor: colors.card },
        shadow && { boxShadow: size > 120 ? `0px 18px 34px -16px ${shade(0.5)}` : shadows.bubble },
        mirrored && styles.mirrored,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {playing ? (
        <Animated.View style={[styles.layer, picture, { opacity: show.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <Image source={art.start} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.layer, picture, { opacity: show }]}>
        <Image source={art.pose} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} />
      </Animated.View>
    </View>
  );
}

/** A move's picture by its id, for icons and thumbnails: still, showing the exercise. */
export function MoveThumb({ id, size, style }: { id: string; size: number; style?: StyleProp<ViewStyle> }) {
  const exercise = getExercise(id);
  if (!exercise) return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: ART_BACKGROUND }, style]} />;
  return <ExerciseArt exercise={exercise} size={size} dot={false} style={style} />;
}

/** An icon on the pictures' own sage disc, so it sits in a row of move pictures as one of them. */
export function ArtIcon({ name, size, style }: { name: IconName; size: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Icon name={name} size={Math.round(size * 0.46)} color={ART_INK} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { backgroundColor: ART_BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute' },
  mirrored: { transform: [{ scaleX: -1 }] },
});
