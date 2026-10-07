import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { BodyFigure } from '@/components/BodyFigure';
import { Rise } from '@/components/Rise';
import { SessionRow } from '@/components/SessionRow';
import { T } from '@/components/T';
import { PrimaryButton, Screen, TextButton } from '@/components/ui';
import { accent, colors, fonts, glassSoft, NATIVE_DRIVER, shadows } from '@/constants/theme';
import { AREA_NAMES, sortAreas } from '@/data/areas';
import { GOAL_LABEL, LEVEL_NAME } from '@/data/content';
import type { AreaId, BodyView } from '@/data/types';
import { addDays, startOfDay } from '@/lib/dates';
import { planStartDay } from '@/lib/plan';
import { goHome, startSession } from '@/lib/flow';
import { nextSession } from '@/lib/progress';
import { useAppStore } from '@/store/useAppStore';

const FIGURE = 132;
const VIEWS: BodyView[] = ['front', 'back'];

export default function PlanReady() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const reduceMotion = useReducedMotion();
  const [intro] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.timing(intro, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [intro, reduceMotion]);

  if (!plan) return <Redirect href="/onboarding/areas" />;

  const now = new Date();
  const next = nextSession(plan, history, now);
  const areas = sortAreas(plan.areas);
  const glows = Object.fromEntries(areas.map((a) => [a, 1])) as Partial<Record<AreaId, number>>;
  // The first seven days from the day the plan starts, with each session's real date.
  const startDay = planStartDay(plan);
  const firstDay = startOfDay(new Date(plan.createdAt));
  const firstWeek = plan.sessions
    .map((s) => ({ s, offset: (s.weekday - startDay + 7) % 7 }))
    .sort((a, b) => a.offset - b.offset)
    .map(({ s, offset }) => ({ s, date: addDays(firstDay, offset) }));
  const start = () => startSession(next?.session.id ?? firstWeek[0].s.id);

  return (
    <Screen>
      <Rise intro={intro} order={0}>
        <T variant="kicker">Your plan is ready</T>
        <T variant="title" style={styles.title} accessibilityRole="header">
          {LEVEL_NAME[plan.level]} · {GOAL_LABEL[plan.goal]}
        </T>
      </Rise>

      <Rise intro={intro} order={1}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.bodies} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.halo} />
              {VIEWS.map((view) => (
                <BodyFigure key={view} height={FIGURE} view={view} glows={glows} />
              ))}
            </View>
            <View style={styles.areas}>
              <T variant="kicker" color={colors.faint}>
                Focus areas
              </T>
              <View style={styles.chips}>
                {areas.map((a) => (
                  <View key={a} style={styles.chip}>
                    <T style={styles.chipText}>{AREA_NAMES[a]}</T>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={String(plan.days)} label={plan.days === 7 ? 'every day' : 'days a week'} />
            <Stat value={String(plan.minutes)} label="min a session" divider />
            <Stat value={String(plan.days * plan.minutes)} label="min a week" divider />
          </View>
        </View>
      </Rise>

      <Rise intro={intro} order={2} style={styles.weekWrap}>
        <View style={styles.weekHeader}>
          <T variant="kicker">Your first week</T>
          <T variant="caption">
            {plan.sessions.length} {plan.sessions.length === 1 ? 'session' : 'sessions'}
          </T>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {firstWeek.map(({ s, date }) => {
            const isNext = next?.session.id === s.id;
            const when = isNext ? `${next?.when === 'upcoming' ? 'Next' : 'Today'} · ` : '';
            return (
              <SessionRow
                key={s.id}
                session={s}
                now={now}
                date={date}
                meta={`${when}${s.minutes} min · ${s.exerciseIds.length} moves`}
                highlight={isNext}
                trailing="bubbles"
                onPress={isNext ? start : undefined}
              />
            );
          })}
        </ScrollView>
      </Rise>

      <Rise intro={intro} order={3}>
        <T variant="caption" center style={styles.safety}>
          Move gently, within a comfortable range.
        </T>
        <PrimaryButton label="Start first session" icon="play" onPress={start} />
        {/* A way out for anyone not starting yet: home, with onboarding cleared from the back stack. */}
        <TextButton label="Go to my home screen" color={colors.muted} onPress={goHome} style={styles.home} />
      </Rise>
    </Screen>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <T style={styles.statValue}>{value}</T>
      <T variant="caption">{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6 },

  hero: { marginTop: 16, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, boxShadow: shadows.card, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16, paddingHorizontal: 16 },
  bodies: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', alignSelf: 'center', left: -6, right: -6, top: 4, bottom: 4, borderRadius: 80, backgroundColor: accent(0.07) },
  areas: { flex: 1, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, height: 28, borderRadius: 14, justifyContent: 'center', backgroundColor: colors.greenTint },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.greenDeep },

  stats: { flexDirection: 'row', marginTop: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: glassSoft },
  stat: { flex: 1, paddingHorizontal: 16, gap: 1 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  statValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.ink },

  weekWrap: { flex: 1, marginTop: 22 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  list: { flex: 1, marginTop: 10, marginHorizontal: -24 },
  listContent: { gap: 10, paddingHorizontal: 24, paddingBottom: 8 },
  safety: { marginTop: 10, marginBottom: 12 },
  home: { marginTop: 4 },
});
