import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Appear, usePopSounds } from '@/components/Appear';
import { BodyFigure } from '@/components/BodyFigure';
import { CountUp } from '@/components/CountUp';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, OptionPill, PrimaryButton, Screen } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { accent, colors, fonts, NATIVE_DRIVER, shadows } from '@/constants/theme';
import { AREA_NAMES, sortAreas } from '@/data/areas';
import type { AreaId, CompletedSession, Feedback } from '@/data/types';
import { continueFirstRun } from '@/lib/flow';
import { chimesOn, playSound, preloadSounds } from '@/lib/sounds';
import { plannedDone, sessionMinutes, streak, weekDays, weeklyTarget } from '@/lib/progress';
import { useViewport } from '@/lib/viewport';
import { useAppStore } from '@/store/useAppStore';

const FEELINGS: { id: Feedback; label: string; icon: IconName }[] = [
  { id: 'easy', label: 'Too easy', icon: 'level1' },
  { id: 'right', label: 'Just right', icon: 'level2' },
  { id: 'hard', label: 'Too hard', icon: 'level3' },
];

// After the tick and the burst, the page builds in: the message, the areas, the numbers counting up, this week,
// then the question with its answers popping in one by one, and Continue.
const TITLE_AT = 250;
const CHIPS_AT = 420;
const CHIP_STAGGER = 60;
const TILES_AT = 650;
const TILE_STAGGER = 90;
const WEEK_AT = TILES_AT + 3 * TILE_STAGGER + 60;
const ASK_AT = WEEK_AT + 160;
const FEEL_AT = ASK_AT + 80;
const BUTTON_AT = FEEL_AT + 3 * 70 + 120;

const CHEERS = ['Nice work!', 'Well done!', 'Great session!', 'Good stuff!', 'Lovely work!'];

/** Pieces that burst out from the tick: angle (degrees), distance, size, colour. */
const BURST = Array.from({ length: 16 }, (_, i) => ({
  angle: i * 22.5 + (i % 2 ? 8 : -4),
  distance: 62 + (i % 3) * 22,
  size: 6 + (i % 3) * 2,
  color: [colors.green, colors.mint, '#D9BE93', '#93A9BC'][i % 4],
  square: i % 3 === 1,
}));

/** The congratulations, picked from what this session means: a first, a full week, a streak, or a plain well done. */
function message(record: CompletedSession, total: number, weekCount: number, target: number, run: number): { title: string; body: string } {
  if (total === 1) return { title: 'First session done!', body: "You've started. That's the hardest part." };
  if (weekCount === target) return { title: 'Week complete!', body: `All ${target} sessions done this week. That's how it sticks.` };
  if (run >= 2) return { title: `${run}-day streak!`, body: "You're building a habit. Keep it going." };
  const cheer = CHEERS[[...record.id].reduce((n, c) => n + c.charCodeAt(0), 0) % CHEERS.length];
  const left = target - weekCount;
  return { title: cheer, body: left > 0 ? `${left} more ${left === 1 ? 'session' : 'sessions'} to hit this week's target.` : 'Your body will thank you.' };
}

export default function Complete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useAppStore((s) => s.history.find((h) => h.id === id));
  const history = useAppStore((s) => s.history);
  const plan = useAppStore((s) => s.plan);
  const isPremium = useAppStore((s) => s.isPremium);
  const setFeedback = useAppStore((s) => s.setFeedback);
  const compact = useViewport().height < 760;
  const reduceMotion = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [burst] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(burst, { toValue: 1, duration: 1100, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [pop, burst, reduceMotion]);

  // The warm "ready" chord as the tick pops, when the session chimes are on.
  useEffect(() => {
    preloadSounds();
    if (!chimesOn()) return;
    const timer = setTimeout(() => playSound('ready'), 120);
    return () => clearTimeout(timer);
  }, []);
  usePopSounds(record ? CHIPS_AT : undefined, record?.areas.length ?? 0, CHIP_STAGGER);

  if (!record || !plan) return <Redirect href="/" />;

  const now = new Date();
  const figure = compact ? 132 : 158;
  // The halo is a circle just big enough to frame both figures, and the hero is sized to hold it.
  const halo = Math.round(figure * 1.25);
  const weekCount = plannedDone(plan, history, now);
  const target = weeklyTarget(plan, now);
  const run = streak(plan, history, now);
  const minutes = sessionMinutes(record);
  const areas = sortAreas(record.areas);
  const glows = Object.fromEntries(areas.map((a) => [a, 1])) as Partial<Record<AreaId, number>>;
  const { title, body } = message(record, history.length, weekCount, target, run);
  const adjusting = record.feedback === 'easy' || record.feedback === 'hard';

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton icon="share" label="Share your week" onPress={() => router.push('/share')} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: halo }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.halo, { width: halo, height: halo, borderRadius: halo / 2 }]} />
          <View style={styles.bodies}>
            <BodyFigure height={figure} view="front" glows={glows} />
            <BodyFigure height={figure} view="back" glows={glows} />
          </View>
          <View style={styles.badgeSpot}>
            {BURST.map((p, i) => {
              const a = (p.angle * Math.PI) / 180;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.piece,
                    { width: p.size, height: p.size, borderRadius: p.square ? 2 : p.size / 2, backgroundColor: p.color },
                    {
                      opacity: burst.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 1, 0] }),
                      transform: [
                        { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * p.distance] }) },
                        { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * p.distance + 14] }) },
                        { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.angle}deg`] }) },
                      ],
                    },
                  ]}
                />
              );
            })}
            <Animated.View style={[styles.badge, { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]}>
              <Icon name="check" size={26} color={colors.onGreen} strokeWidth={3.2} />
            </Animated.View>
          </View>
        </View>

        <Appear delay={TITLE_AT}>
          <T variant="title" center style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {title}
          </T>
        </Appear>
        <Appear delay={TITLE_AT + 80}>
          <T variant="body" color={colors.muted} center style={styles.body}>
            {body}
          </T>
        </Appear>
        <View style={styles.areas}>
          {areas.map((a, i) => (
            <Appear key={a} kind="pop" delay={CHIPS_AT + i * CHIP_STAGGER} style={styles.areaChip}>
              <T style={styles.areaText}>{AREA_NAMES[a]}</T>
            </Appear>
          ))}
        </View>

        <View style={styles.tiles}>
          <Tile icon="clock" value={minutes} delay={TILES_AT} label={minutes === 1 ? 'minute' : 'minutes'} />
          <Tile icon="layers" value={record.moves} delay={TILES_AT + TILE_STAGGER} label={record.moves === 1 ? 'move' : 'moves'} />
          <Tile icon="flame" value={run} delay={TILES_AT + 2 * TILE_STAGGER} label="day streak" accent />
        </View>
        <Appear delay={WEEK_AT}>
          <View style={styles.week}>
            <View style={styles.weekHead}>
              <T variant="kicker">This week</T>
              <T variant="smallStrong" color={colors.greenText}>
                {weekCount} of {target} done
              </T>
            </View>
            <WeekStrip days={weekDays(plan, history, now)} size={32} />
          </View>
        </Appear>

        <Appear delay={ASK_AT}>
          <T variant="bodyStrong" center style={styles.question}>
            How did that feel?
          </T>
        </Appear>
        <View style={styles.feel}>
          {FEELINGS.map((f, i) => (
            <Appear key={f.id} kind="pop" delay={FEEL_AT + i * 70} style={styles.feelCell}>
              <OptionPill
                label={f.label}
                icon={f.icon}
                selected={record.feedback === f.id}
                onPress={() => {
                  if (record.feedback !== f.id) playSound('select');
                  setFeedback(record.id, f.id);
                }}
                style={styles.feelOption}
              />
            </Appear>
          ))}
        </View>
        <Appear delay={FEEL_AT + 3 * 70}>
          <T variant="caption" center style={styles.note}>
            {adjusting
              ? isPremium
                ? record.feedback === 'easy'
                  ? 'Got it. Next time steps up a level.'
                  : 'Got it. Next time eases off a level.'
                : 'Premium adjusts your plan to this.'
              : record.feedback === 'right'
                ? 'Great. Your plan stays as it is.'
                : 'Your answer tunes your next sessions.'}
          </T>
        </Appear>
      </ScrollView>

      <Appear kind="pop" delay={BUTTON_AT}>
        <PrimaryButton
          label="Continue"
          onPress={() => {
            playSound('next');
            continueFirstRun('complete');
          }}
        />
      </Appear>
    </Screen>
  );
}

/** One of the session's numbers: the tile pops in, then its number counts up. */
function Tile({ icon, value, delay, label, accent }: { icon: IconName; value: number; delay: number; label: string; accent?: boolean }) {
  return (
    <Appear kind="pop" delay={delay} style={[styles.tile, accent && styles.tileAccent]}>
      <Icon name={icon} size={16} color={accent ? colors.flame : colors.green} strokeWidth={2} />
      <CountUp value={value} delay={delay + 100} duration={600} style={styles.tileValue} />
      <T variant="caption">{label}</T>
    </Appear>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { height: 44, alignItems: 'flex-end' },
  scroll: { paddingTop: 4, paddingBottom: 16 },

  hero: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', alignSelf: 'center', backgroundColor: accent(0.09) },
  bodies: { flexDirection: 'row', gap: 10 },
  badgeSpot: { position: 'absolute', alignSelf: 'center', bottom: -14, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  piece: { position: 'absolute' },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.bgTop,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.green,
  },

  title: { marginTop: 26, fontSize: 34, lineHeight: 38 },
  body: { marginTop: 6, alignSelf: 'center', maxWidth: 320 },
  areas: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  areaChip: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center', backgroundColor: colors.greenTint },
  areaText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.greenDeep },

  tiles: { marginTop: 20, flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tileAccent: { backgroundColor: 'rgba(240,138,69,0.12)' },
  tileValue: { marginTop: 4, fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.ink },

  week: { marginTop: 10, padding: 14, gap: 12, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  question: { marginTop: 22, fontSize: 17 },
  feel: { marginTop: 12, flexDirection: 'row', gap: 8 },
  feelCell: { flex: 1 },
  feelOption: { height: 50, borderRadius: 25, paddingHorizontal: 4, gap: 5 },
  note: { marginTop: 10 },
});
