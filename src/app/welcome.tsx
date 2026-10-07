import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { BodyFigure } from '@/components/BodyFigure';
import { Icon, type IconName } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { Rise } from '@/components/Rise';
import { T } from '@/components/T';
import { PrimaryButton, Screen } from '@/components/ui';
import { accent, colors, fonts, glass, NATIVE_DRIVER, REGION_COLORS, shadows, tint } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { durationLabel, getExercise } from '@/data/exercises';
import type { AreaId, Exercise } from '@/data/types';
import { playStartSound } from '@/lib/sounds';

/**
 * Moves from the library, in a ring round the body. Tour stops light an area on the body and lift its move;
 * the rest are scenery. Angles are in degrees, clockwise from the right, chosen to sit clear of the figure.
 */
const RING: { move: string; angle: number; tour?: true }[] = [
  { move: 'hip-lunge', angle: -165, tour: true },
  { move: 'sh-reach', angle: -55, tour: true },
  { move: 'kn-quad', angle: 25, tour: true },
  { move: 'neck-tilt', angle: -125, tour: true },
  { move: 'el-circles', angle: -15, tour: true },
  { move: 'lb-child', angle: 155 },
  { move: 'ub-catcow', angle: 118 },
  { move: 'an-calf', angle: 62 },
];
const MOVES = RING.map((r) => ({ ...r, exercise: getExercise(r.move) as Exercise }));
const TOUR = MOVES.filter((m) => m.tour);
const STEP_MS = 2600;
const BUBBLE = 46;
/** Room kept under the ring for the caption card. */
const CAPTION_SPACE = 64;

const POINTS: { icon: IconName; label: string }[] = [
  { icon: 'clock', label: '5–20 min' },
  { icon: 'target', label: 'Your stiff spots' },
  { icon: 'sprout', label: 'Grows with you' },
];

export default function Welcome() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [t] = useState(() => new Animated.Value(0));
  const [intro] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: TOUR.length, duration: STEP_MS * TOUR.length, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [t, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      intro.setValue(1);
      return;
    }
    const anim = Animated.timing(intro, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [intro, reduceMotion]);

  // Each stop fades in, holds, then fades out as the next one takes over. With reduced motion the first stop stays.
  const fade = (i: number): Animated.AnimatedInterpolation<number> | number => {
    if (reduceMotion) return i === 0 ? 1 : 0;
    const wrap = i === 0 ? [TOUR.length - 0.5, TOUR.length] : [];
    return t.interpolate({
      inputRange: [i - 0.5, i - 0.2, i + 0.2, i + 0.5, ...wrap].sort((a, b) => a - b),
      outputRange: i === 0 ? [0, 1, 1, 0, 0, 1] : [0, 1, 1, 0],
      extrapolate: 'clamp',
    });
  };
  const grow = (i: number) => {
    const f = fade(i);
    return typeof f === 'number' ? 1 + 0.2 * f : f.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  };

  // The ring is an ellipse filling the stage; the figure sits in its middle.
  const ringH = Math.max(0, stage.height - CAPTION_SPACE);
  const cx = stage.width / 2;
  const cy = ringH / 2 + 8;
  const rx = stage.width / 2 - BUBBLE / 2 - 14;
  const ry = ringH / 2 - BUBBLE / 2 - 4;
  const figureHeight = Math.round(Math.min(300, ringH * 0.8));
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== stage.width || height !== stage.height) setStage({ width, height });
  };

  return (
    <Screen>
      <Rise intro={intro} order={0}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Icon name="sprout" size={15} color={colors.onGreen} strokeWidth={2.2} />
          </View>
          <T variant="bodyStrong" style={styles.wordmark}>
            Mobility
          </T>
        </View>
      </Rise>

      <Rise intro={intro} order={1} style={styles.stageWrap}>
        <View style={styles.stage} onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.arch} pointerEvents="none">
            <LinearGradient colors={[colors.card, glass]} locations={[0, 1]} style={StyleSheet.absoluteFill} />
          </View>

          {stage.width > 0 && figureHeight > 120 ? (
            <>
              <Svg width={stage.width} height={ringH + 16} style={styles.layer}>
                <Defs>
                  <RadialGradient id="welcomeHalo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={colors.green} stopOpacity={0.15} />
                    <Stop offset="0.6" stopColor={colors.green} stopOpacity={0.04} />
                    <Stop offset="1" stopColor={colors.green} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Ellipse cx={cx} cy={cy} rx={rx * 0.75} ry={ry * 0.8} fill="url(#welcomeHalo)" />
                <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={colors.green} strokeOpacity={0.14} strokeWidth={1} strokeDasharray="2 5" />
                <Circle cx={cx} cy={cy} r={Math.min(rx, ry) * 0.62} fill="none" stroke={colors.green} strokeOpacity={0.1} strokeWidth={1} />
              </Svg>

              <View style={[styles.layer, { left: cx - figureHeight / 4, top: cy - figureHeight / 2 }]}>
                <BodyFigure height={figureHeight} view="front" />
                {TOUR.map((m, i) => (
                  <Animated.View key={m.move} style={[styles.layer, { opacity: fade(i) }]} pointerEvents="none">
                    <BodyFigure height={figureHeight} view="front" glows={{ [m.exercise.area]: 1 }} overlay />
                  </Animated.View>
                ))}
              </View>

              {MOVES.map((m) => {
                const a = (m.angle * Math.PI) / 180;
                const i = TOUR.indexOf(m);
                const lit = i >= 0;
                return (
                  <Animated.View
                    key={m.move}
                    style={[
                      styles.layer,
                      { left: cx + rx * Math.cos(a) - BUBBLE / 2, top: cy + ry * Math.sin(a) - BUBBLE / 2 },
                      lit ? { transform: [{ scale: grow(i) }] } : styles.scenery,
                    ]}
                  >
                    {lit ? <Animated.View style={[styles.activeRing, { opacity: fade(i) }]} /> : null}
                    <PoseBubble pose={m.exercise.pose} size={BUBBLE} color={REGION_COLORS[m.exercise.area]} dot={false} outline shadow />
                  </Animated.View>
                );
              })}

              <View style={[styles.captionSlot, { top: ringH + 4 }]} pointerEvents="none">
                {TOUR.map((m, i) => {
                  const opacity = fade(i);
                  const shift = typeof opacity === 'number' ? 0 : opacity.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
                  return (
                    <Animated.View key={m.move} style={[styles.caption, { opacity, transform: [{ translateY: shift }] }]}>
                      <Caption exercise={m.exercise} area={m.exercise.area} />
                    </Animated.View>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      </Rise>

      <Rise intro={intro} order={2}>
        <T variant="hero" style={styles.headline} accessibilityRole="header">
          Loosen up.{'\n'}
          <T variant="hero" color={colors.green}>
            Move better.
          </T>
        </T>
        <T variant="body" color={colors.muted} style={styles.sub}>
          Tell us where you feel stiff. We&apos;ll build a short daily routine around it.
        </T>
      </Rise>

      <Rise intro={intro} order={3}>
        <View style={styles.points}>
          {POINTS.map((p, i) => (
            <View key={p.label} style={[styles.point, i > 0 && styles.pointDivider]}>
              <Icon name={p.icon} size={15} color={colors.greenText} strokeWidth={2} />
              <T variant="caption" style={styles.pointLabel} numberOfLines={1}>
                {p.label}
              </T>
            </View>
          ))}
        </View>
      </Rise>

      <Rise intro={intro} order={4}>
        <PrimaryButton
          label="Get started"
          style={styles.cta}
          onPress={() => {
            playStartSound();
            router.push('/onboarding/areas');
          }}
        />
        <T variant="caption" center color={colors.faint} style={styles.note}>
          Three quick questions · under a minute
        </T>
      </Rise>
    </Screen>
  );
}

/** The move that goes with the lit area: its drawing, name, area and hold time. */
function Caption({ exercise, area }: { exercise: Exercise; area: AreaId }) {
  return (
    <>
      <PoseBubble pose={exercise.pose} size={34} color={REGION_COLORS[area]} dot={false} />
      <View style={styles.captionText}>
        <T variant="kicker" style={styles.captionKicker}>
          For {AREA_NAMES[area].toLowerCase()}
        </T>
        <T variant="smallStrong" numberOfLines={1}>
          {exercise.name}
        </T>
      </View>
      <View style={styles.captionTime}>
        <Icon name="clock" size={12} color={colors.muted} strokeWidth={2} />
        <T variant="caption" style={styles.captionTimeLabel}>
          {durationLabel(exercise)}
        </T>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 32 },
  mark: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', boxShadow: shadows.green },
  wordmark: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.2 },

  stageWrap: { flex: 1, marginTop: 12 },
  stage: { flex: 1 },
  arch: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: tint(0.07),
  },
  layer: { position: 'absolute', left: 0, top: 0 },
  scenery: { opacity: 0.78 },
  activeRing: {
    position: 'absolute',
    left: -5,
    top: -5,
    width: BUBBLE + 10,
    height: BUBBLE + 10,
    borderRadius: (BUBBLE + 10) / 2,
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: accent(0.08),
  },

  captionSlot: { position: 'absolute', left: 0, right: 0, height: 52, alignItems: 'center' },
  caption: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 9,
    paddingRight: 14,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: tint(0.10),
    boxShadow: shadows.card,
  },
  captionText: { gap: 1 },
  captionKicker: { fontSize: 11, lineHeight: 14, letterSpacing: 0.9 },
  captionTime: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: tint(0.07) },
  captionTimeLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },

  headline: { marginTop: 20, fontSize: 44, lineHeight: 46 },
  sub: { marginTop: 10, maxWidth: 330, fontSize: 17, lineHeight: 25 },

  points: { flexDirection: 'row', marginTop: 18 },
  point: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 22 },
  pointDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  pointLabel: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },

  cta: { marginTop: 20 },
  note: { marginTop: 12, marginBottom: 2 },
});
