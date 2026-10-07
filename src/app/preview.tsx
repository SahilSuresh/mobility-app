import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { colors, fonts, REGION_COLORS, tint } from '@/constants/theme';
import { AREA_NAMES, sortAreas } from '@/data/areas';
import { EQUIPMENT_LABEL, getExercise } from '@/data/exercises';
import type { Exercise } from '@/data/types';
import { goBack } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { HOLD, holdFor, moveTime, restSeconds } from '@/lib/holds';
import { findSession, useAppStore } from '@/store/useAppStore';

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Every move in a session before it starts, with a timer on each to make the hold longer or shorter.
 * Your times are remembered for that move from then on. Every way of starting a session comes through here.
 */
export default function SessionPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAppStore((s) => findSession(s, id));
  const holds = useAppStore((s) => s.holds);
  const readySeconds = useAppStore((s) => restSeconds(s.readySeconds));
  const setHold = useAppStore((s) => s.setHold);
  if (!session) return <Redirect href="/" />;

  const all = session.exerciseIds.map((m) => getExercise(m)).filter((e): e is Exercise => !!e);
  // Each move once, in the order it first comes up, with how many rounds it's done.
  const moves = all.filter((e, i) => all.findIndex((x) => x.id === e.id) === i);
  const rounds = (e: Exercise) => all.filter((x) => x.id === e.id).length;
  const totalSeconds = all.reduce((t, e) => t + moveTime(e, holds) + readySeconds, 0);
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const changed = moves.filter((e) => holds[e.id] !== undefined);
  const equipment = [...new Set(all.map((e) => e.equipment))].filter((q) => q !== 'none');

  const adjust = (e: Exercise, by: number) => {
    const next = Math.min(HOLD.max, Math.max(HOLD.min, holdFor(e, holds) + by));
    tap();
    // Back at the default, the move simply uses its default again.
    setHold(e.id, next === e.seconds ? null : next);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" label="Close" onPress={() => goBack()} />
      </View>

      <T variant="kicker" style={styles.kicker}>
        {`${moves.length} moves`}
      </T>
      <T variant="title" accessibilityRole="header">
        {session.title}
      </T>
      <View style={styles.facts}>
        <Fact icon="clock" label={`${totalMinutes} min`} strong />
        {equipment.length ? equipment.map((q) => <Fact key={q} icon={q} label={EQUIPMENT_LABEL[q]} />) : <Fact icon="person" label="No equipment" />}
        <Fact icon="target" label={sortAreas(session.areas).map((a) => AREA_NAMES[a]).join(', ')} />
      </View>

      <View style={styles.listHeader}>
        <T variant="smallStrong" color={colors.muted}>
          Use − and + to change a hold
        </T>
        {changed.length ? (
          <TextButton label="Reset times" color={colors.greenText} onPress={() => changed.forEach((e) => setHold(e.id, null))} />
        ) : null}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {moves.map((e, i) => {
          const hold = holdFor(e, holds);
          const custom = holds[e.id] !== undefined;
          const n = rounds(e);
          const detail = [AREA_NAMES[e.area], e.eachSide ? 'each side' : null, n > 1 ? `${n} rounds` : null].filter(Boolean).join(' · ');
          return (
            <View key={e.id} style={[styles.row, i > 0 && styles.rowRule]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${e.name}, how to do it`}
                onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: e.id } })}
                style={({ pressed }) => [styles.move, pressed && styles.pressed]}
              >
                <PoseBubble pose={e.pose} size={48} color={REGION_COLORS[e.area]} dot={false} breathe phase={(i * 0.17) % 1} />
                <View style={styles.moveText}>
                  <T variant="bodyStrong" numberOfLines={1}>
                    {e.name}
                  </T>
                  <T variant="caption" numberOfLines={1}>
                    {detail}
                  </T>
                </View>
              </Pressable>
              <View style={[styles.stepper, custom && styles.stepperCustom]}>
                <StepButton icon="minus" label={`Shorter ${e.name}`} disabled={hold <= HOLD.min} onPress={() => adjust(e, -HOLD.step)} />
                <View style={styles.time} accessibilityLiveRegion="polite" accessibilityLabel={`${hold} seconds${e.eachSide ? ' each side' : ''}`}>
                  <T style={[styles.timeText, custom && styles.timeTextCustom]}>{clock(hold)}</T>
                </View>
                <StepButton icon="plus" label={`Longer ${e.name}`} disabled={hold >= HOLD.max} onPress={() => adjust(e, HOLD.step)} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <T variant="caption" center style={styles.note}>
        Your times are saved for next time. Move gently, within a comfortable range.
      </T>
      <PrimaryButton label={`Start · ${totalMinutes} min`} icon="play" onPress={() => router.replace({ pathname: '/session', params: { id: session.id } })} />
    </Screen>
  );
}

function Fact({ icon, label, strong }: { icon: IconName; label: string; strong?: boolean }) {
  return (
    <View style={[styles.fact, strong && styles.factStrong]}>
      <Icon name={icon} size={14} color={strong ? colors.onGreen : colors.greenText} strokeWidth={2} />
      <T style={[styles.factText, strong && styles.factTextStrong]} numberOfLines={1}>
        {label}
      </T>
    </View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: IconName; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed, disabled && styles.stepDisabled]}
    >
      <Icon name={icon} size={15} color={colors.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { marginTop: 14, marginBottom: 4 },
  facts: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 11, borderRadius: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, maxWidth: '100%' },
  factStrong: { backgroundColor: colors.green, borderColor: colors.green },
  factText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  factTextStrong: { color: colors.onGreen },

  listHeader: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  list: { flex: 1, marginTop: 8, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  listContent: { paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: colors.line },
  move: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  moveText: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },

  stepper: { flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 20, backgroundColor: tint(0.07) },
  stepperCustom: { backgroundColor: colors.greenTint },
  stepButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  stepPressed: { transform: [{ scale: 0.92 }] },
  stepDisabled: { opacity: 0.4 },
  time: { minWidth: 46, alignItems: 'center' },
  timeText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  timeTextCustom: { color: colors.greenDeep },

  note: { marginTop: 12, marginBottom: 12 },
});
