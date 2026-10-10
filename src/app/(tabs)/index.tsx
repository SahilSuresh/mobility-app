import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { Icon } from '@/components/Icon';
import { PremiumNudge } from '@/components/PremiumNudge';
import { T } from '@/components/T';
import { Categories } from '@/components/today/Categories';
import { ProgrammeCards } from '@/components/today/ProgrammeCards';
import { SessionCard } from '@/components/today/SessionCard';
import { TimeOfDay } from '@/components/today/TimeOfDay';
import { streakIcon } from '@/components/today/streak';
import { Screen } from '@/components/ui';
import { LOOKS } from '@/constants/looks';
import { fonts, shadows } from '@/constants/theme';
import { DAY_LONG, longDate } from '@/lib/dates';
import { nextSession, nextWeekSession, streak } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

/**
 * Training first. Quick routines for the time of day lead; then today's session, built on the body (today's planned
 * areas come chosen, tap to change them, pick a length, Start); then a quick free session or a programme.
 */
export default function Today() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const choice = useLook((s) => s.choice);
  const now = useNow();
  const L = LOOKS[resolveLook(choice, now)];
  if (!plan) return null;

  const next = nextSession(plan, history, now);
  const session = next?.session ?? null;
  const upNext = session ? null : nextWeekSession(plan, now);
  const run = streak(plan, history, now);
  const kicker = !session
    ? 'Build your session'
    : next?.when === 'upcoming'
      ? `Next session, ${DAY_LONG[session.weekday]}`
      : next?.when === 'catchup'
        ? `Catch-up from ${DAY_LONG[session.weekday]}`
        : "Today's session";
  const hint = upNext ? `Week done. Your plan picks up on ${longDate(upNext.date)}. Tap areas to select or deselect.` : 'Tap areas to select or deselect.';

  return (
    <Screen
      scroll
      tabBar
      backdrop={L.background ? <LinearGradient colors={L.background} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} /> : undefined}
    >
      {/* The page builds in once, top to bottom, as the tab first opens. */}
      <Appear style={styles.header}>
        <View style={styles.flex}>
          <T variant="small" color={L.muted}>
            {longDate(now)}
          </T>
          <T style={[styles.pageTitle, { color: L.ink }]} accessibilityRole="header">
            Today
          </T>
        </View>
        <View
          accessible
          accessibilityLabel={`${run} day streak`}
          style={[styles.streak, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, L.dark && styles.flat]}
        >
          <Icon name={streakIcon(run)} size={17} color={L.accent} strokeWidth={1.9} />
          <T style={[styles.streakText, { color: L.accent }]}>{`${run} ${run === 1 ? 'day' : 'days'}`}</T>
        </View>
      </Appear>

      <Appear delay={100}>
        <TimeOfDay L={L} />
      </Appear>

      <Appear delay={200}>
        {/* A new session starts the card fresh: its planned areas and length chosen again. */}
        <SessionCard key={session?.id ?? 'build'} L={L} session={session} kicker={kicker} hint={hint} />
      </Appear>
      <Appear delay={300}>
        <Categories L={L} />
      </Appear>
      <Appear delay={380}>
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
  pageTitle: { marginTop: 2, fontFamily: fonts.serif, fontSize: 40, lineHeight: 46 },
  streak: { height: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, boxShadow: shadows.small },
  streakText: { fontFamily: fonts.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
});
