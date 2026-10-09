import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear, STAGGER, usePopSounds } from '@/components/Appear';
import { Icon } from '@/components/Icon';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { ExerciseArt, MoveThumb } from '@/components/ExerciseArt';
import { T } from '@/components/T';
import { PrimaryButton, Screen } from '@/components/ui';
import { accent, colors, fonts, glass, shade, shadows, tint } from '@/constants/theme';
import { GOALS, LEVELS } from '@/data/content';
import { getExercise } from '@/data/exercises';
import type { Exercise, Goal, Level } from '@/data/types';
import { tap } from '@/lib/haptics';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

/** A drawing and a one-line description for each goal. */
// Each goal's picture is a move that shows what it's about: a big reach, a deep fold, easing a stiff back,
// a sport warm-up, and the squat behind bending and lifting.
const GOAL_INFO: Record<Goal, { cover: string; line: string }> = {
  freely: { cover: 'sh-sidebend', line: 'Loosen up all over' },
  flexibility: { cover: 'lb-seated', line: 'Reach further, go deeper' },
  stiffness: { cover: 'ub-catcow', line: 'Ease tight, achy spots' },
  sport: { cover: 'hip-wgs', line: 'Warm up and recover' },
  everyday: { cover: 'hip-squat', line: 'Bend, lift and reach with ease' },
};

/** What each level means for the plan, with real moves from the library at that level. */
const LEVEL_INFO: Record<Level, { line: string; moves: string[] }> = {
  1: { line: 'Gentle, beginner-friendly moves.', moves: ['lb-child', 'hip-butterfly', 'neck-tuck'] },
  2: { line: 'Beginner and intermediate moves.', moves: ['ub-thread', 'lb-cobra', 'hip-squat'] },
  3: { line: 'The full library, advanced moves included.', moves: ['hip-pigeon', 'kn-couch', 'an-squat'] },
};

// The screen builds itself in order: the question, the goal cards one by one, then the button.
const CARDS_AT = 250;
const CARD_STAGGER = STAGGER + 30;
const BUTTON_AT = CARDS_AT + GOALS.length * CARD_STAGGER + 150;

export default function GoalAndExperience() {
  // Nothing is picked until the person taps a goal; only then does "Your experience" appear.
  const [goal, setGoal] = useState<Goal | null>(null);
  const level = useAppStore((s) => s.draft.level);
  const setDraft = useAppStore((s) => s.setDraft);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => preloadSounds(), []);
  usePopSounds(CARDS_AT, GOALS.length, CARD_STAGGER);

  const pickGoal = (id: Goal) => {
    tap();
    playSound('select');
    const first = goal === null;
    setGoal(id);
    setDraft({ goal: id });
    // Bring the experience question into view as it slides in.
    if (first) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
  };
  const examples = LEVEL_INFO[level].moves.map((id) => getExercise(id) as Exercise);
  const current = LEVELS.find((l) => l.id === level);

  return (
    <Screen>
      <OnboardingHeader step={2} />
      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Appear>
          <T variant="title" accessibilityRole="header">
            What&apos;s your main goal?
          </T>
        </Appear>
        <Appear delay={120}>
          <T variant="body" color={colors.muted} style={styles.sub}>
            We&apos;ll put the moves that suit it first.
          </T>
        </Appear>

        <View style={styles.goals} accessibilityRole="radiogroup">
          {GOALS.map((g, i) => {
            const info = GOAL_INFO[g.id];
            const on = goal === g.id;
            const wide = i === GOALS.length - 1 && GOALS.length % 2 === 1;
            return (
              <Appear key={g.id} delay={CARDS_AT + i * CARD_STAGGER} style={wide ? styles.cellWide : styles.cellHalf}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${g.label}. ${info.line}`}
                  onPress={() => pickGoal(g.id)}
                  style={({ pressed }) => [styles.goal, wide ? styles.goalWide : styles.goalHalf, on && styles.goalOn, pressed && styles.pressed]}
                >
                  <MoveThumb id={info.cover} size={wide ? 44 : 48} />
                  <View style={wide ? styles.goalTextWide : styles.goalText}>
                    <T variant="bodyStrong" numberOfLines={1}>
                      {g.label}
                    </T>
                    <T variant="caption" numberOfLines={2}>
                      {info.line}
                    </T>
                  </View>
                  <View style={[styles.check, on ? styles.checkOn : styles.checkOff, !wide && styles.checkCorner]}>
                    {on ? <Icon name="check" size={12} color={colors.onGreen} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              </Appear>
            );
          })}
        </View>

        {goal === null ? null : (
          <>
            <Appear>
              <T variant="h2" style={styles.h2} accessibilityRole="header">
                Your experience
              </T>
              <T variant="small" style={styles.sub}>
                This sets which moves you start with.
              </T>
            </Appear>

            <Appear delay={100}>
              <View style={styles.segments} accessibilityRole="radiogroup">
                {LEVELS.map((l) => {
                  const on = level === l.id;
                  return (
                    <Pressable
                      key={l.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${l.name}: ${l.label}`}
                      onPress={() => {
                        tap();
                        setDraft({ level: l.id });
                      }}
                      style={({ pressed }) => [styles.segment, on && styles.segmentOn, pressed && styles.pressed]}
                    >
                      <View style={styles.bars}>
                        {[7, 11, 15].map((h, i) => (
                          <View key={h} style={[styles.bar, { height: h, backgroundColor: i < l.id ? (on ? colors.green : colors.chevron) : tint(0.16) }]} />
                        ))}
                      </View>
                      <T variant="smallStrong" color={on ? colors.ink : colors.muted} numberOfLines={1}>
                        {l.name}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </Appear>

            <Appear delay={200}>
              <View style={styles.detail}>
                <View style={styles.detailTop}>
                  <View style={styles.detailText}>
                    <T variant="bodyStrong">{current?.label}</T>
                    <T variant="caption">{LEVEL_INFO[level].line}</T>
                    <T variant="caption" color={colors.faint} numberOfLines={2}>
                      Moves like{' '}
                      <T variant="caption" color={colors.ink} style={styles.moveNames}>
                        {examples.map((e) => e.name).join(', ')}
                      </T>
                    </T>
                  </View>
                  <View style={styles.stack} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    {examples.map((e, i) => (
                      <ExerciseArt key={e.id} exercise={e} size={36} dot={false} outline style={i > 0 ? styles.stacked : undefined} />
                    ))}
                  </View>
                </View>
              </View>
            </Appear>
          </>
        )}
      </ScrollView>
      <Appear delay={BUTTON_AT}>
        <PrimaryButton
          label={goal === null ? 'Pick your main goal' : 'Continue'}
          disabled={goal === null}
          style={styles.cta}
          onPress={() => {
            playSound('next');
            router.push('/onboarding/days');
          }}
        />
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 12 },
  sub: { marginTop: 6 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  goals: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goal: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  cellHalf: { width: '48.5%' },
  cellWide: { width: '100%' },
  goalHalf: { flexGrow: 1, minHeight: 118, padding: 13, gap: 8 },
  goalWide: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 12, paddingRight: 16 },
  goalOn: { borderWidth: 2, borderColor: colors.green, backgroundColor: accent(0.08), boxShadow: shadows.small },
  goalText: { gap: 2 },
  goalTextWide: { flex: 1, gap: 2 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkCorner: { position: 'absolute', top: 12, right: 12 },
  checkOn: { backgroundColor: colors.green },
  checkOff: { borderWidth: 1.5, borderColor: tint(0.25) },

  h2: { marginTop: 24 },
  segments: { marginTop: 14, flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: tint(0.08) },
  segment: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  segmentOn: { backgroundColor: colors.card, boxShadow: `0px 2px 8px -2px ${shade(0.25)}` },
  bars: { height: 15, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3.5, borderRadius: 2 },

  detail: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: glass, borderWidth: 1, borderColor: colors.border },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { flex: 1, gap: 2 },
  stack: { flexDirection: 'row' },
  stacked: { marginLeft: -10 },
  moveNames: { fontFamily: fonts.semibold },

  cta: { marginTop: 12 },
});
