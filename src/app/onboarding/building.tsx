import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { BodyFigure } from '@/components/BodyFigure';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { Screen } from '@/components/ui';
import { colors, fonts, NATIVE_DRIVER } from '@/constants/theme';
import { areasLabel, sortAreas, VISIBLE } from '@/data/areas';
import { LEVEL_NAME } from '@/data/content';
import type { BodyView } from '@/data/types';
import { DAY_LETTER } from '@/lib/dates';
import { useViewport } from '@/lib/viewport';
import { useAppStore } from '@/store/useAppStore';

/** How long each build step shows before it ticks off. */
const STEP_MS = 1000;
const VIEWS: BodyView[] = ['front', 'back'];

export default function Building() {
  const plan = useAppStore((s) => s.plan);
  const reduceMotion = useReducedMotion();
  const { height } = useViewport();
  const figure = Math.round(Math.max(170, Math.min(300, height - 520)));
  const areas = sortAreas(plan?.areas ?? []);
  const [step, setStep] = useState(reduceMotion ? 3 : 0);
  const [lights] = useState(() => Array.from({ length: 10 }, () => new Animated.Value(reduceMotion ? 1 : 0)));
  const [bar] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (!reduceMotion) {
      // The chosen areas light up one after another during the first step.
      Animated.stagger(
        Math.min(260, (STEP_MS - 300) / Math.max(1, areas.length)),
        lights.slice(0, areas.length).map((v) => Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER })),
      ).start();
      Animated.timing(bar, { toValue: 1, duration: STEP_MS * 3, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    }
    const timers = reduceMotion ? [] : [1, 2, 3].map((n) => setTimeout(() => setStep(n), STEP_MS * n));
    const done = setTimeout(() => router.replace('/onboarding/plan'), reduceMotion ? 1200 : STEP_MS * 3 + 600);
    return () => [...timers, done].forEach(clearTimeout);
  }, [lights, bar, areas.length, reduceMotion]);

  if (!plan) return null;

  const moves = new Set(plan.sessions.flatMap((s) => s.exerciseIds)).size;
  const pattern = plan.sessions.map((s) => s.weekday);
  const count = `${areas.length} ${areas.length === 1 ? 'area' : 'areas'}`;
  // Each step reads as in progress, then as done once it ticks off.
  const steps = [
    { title: [`Mapping ${count}`, `Mapped ${count}`], detail: areasLabel(plan.areas) },
    { title: [`Matching ${moves} moves`, `Matched ${moves} moves`], detail: `${LEVEL_NAME[plan.level]} level, ordered for your goal` },
    { title: ['Laying out your week', 'Week laid out'], detail: `${plan.days === 7 ? 'Every day' : `${plan.days} sessions`} · ${plan.minutes} min each` },
  ];

  return (
    <Screen>
      <View style={styles.stage}>
        <View style={styles.bodies} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.halo, { width: figure * 1.25, height: figure * 1.25, borderRadius: figure }]} />
          {VIEWS.map((view) => (
            <View key={view} style={styles.side}>
              <View style={{ width: figure / 2, height: figure }}>
                <BodyFigure height={figure} view={view} />
                {areas.map((area, i) =>
                  VISIBLE[view].includes(area) ? (
                    <Animated.View key={area} style={[styles.layer, { opacity: lights[i] }]} pointerEvents="none">
                      <BodyFigure height={figure} view={view} glows={{ [area]: 1 }} overlay />
                    </Animated.View>
                  ) : null,
                )}
              </View>
              <T variant="kicker" color={colors.faint} style={styles.sideLabel}>
                {view === 'front' ? 'Front' : 'Back'}
              </T>
            </View>
          ))}
        </View>
      </View>

      <T variant="title" center accessibilityRole="header" accessibilityLiveRegion="polite">
        {step < 3 ? 'Building your plan' : 'Your plan is ready'}
      </T>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>

      <View style={styles.steps}>
        {steps.map((s, i) => {
          const state = step > i ? 'done' : step === i ? 'active' : 'pending';
          return (
            <View key={s.detail} style={[styles.step, state === 'pending' && styles.pending]}>
              <StepMark state={state} />
              <View style={styles.stepText}>
                <T variant="bodyStrong">{s.title[state === 'done' ? 1 : 0]}</T>
                <T variant="caption" numberOfLines={1}>
                  {s.detail}
                </T>
              </View>
              {i === 2 ? (
                <View style={styles.week}>
                  {DAY_LETTER.map((letter, d) => {
                    const on = state === 'done' && pattern.includes(d);
                    return (
                      <View key={d} style={[styles.day, on && styles.dayOn]}>
                        <T style={[styles.dayLetter, on && styles.dayLetterOn]}>{letter}</T>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

/** Done: a green tick. Active: a spinning arc. Pending: a faint ring. */
function StepMark({ state }: { state: 'done' | 'active' | 'pending' }) {
  const reduceMotion = useReducedMotion();
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (state !== 'active' || reduceMotion) return;
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [state, spin, reduceMotion]);

  if (state === 'done') {
    return (
      <View style={[styles.mark, styles.markDone]}>
        <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
      </View>
    );
  }
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[styles.mark, state === 'active' && { transform: [{ rotate }] }]}>
      <Svg width={26} height={26}>
        <Circle cx={13} cy={13} r={11} stroke={colors.track} strokeWidth={2.2} fill="none" />
        {state === 'active' ? <Circle cx={13} cy={13} r={11} stroke={colors.green} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="18 52" fill="none" /> : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bodies: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  halo: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(47,122,86,0.07)' },
  side: { alignItems: 'center' },
  sideLabel: { marginTop: 10 },
  layer: { position: 'absolute', left: 0, top: 0 },

  track: { alignSelf: 'center', width: 160, height: 4, borderRadius: 2, marginTop: 14, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.green },

  steps: { marginTop: 22, marginBottom: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  pending: { opacity: 0.45 },
  stepText: { flex: 1, gap: 1 },
  mark: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  markDone: { borderRadius: 13, backgroundColor: colors.green },

  week: { flexDirection: 'row', gap: 3 },
  day: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: 'rgba(90,70,40,0.08)', alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.green },
  dayLetter: { fontFamily: fonts.bold, fontSize: 8, color: colors.faint },
  dayLetterOn: { color: colors.white },
});
