import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { PremiumSheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { ANSWERS, type Answer } from '@/components/today/answers';
import { DoneStage } from '@/components/today/DoneStage';
import { Garden } from '@/components/today/Garden';
import { LookChip } from '@/components/today/LookChip';
import { SessionHero } from '@/components/today/SessionHero';
import { streakIcon } from '@/components/today/streak';
import { OptionPill, Screen } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { LOOKS } from '@/constants/looks';
import { fonts, REGION_COLORS, shadows } from '@/constants/theme';
import { PROGRAMMES } from '@/data/content';
import { DAY_LONG, dayMonth, isSameDay, partOfDay, weekdayIndex } from '@/lib/dates';
import { startSession } from '@/lib/flow';
import { adjustSession, type CheckIn } from '@/lib/plan';
import { nextSession, streak, thisWeek, weekDays, weeklyTarget } from '@/lib/progress';
import { useCountTo } from '@/lib/useCountTo';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

const CHECK_IN_NOTE: Record<CheckIn, string | null> = {
  good: null,
  sore: 'Gentler moves, same areas',
  short: 'A 5-minute version',
};

export default function Today() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const isPremium = useAppStore((s) => s.isPremium);
  const areaLevels = useAppStore((s) => s.areaLevels);
  const programmeDays = useAppStore((s) => s.programmeDays);
  const startProgramme = useAppStore((s) => s.startProgramme);
  const startCustom = useAppStore((s) => s.startCustom);
  const choice = useLook((s) => s.choice);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [sheet, setSheet] = useState(false);
  const now = useNow();
  const look = resolveLook(choice, now);
  const L = LOOKS[look];


  const checkIn: CheckIn | null = answer === 'sore' || answer === 'short' ? answer : null;
  const next = plan ? nextSession(plan, history, now) : null;
  const planned = next?.session;
  const session = plan && planned && checkIn ? adjustSession(planned, checkIn, plan, areaLevels) : planned;
  const minutes = useCountTo(session?.minutes ?? 0);
  if (!plan) return null;

  const done = thisWeek(history, now).length;
  const days = weekDays(plan, history, now);
  const run = streak(plan, history, now);
  const adjusted = !!session && session !== planned;
  const level = session ? Math.max(...session.areas.map((a) => areaLevels[a] ?? plan.level)) : plan.level;
  const when = !session
    ? ''
    : next?.when === 'upcoming'
      ? `On ${DAY_LONG[session.weekday]}`
      : next?.when === 'catchup'
        ? `Catch-up from ${DAY_LONG[session.weekday]}`
        : 'Today';
  const note = checkIn ? CHECK_IN_NOTE[checkIn] : null;
  const todays = history.filter((h) => isSameDay(new Date(h.date), now));
  const daysShownUp = new Set(history.map((h) => new Date(h.date).toDateString())).size;

  const pick = (key: Answer) => {
    if (answer === key) {
      setAnswer(null);
      return;
    }
    if (key === 'stiff') {
      router.push('/focus');
      return;
    }
    setAnswer(key);
  };

  const start = () => {
    if (!session) return;
    if (!adjusted) {
      startSession(session.id);
      return;
    }
    // Adjusting today's session to how you feel is a Premium feature.
    if (!isPremium) {
      setSheet(true);
      return;
    }
    startCustom(session);
    startSession(session.id);
  };

  const openProgramme = (id: string) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    const s = startProgramme(id);
    if (s) router.push({ pathname: '/preview', params: { id: s.id } });
  };

  return (
    <Screen
      scroll
      tabBar
      backdrop={L.background ? <LinearGradient colors={L.background} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} /> : undefined}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          {/* One line at any width or text size: shrinks a little first, then truncates. */}
          <T variant="title" color={L.ink} style={styles.day} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} accessibilityRole="header">
            {`${DAY_LONG[weekdayIndex(now)]} ${partOfDay(now)}`}
          </T>
          <T variant="body" color={L.muted}>
            {dayMonth(now)}
          </T>
        </View>
        <View style={styles.headerRight}>
          <View
            accessible
            accessibilityLabel={`${run} day streak`}
            style={[styles.streak, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, L.dark && styles.flat]}
          >
            <Icon name={streakIcon(run)} size={17} color={L.accent} strokeWidth={1.9} />
            <T style={[styles.streakText, { color: L.accent }]}>{String(run)}</T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.navigate('/settings')}
            style={[styles.profile, { backgroundColor: L.chip.bg, borderColor: L.accent }, L.dark && styles.flat]}
          >
            <Icon name="user" size={17} color={L.accent} />
          </Pressable>
        </View>
      </View>

      {todays.length > 0 ? (
        // Once you've trained today, show what you did instead of asking again.
        <DoneStage L={L} today={todays} run={run} next={planned} now={now} dayNumber={daysShownUp} />
      ) : (
        <>
          {session ? (
            <>
              <T variant="bodyStrong" color={L.ink} style={styles.ask}>
                How&apos;s your body today?
              </T>
              <View style={styles.chips}>
                {ANSWERS.map((c) =>
                  look === 'current' ? (
                    <OptionPill key={c.key} label={c.label} icon={c.icon} selected={answer === c.key} onPress={() => pick(c.key)} style={styles.chip} />
                  ) : (
                    <LookChip key={c.key} L={L} label={c.label} icon={c.icon} selected={answer === c.key} onPress={() => pick(c.key)} />
                  ),
                )}
              </View>
            </>
          ) : null}

          <SessionHero L={L} session={session} when={when} minutes={minutes} level={level} note={note} onStart={start} />
        </>
      )}

      {/* The session comes first so Start sits in thumb reach; the garden follows and shows what today grew. */}
      <Garden L={L} areas={plan.areas} history={history} now={now} />

      <View style={styles.sectionHead}>
        <T style={[styles.heading, { color: L.ink }]} accessibilityRole="header">
          This week
        </T>
        <T variant="body" color={L.muted} style={styles.tabular}>{`${done} of ${weeklyTarget(plan, now)} done`}</T>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`This week, ${done} of ${weeklyTarget(plan, now)}`} onPress={() => router.navigate('/progress')} style={styles.week}>
        <WeekStrip
          days={days}
          size={36}
          tone={look === 'current' ? undefined : { ink: L.ink, muted: L.faint, done: L.bright, onDone: L.onBright, glow: L.weekGlow }}
        />
      </Pressable>

      <View style={[styles.rule, { backgroundColor: L.rule }]} />

      <View style={styles.sectionHead}>
        <T style={[styles.heading, { color: L.ink }]} accessibilityRole="header">
          Programmes
        </T>
      </View>
      {/* A grid rather than a sideways scroll, so every programme is visible without a hidden gesture. */}
      <View style={styles.programmes}>
        {PROGRAMMES.map((p) => {
          const meta = isPremium && programmeDays[p.id] ? `Day ${Math.min(p.days, programmeDays[p.id] + 1)} of ${p.days}` : p.meta;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}, ${meta}${isPremium ? '' : ', Premium'}`}
              onPress={() => openProgramme(p.id)}
              style={({ pressed }) => [styles.programme, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.programmeTop}>
                <PoseBubble pose={p.pose} size={44} color={REGION_COLORS[p.areas[0]]} dot={false} />
                {isPremium ? null : <Icon name="lock" size={14} color={L.muted} strokeWidth={2.2} />}
              </View>
              <T variant="bodyStrong" color={L.ink} numberOfLines={1}>
                {p.title}
              </T>
              <T variant="caption" color={L.muted} numberOfLines={1}>
                {isPremium ? meta : `${meta}, Premium`}
              </T>
            </Pressable>
          );
        })}
      </View>

      <PremiumSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Adjust today’s session?"
        body="Premium reshapes today’s session to how you feel: gentler when you’re sore, shorter when you’re busy."
        highlight={session?.areas[0]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flat: { boxShadow: 'none' },
  tabular: { fontVariant: ['tabular-nums'] },
  header: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56 },
  day: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streak: { height: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: shadows.small },
  streakText: { fontFamily: fonts.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  profile: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', boxShadow: shadows.small },
  ask: { marginTop: 24 },
  chips: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16 },
  // More space above a heading than below it.
  sectionHead: { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  week: { marginTop: 12 },
  rule: { marginTop: 32, height: StyleSheet.hairlineWidth },
  programmes: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  programme: { flexBasis: '47%', flexGrow: 1, padding: 16, gap: 4, borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomRightRadius: 24, borderBottomLeftRadius: 10 },
  programmeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
});
