import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ProgrammeList } from '@/components/ProgrammeList';
import { T } from '@/components/T';
import { Screen } from '@/components/ui';
import { LOOKS, type LookTokens } from '@/constants/looks';
import { fonts, shadows } from '@/constants/theme';
import { GOAL_LABEL, LEVEL_NAME } from '@/data/content';
import type { PlannedSession } from '@/data/types';
import { DAY_SHORT, dateOfWeekday, weekdayIndex } from '@/lib/dates';
import { startSession } from '@/lib/flow';
import { doneForPlan, nextSession, scheduledInWeek, weekNumber } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

/** The plan tab, in the same look as Today (it follows the time of day the same way). */
export default function PlanTab() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const choice = useLook((s) => s.choice);
  const now = useNow();
  const L = LOOKS[resolveLook(choice, now)];


  if (!plan) return null;

  const today = weekdayIndex(now);
  const done = doneForPlan(plan, history, now);
  const next = nextSession(plan, history, now);
  const sessions = scheduledInWeek(plan, now);
  // Counted from this week's planned sessions, so the number always matches the ticks below.
  const doneCount = sessions.filter((s) => done.has(s.id)).length;
  const progress = sessions.length ? doneCount / sessions.length : 0;
  const flat = L.dark && styles.flat;

  return (
    <Screen scroll tabBar backdrop={L.background ? <LinearGradient colors={L.background} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} /> : undefined}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
            Your plan
          </T>
          <T variant="body" color={L.muted} style={styles.sub}>
            {LEVEL_NAME[plan.level]} · {GOAL_LABEL[plan.goal]}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit your areas"
          onPress={() => router.push('/edit-areas')}
          hitSlop={8}
          style={({ pressed }) => [styles.pill, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, flat, pressed && styles.pressed]}
        >
          <T variant="smallStrong" color={L.ink}>
            Edit
          </T>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${plan.days} days a week, ${plan.minutes} minutes, ${plan.areas.length} areas. Change your routine`}
        onPress={() => router.push({ pathname: '/onboarding/days', params: { edit: '1' } })}
        style={({ pressed }) => [styles.pill, styles.summary, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, flat, pressed && styles.pressed]}
      >
        <Icon name="calendar" size={14} color={L.accent} strokeWidth={2} />
        <T variant="smallStrong" color={L.ink}>
          {plan.days === 7 ? 'Every day' : `${plan.days} days a week`} · {plan.minutes} min · {plan.areas.length} {plan.areas.length === 1 ? 'area' : 'areas'}
        </T>
        <Icon name="chevron" size={14} color={L.muted} strokeWidth={2.4} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <T style={[styles.heading, { color: L.ink }]}>{`Week ${weekNumber(plan, now)}`}</T>
        <T variant="body" color={L.muted} style={styles.tabular}>
          {doneCount} of {sessions.length} done
        </T>
      </View>
      <View style={[styles.track, { backgroundColor: L.rule }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: L.bright }]} />
      </View>

      <View style={[styles.card, { borderColor: L.chip.border }, flat]}>
        <LinearGradient colors={L.dark ? [L.heroBase, L.background?.[1] ?? L.heroBase] : [L.heroBase, L.heroBase]} style={StyleSheet.absoluteFill} />
        {sessions.map((s, i) => (
          <Row
            key={s.id}
            L={L}
            session={s}
            date={dateOfWeekday(s.weekday, now).getDate()}
            first={i === 0}
            status={done.has(s.id) ? 'done' : next?.session.id === s.id ? 'next' : 'later'}
            label={next?.session.id === s.id ? (s.weekday === today ? 'Today' : next.when === 'upcoming' ? 'Next' : 'Catch up') : undefined}
          />
        ))}
        {sessions.length === 0 ? (
          <T variant="caption" center color={L.muted} style={styles.empty}>
            No sessions planned this week.
          </T>
        ) : null}
      </View>

      <ProgrammeList L={L} />
    </Screen>
  );
}

/** One session in the week list: day and date, name, length, and Start / done / chevron on the right. */
function Row({ L, session: s, date, first, status, label }: { L: LookTokens; session: PlannedSession; date: number; first: boolean; status: 'done' | 'next' | 'later'; label?: string }) {
  const isDone = status === 'done';
  const onPress = isDone ? () => router.push({ pathname: '/exercise/[id]', params: { id: s.exerciseIds[0] } }) : () => startSession(s.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${DAY_SHORT[s.weekday]} ${date}, ${s.title}, ${s.minutes} minutes${isDone ? ', done' : label ? `, ${label}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && { borderTopWidth: 1, borderTopColor: L.rule }, pressed && styles.pressed]}
    >
      <View style={styles.day}>
        <T style={[styles.dayName, { color: status === 'next' ? L.accent : L.faint }]}>{DAY_SHORT[s.weekday]}</T>
        <T style={[styles.dayNum, { color: isDone ? L.faint : L.ink }]}>{String(date)}</T>
      </View>
      <View style={styles.flex}>
        <T style={[styles.rowTitle, { color: isDone ? L.muted : L.ink }]} numberOfLines={1}>
          {s.title}
        </T>
        <T variant="caption" color={L.muted}>
          {label ? <T variant="caption" color={L.accent} style={styles.label}>{`${label} · `}</T> : null}
          {s.minutes} min · {s.exerciseIds.length} moves
        </T>
      </View>
      {isDone ? (
        <View style={[styles.doneMark, { backgroundColor: L.bright }]}>
          <Icon name="check" size={13} color={L.onBright} strokeWidth={3} />
        </View>
      ) : status === 'next' ? (
        <View style={[styles.start, { backgroundColor: L.button.bg }]}>
          <Icon name="play" size={11} color={L.button.text} />
          <T style={[styles.startText, { color: L.button.text }]}>Start</T>
        </View>
      ) : (
        <Icon name="chevron" size={16} color={L.faint} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  sub: { marginTop: 2 },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  tabular: { fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.75 },
  flat: { boxShadow: 'none' },

  pill: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7, boxShadow: shadows.small },
  summary: { marginTop: 16, alignSelf: 'flex-start' },

  sectionHeader: { marginTop: 30, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  track: { marginTop: 10, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },

  // Same shape as the garden card on Today: round, with one tucked-in corner.
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 12,
    overflow: 'hidden',
    boxShadow: shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 70, paddingHorizontal: 18 },
  day: { width: 34, alignItems: 'center' },
  dayName: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.8 },
  dayNum: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 25 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  label: { fontFamily: fonts.semibold },
  doneMark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  start: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 14, borderRadius: 17 },
  startText: { fontFamily: fonts.semibold, fontSize: 13.5 },
  empty: { paddingVertical: 20 },

});
