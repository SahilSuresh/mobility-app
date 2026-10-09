import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BodyFigure } from '@/components/BodyFigure';
import { Icon } from '@/components/Icon';
import { MoveThumb } from '@/components/ExerciseArt';
import { Ring } from '@/components/Ring';
import { T } from '@/components/T';
import { Garden } from '@/components/today/Garden';
import { streakIcon } from '@/components/today/streak';
import { Card, IconButton, Screen } from '@/components/ui';
import { LOOKS } from '@/constants/looks';
import { colors, fonts, glass, tint } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { AREA_COVER } from '@/data/art';
import { EXERCISES } from '@/data/exercises';
import type { AreaId, CompletedSession } from '@/data/types';
import { relativeDay } from '@/lib/dates';
import { areaCounts, minutesOf, plannedDone, sessionMinutes, streak, thisWeek, weeklyTarget, weeksOnTarget } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

/** The move whose picture stands for a past session: its first move, or for older records one with the same pose. */
function sessionCover(h: CompletedSession): string {
  return h.firstMove ?? EXERCISES.find((e) => e.pose === h.firstPose)?.id ?? (h.areas[0] ? AREA_COVER[h.areas[0]] : 'lb-child');
}

export default function ProgressTab() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const isPremium = useAppStore((s) => s.isPremium);
  const choice = useLook((s) => s.choice);
  const now = useNow();
  if (!plan) return null;
  const L = LOOKS[resolveLook(choice, now)];

  const week = thisWeek(history, now);
  const counts = areaCounts(history);
  const shown = counts.length ? counts : plan.areas.map((area) => ({ area, count: 0 }));
  const max = Math.max(1, ...shown.map((c) => c.count));
  const run = streak(plan, history, now);
  const glows = Object.fromEntries(shown.filter((c) => c.count > 0).map((c) => [c.area, 0.4 + 0.6 * (c.count / max)])) as Partial<Record<AreaId, number>>;

  return (
    <Screen scroll tabBar>
      <View style={styles.header}>
        <T variant="title">Progress</T>
        <IconButton icon="share" label="Share your week" onPress={() => router.push('/share')} />
      </View>

      <Card big style={styles.weekCard}>
        <Ring size={92} stroke={9} progress={plannedDone(plan, history, now) / Math.max(1, weeklyTarget(plan, now))}>
          <T variant="h2">{`${plannedDone(plan, history, now)}/${weeklyTarget(plan, now)}`}</T>
        </Ring>
        <View>
          <T variant="kicker">This week</T>
          <T variant="stat" style={styles.minutes}>{`${minutesOf(week)} min`}</T>
          <T variant="small">{`${plannedDone(plan, history, now)} of ${weeklyTarget(plan, now)} sessions`}</T>
        </View>
      </Card>

      <View style={styles.tiles}>
        <Card style={styles.tile}>
          <View style={styles.tileValue}>
            {/* The same seed, sprout or plant as the streak on Today. */}
            <Icon name={streakIcon(run)} size={18} color={colors.green} strokeWidth={1.9} />
            <T variant="stat">{String(run)}</T>
          </View>
          <T variant="caption" style={{ fontSize: 12 }}>
            Day streak
          </T>
        </Card>
        <Card style={styles.tile}>
          <View style={styles.tileValue}>
            <Icon name="check" size={17} color={colors.green} strokeWidth={2.2} />
            <T variant="stat">{String(history.length)}</T>
          </View>
          <T variant="caption" style={{ fontSize: 12 }}>
            Sessions
          </T>
        </Card>
        <Card style={styles.tile}>
          <View style={styles.tileValue}>
            <Icon name="target" size={17} color={colors.green} strokeWidth={2} />
            <T variant="stat">{String(weeksOnTarget(plan, history, now))}</T>
          </View>
          <T variant="caption" style={{ fontSize: 12 }}>
            Weeks on target
          </T>
        </Card>
      </View>

      {/* The garden lives here, with the rest of "how am I doing": each area grows with training. */}
      <Garden L={L} areas={plan.areas} history={history} now={now} />

      <T variant="kicker" style={styles.section}>
        Recent
      </T>
      <View style={styles.recent}>
        {history.length === 0 ? (
          <View style={styles.recentRow}>
            <MoveThumb id="lb-child" size={44} />
            <T variant="small" style={styles.flex}>
              Your sessions will show here. Rest is part of it too.
            </T>
          </View>
        ) : (
          history.slice(0, 3).map((h) => (
            <View key={h.id} style={styles.recentRow}>
              <MoveThumb id={sessionCover(h)} size={40} />
              <View style={styles.flex}>
                <T variant="bodyStrong" numberOfLines={1} style={{ fontSize: 15 }}>
                  {h.title}
                </T>
                <T variant="caption">{relativeDay(h.date, now)}</T>
              </View>
              <T variant="smallStrong">{`${sessionMinutes(h)} min`}</T>
            </View>
          ))
        )}
      </View>

      <Card style={styles.areasCard} onPress={isPremium ? undefined : () => router.push('/premium')} accessibilityLabel="Areas trained">
        <View style={styles.areasTop}>
          <T variant="kicker">Areas trained</T>
          {isPremium ? null : (
            <View style={styles.lockChip}>
              <Icon name="lock" size={10} color={colors.ink} strokeWidth={2.8} />
              <T style={styles.lockText}>Premium</T>
            </View>
          )}
        </View>
        <View style={[styles.areasBody, !isPremium && { opacity: 0.55 }]}>
          <BodyFigure height={84} glows={glows} />
          <View style={styles.bars}>
            {shown.slice(0, 4).map((c) => (
              <View key={c.area} style={styles.barRow}>
                <T variant="smallStrong" style={styles.barLabel}>
                  {AREA_NAMES[c.area]}
                </T>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(c.count / max) * 100}%` }]} />
                </View>
                <T variant="caption" style={styles.barValue}>
                  {String(c.count)}
                </T>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  weekCard: { marginTop: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 20, borderRadius: 28 },
  minutes: { marginTop: 4, fontSize: 32, lineHeight: 36 },
  tiles: { marginTop: 12, flexDirection: 'row', gap: 10 },
  tile: { flex: 1, height: 84, padding: 14, borderRadius: 20, justifyContent: 'space-between' },
  tileValue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  section: { marginTop: 26 },
  recent: { marginTop: 10, gap: 8 },
  recentRow: {
    height: 60,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: glass,
    borderWidth: 1,
    borderColor: tint(0.10),
  },
  areasCard: { marginTop: 16, padding: 18, gap: 12 },
  areasTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockChip: { height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: tint(0.08), flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  areasBody: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  bars: { flex: 1, gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 82, fontSize: 13 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: tint(0.10), overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.green },
  barValue: { width: 18, textAlign: 'right' },
});
