import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Appear, STAGGER, usePopSounds } from '@/components/Appear';
import { BodyFigure } from '@/components/BodyFigure';
import { CountUp } from '@/components/CountUp';
import { SessionRow } from '@/components/SessionRow';
import { T } from '@/components/T';
import { PrimaryButton, Screen, TextButton } from '@/components/ui';
import { accent, colors, fonts, glassSoft, shadows } from '@/constants/theme';
import { AREA_NAMES, sortAreas } from '@/data/areas';
import { GOAL_LABEL, LEVEL_NAME } from '@/data/content';
import type { AreaId, BodyView } from '@/data/types';
import { addDays, startOfDay } from '@/lib/dates';
import { planStartDay } from '@/lib/plan';
import { goHome, startSession } from '@/lib/flow';
import { nextSession } from '@/lib/progress';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

const FIGURE = 132;
const VIEWS: BodyView[] = ['front', 'back'];

export default function PlanReady() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  // The reveal, in order: the headline, the card and both figures, the focus areas one by one,
  // the numbers counting up, the first week session by session, then the button.
  const areaCount = plan?.areas.length ?? 0;
  const chipStagger = Math.min(STAGGER, Math.round(420 / Math.max(1, areaCount)));
  const CHIPS_AT = 650;
  const STATS_AT = CHIPS_AT + areaCount * chipStagger + 80;
  const ROWS_AT = STATS_AT + 450;
  const ROW_STAGGER = 110;
  const rowCount = plan?.sessions.length ?? 0;
  const BOTTOM_AT = ROWS_AT + rowCount * ROW_STAGGER + 150;

  useEffect(() => {
    preloadSounds();
    const timer = setTimeout(() => playSound('ready'), 120);
    return () => clearTimeout(timer);
  }, []);
  usePopSounds(plan ? CHIPS_AT : undefined, areaCount, chipStagger);
  usePopSounds(plan ? ROWS_AT : undefined, rowCount, ROW_STAGGER);

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
      <Appear>
        <T variant="kicker">Your plan is ready</T>
      </Appear>
      <Appear delay={110}>
        <T variant="title" style={styles.title} accessibilityRole="header">
          {LEVEL_NAME[plan.level]} · {GOAL_LABEL[plan.goal]}
        </T>
      </Appear>

      <Appear delay={260}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.bodies} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.halo} />
              {VIEWS.map((view, i) => (
                <Appear key={view} kind="pop" delay={400 + i * 110}>
                  <BodyFigure height={FIGURE} view={view} glows={glows} />
                </Appear>
              ))}
            </View>
            <View style={styles.areas}>
              <T variant="kicker" color={colors.faint}>
                Focus areas
              </T>
              <View style={styles.chips}>
                {areas.map((a, i) => (
                  <Appear key={a} kind="pop" delay={CHIPS_AT + i * chipStagger} style={styles.chip}>
                    <T style={styles.chipText}>{AREA_NAMES[a]}</T>
                  </Appear>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={plan.days} delay={STATS_AT} label={plan.days === 7 ? 'every day' : 'days a week'} />
            <Stat value={plan.minutes} delay={STATS_AT + 120} label="min a session" divider />
            <Stat value={plan.days * plan.minutes} delay={STATS_AT + 240} label="min a week" divider />
          </View>
        </View>
      </Appear>

      <View style={styles.weekWrap}>
        <Appear delay={ROWS_AT - 120} style={styles.weekHeader}>
          <T variant="kicker">Your first week</T>
          <T variant="caption">
            {plan.sessions.length} {plan.sessions.length === 1 ? 'session' : 'sessions'}
          </T>
        </Appear>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {firstWeek.map(({ s, date }, i) => {
            const isNext = next?.session.id === s.id;
            const when = isNext ? `${next?.when === 'upcoming' ? 'Next' : 'Today'} · ` : '';
            return (
              <Appear key={s.id} delay={ROWS_AT + i * ROW_STAGGER}>
                <SessionRow
                  session={s}
                  now={now}
                  date={date}
                  meta={`${when}${s.minutes} min · ${s.exerciseIds.length} moves`}
                  highlight={isNext}
                  trailing="bubbles"
                  onPress={isNext ? start : undefined}
                />
              </Appear>
            );
          })}
        </ScrollView>
      </View>

      <Appear delay={BOTTOM_AT}>
        <T variant="caption" center style={styles.safety}>
          Move gently, within a comfortable range.
        </T>
        <PrimaryButton label="Start first session" icon="play" onPress={start} />
        {/* A way out for anyone not starting yet: home, with onboarding cleared from the back stack. */}
        <TextButton label="Go to my home screen" color={colors.muted} onPress={goHome} style={styles.home} />
      </Appear>
    </Screen>
  );
}

/** One of the plan's numbers, counting up into place. */
function Stat({ value, delay, label, divider }: { value: number; delay: number; label: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <CountUp value={value} delay={delay} style={styles.statValue} />
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
