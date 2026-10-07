import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { SessionRow, type RowTrailing } from '@/components/SessionRow';
import { T } from '@/components/T';
import { Card, Chip, Screen } from '@/components/ui';
import { colors, REGION_COLORS, shadows } from '@/constants/theme';
import { areasLabel } from '@/data/areas';
import { LEVEL_NAME, PROGRAMMES } from '@/data/content';
import type { PlannedSession } from '@/data/types';
import { weekdayIndex } from '@/lib/dates';
import { startSession } from '@/lib/flow';
import { doneForPlan, nextSession, scheduledInWeek, thisWeek, weeklyTarget, weekNumber } from '@/lib/progress';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';

export default function PlanTab() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const isPremium = useAppStore((s) => s.isPremium);
  const programmeDays = useAppStore((s) => s.programmeDays);
  const startProgramme = useAppStore((s) => s.startProgramme);
  const now = useNow();
  if (!plan) return null;

  const today = weekdayIndex(now);
  const done = doneForPlan(plan, history, now);
  const next = nextSession(plan, history, now);
  // Sessions need Premium: without it they show a lock, and tapping one opens the paywall.
  const rows: { s: PlannedSession; trailing: RowTrailing; meta: string; onPress: () => void }[] = [];
  for (const s of scheduledInWeek(plan, now)) {
    const moves = `${s.exerciseIds.length} moves`;
    if (done.has(s.id)) {
      rows.push({ s, trailing: 'done', meta: `${s.minutes} min · ${moves}`, onPress: () => router.push({ pathname: '/exercise/[id]', params: { id: s.exerciseIds[0] } }) });
    } else if (!isPremium) {
      rows.push({ s, trailing: 'locked', meta: `${s.minutes} min · ${moves}`, onPress: () => startSession(s.id) });
    } else {
      rows.push({
        s,
        trailing: 'start',
        meta: s.weekday === today ? `Today · ${s.minutes} min` : `${s.minutes} min · ${moves}`,
        onPress: () => startSession(s.id),
      });
    }
  }

  const openProgramme = (id: string) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    const s = startProgramme(id);
    if (s) router.push({ pathname: '/preview', params: { id: s.id } });
  };

  return (
    <Screen scroll tabBar>
      <View style={styles.header}>
        <T variant="title">Your plan</T>
        <Pressable accessibilityRole="button" onPress={() => router.push('/edit-areas')} style={styles.edit}>
          <T variant="smallStrong">Edit</T>
          {isPremium ? null : <Icon name="lock" size={12} color={colors.muted} strokeWidth={2.4} />}
        </Pressable>
      </View>
      <T variant="body" color={colors.muted} style={{ marginTop: 4 }}>
        {areasLabel(plan.areas)}
      </T>
      <View style={styles.chips}>
        <Chip label={LEVEL_NAME[plan.level]} />
        <Chip label={plan.days === 7 ? 'Every day' : `${plan.days} days a week`} />
        <Chip label={`${plan.minutes} min`} />
      </View>

      <View style={styles.sectionHeader}>
        <T variant="kicker">{`Week ${weekNumber(plan, now)}`}</T>
        <T variant="caption">{`${thisWeek(history, now).length} of ${weeklyTarget(plan, now)} done`}</T>
      </View>
      <View style={styles.list}>
        {rows.map(({ s, trailing, meta, onPress }) => (
          <SessionRow key={s.id} session={s} now={now} meta={meta} trailing={trailing} onPress={onPress} highlight={next?.session.id === s.id && trailing === 'start'} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <T variant="kicker">Programmes</T>
        {isPremium ? null : (
          <View style={styles.premium}>
            <Icon name="lock" size={11} color={colors.muted} strokeWidth={2.6} />
            <T variant="caption">Premium</T>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.programmes} contentContainerStyle={styles.programmesContent}>
        {PROGRAMMES.map((p) => {
          const day = Math.min(p.days, (programmeDays[p.id] ?? 0) + 1);
          return (
            <Card key={p.id} style={styles.programme} onPress={() => openProgramme(p.id)} accessibilityLabel={p.title}>
              <PoseBubble pose={p.pose} size={48} color={REGION_COLORS[p.areas[0]]} />
              <View>
                <T variant="bodyStrong" style={{ fontSize: 15 }}>
                  {p.title}
                </T>
                <T variant="caption" style={{ fontSize: 12, marginTop: 1 }}>
                  {isPremium ? `Day ${day} of ${p.days}` : p.meta}
                </T>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  edit: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFBF4',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    boxShadow: shadows.small,
  },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHeader: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { marginTop: 12, gap: 10 },
  premium: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  programmes: { marginTop: 10, marginHorizontal: -24 },
  programmesContent: { paddingHorizontal: 24, paddingBottom: 14, gap: 10 },
  programme: { width: 150, height: 132, padding: 14, justifyContent: 'space-between' },
});
