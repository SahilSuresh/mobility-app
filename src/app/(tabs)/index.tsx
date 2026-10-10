import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/Appear';
import { Icon } from '@/components/Icon';
import { PremiumNudge } from '@/components/PremiumNudge';
import { T } from '@/components/T';
import { BodyPartGrid } from '@/components/today/BodyPartGrid';
import { ExerciseGroups } from '@/components/today/ExerciseGroups';
import { ProgrammeCards } from '@/components/today/ProgrammeCards';
import { QuickProgrammes } from '@/components/today/QuickProgrammes';
import { START_BAR_SPACE, StartBar } from '@/components/today/StartBar';
import { TimeOfDay } from '@/components/today/TimeOfDay';
import { streakIcon } from '@/components/today/streak';
import { Screen } from '@/components/ui';
import { LOOKS } from '@/constants/looks';
import { fonts, shadows, TAB_BAR_SPACE } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { getExercise } from '@/data/exercises';
import type { AreaId } from '@/data/types';
import { DAY_LONG, isSameDay, longDate } from '@/lib/dates';
import { startSession } from '@/lib/flow';
import { areaSession } from '@/lib/plan';
import { nextSession, nextWeekSession, streak } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

/**
 * Training first. Stretches for the time of day lead, as cards to swipe through; then today's session (what it is,
 * its areas, Start), then other ways to train: one body part, a quick 2 to 10 minutes, or a programme.
 */
export default function Today() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const areaLevels = useAppStore((s) => s.areaLevels);
  const startCustom = useAppStore((s) => s.startCustom);
  const choice = useLook((s) => s.choice);
  const [chosenArea, setChosenArea] = useState<AreaId | 'all'>('all');
  const insets = useSafeAreaInsets();
  const now = useNow();
  const L = LOOKS[resolveLook(choice, now)];
  // Today stays about training: what you've done is celebrated on Session complete and shown on Progress.
  const trained = history.some((h) => isSameDay(new Date(h.date), now));
  if (!plan) return null;

  const next = nextSession(plan, history, now);
  const session = next?.session;
  const upNext = session ? null : nextWeekSession(plan, now);
  const run = streak(plan, history, now);
  const level = session ? Math.max(...session.areas.map((a) => areaLevels[a] ?? plan.level)) : plan.level;
  const when = !session
    ? ''
    : next?.when === 'upcoming'
      ? `On ${DAY_LONG[session.weekday]}`
      : next?.when === 'catchup'
        ? `Catch-up from ${DAY_LONG[session.weekday]}`
        : 'Today';
  // Training once doesn't hide the rest: whatever's still to do stays here, with Start.
  const showStart = !!session;
  // Checked against the moves themselves: a session can borrow moves from a neighbouring area.
  const focus = session && chosenArea !== 'all' && session.exerciseIds.some((id) => getExercise(id)?.area === chosenArea) ? chosenArea : 'all';
  // Exactly what Start trains: the whole session, or just the chosen area's moves.
  const target = session && focus !== 'all' ? areaSession(session, focus) : session;
  const startLabel = !target ? '' : focus === 'all' ? `${target.minutes} min` : `${AREA_NAMES[focus]}, ${target.minutes} min`;

  const start = () => {
    if (!target) return;
    // The planned session as it is needs nothing extra; one area of it is set up first.
    if (target !== session) startCustom(target);
    startSession(target.id);
  };

  return (
    <Screen
      scroll
      tabBar
      // Room under the list for the fixed Start bar.
      style={showStart ? { paddingBottom: TAB_BAR_SPACE + insets.bottom + START_BAR_SPACE } : undefined}
      backdrop={L.background ? <LinearGradient colors={L.background} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} /> : undefined}
      overlay={showStart ? <StartBar L={L} onStart={start} what={startLabel} /> : null}
    >
      {/* The page builds in once, top to bottom, as the tab first opens. */}
      <Appear style={styles.header}>
        <T variant="bodyStrong" color={L.muted} style={styles.flex}>
          {longDate(now)}
        </T>
        <View
          accessible
          accessibilityLabel={`${run} day streak`}
          style={[styles.streak, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, L.dark && styles.flat]}
        >
          <Icon name={streakIcon(run)} size={17} color={L.accent} strokeWidth={1.9} />
          <T style={[styles.streakText, { color: L.accent }]}>{String(run)}</T>
        </View>
      </Appear>

      <Appear delay={100}>
        <TimeOfDay L={L} />
      </Appear>

      {session ? (
        <>
          <Appear delay={140}>
            <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
              {session.title}
            </T>
          </Appear>
          <Appear delay={200}>
            <T variant="body" color={L.muted} style={styles.details}>
              {`${when}, ${session.minutes} minutes, ${session.exerciseIds.length} moves at level ${level}`}
            </T>
          </Appear>
          <Appear delay={280}>
            <ExerciseGroups L={L} session={session} focus={focus} onFocus={setChosenArea} onStart={start} startLabel={startLabel} />
          </Appear>
        </>
      ) : (
        // Nothing left this week: say so, and when the plan picks up (the Plan tab shows what's next).
        <>
          {trained ? null : (
            <Appear delay={140}>
              <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
                Week complete
              </T>
            </Appear>
          )}
          {upNext && !trained ? (
            <Appear delay={200}>
              <T variant="body" color={L.muted} style={styles.details}>
                {`Your plan picks up on ${longDate(upNext.date)}. See what's next in Plan.`}
              </T>
            </Appear>
          ) : null}
        </>
      )}

      <Appear delay={380}>
        <BodyPartGrid L={L} planAreas={plan.areas} />
      </Appear>
      <Appear delay={460}>
        <QuickProgrammes L={L} />
      </Appear>
      <Appear delay={540}>
        <ProgrammeCards L={L} />
      </Appear>

      {/* Now and then, for anyone without Premium: see lib/nudge.ts for when. */}
      <PremiumNudge />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flat: { boxShadow: 'none' },
  header: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  streak: { height: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: shadows.small },
  streakText: { fontFamily: fonts.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  title: { marginTop: 16, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  details: { marginTop: 6 },
});
