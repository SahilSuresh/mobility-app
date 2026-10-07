import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts, REGION_COLORS } from '@/constants/theme';
import { areasPhrase } from '@/data/areas';
import { getExercise } from '@/data/exercises';
import type { CompletedSession, PlannedSession } from '@/data/types';
import { DAY_LONG, longDate, shortDate } from '@/lib/dates';
import { tap } from '@/lib/haptics';
import { sessionMinutes } from '@/lib/progress';

import { streakHint, streakIcon } from './streak';

type Props = {
  L: LookTokens;
  today: CompletedSession[];
  run: number;
  next: PlannedSession | undefined;
  now: Date;
  /** How many different days you've trained, this one included. */
  dayNumber: number;
};

/** Today's card once you've trained: a dated, stamped summary worth keeping and sharing, plus what's next. */
export function DoneStage({ L, today, run, next, now, dayNumber }: Props) {
  const minutes = today.reduce((t, h) => t + sessionMinutes(h), 0);
  const moves = today.reduce((t, h) => t + h.moves, 0);
  const areas = [...new Set(today.flatMap((h) => h.areas))];
  const nextFirst = next ? getExercise(next.exerciseIds[0]) : undefined;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, !L.dark && styles.cardShadow]}>
        <View style={styles.masthead}>
          <T variant="smallStrong" color={L.muted}>
            {longDate(now)}
          </T>
          <T variant="smallStrong" color={L.accent}>{`Day ${dayNumber}`}</T>
        </View>
        <View style={[styles.rule, { backgroundColor: L.rule }]} />

        {/* The stamp repeats what the text says, so screen readers skip it. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.stamp, { borderColor: L.accent }]}
        >
          <T style={[styles.stampMain, { color: L.accent }]}>DONE</T>
          <T style={[styles.stampDate, { color: L.accent }]}>{shortDate(now).toUpperCase()}</T>
        </View>

        <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
          Done for today.
        </T>
        <T variant="body" color={L.muted} style={styles.summary}>
          {`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${moves} moves for your ${areasPhrase(areas)}.`}
        </T>

        <View accessible style={[styles.streak, { borderColor: L.rule }]}>
          <Icon name={streakIcon(run)} size={24} color={L.accent} strokeWidth={1.8} />
          <View style={styles.flex}>
            <T style={[styles.streakValue, { color: L.ink }]}>{`${run} day streak`}</T>
            <T variant="caption" color={L.muted}>
              {streakHint(run)}
            </T>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tap();
            router.push('/share');
          }}
          style={({ pressed }) => [styles.share, { borderColor: L.accent }, pressed && { opacity: 0.85 }]}
        >
          <Icon name="share" size={17} color={L.accent} strokeWidth={2} />
          <T variant="bodyStrong" color={L.accent}>
            Share today&apos;s card
          </T>
        </Pressable>
      </View>

      <View accessible style={[styles.next, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
        {next ? (
          <>
            <PoseBubble pose={nextFirst?.pose ?? 'reach'} size={48} color={nextFirst ? REGION_COLORS[nextFirst.area] : REGION_COLORS.lowerBack} dot={false} />
            <View style={styles.flex}>
              <T variant="bodyStrong" color={L.ink} numberOfLines={1}>
                {next.title}
              </T>
              <T variant="caption" color={L.muted}>{`Next up on ${DAY_LONG[next.weekday]}, ${next.minutes} minutes`}</T>
            </View>
          </>
        ) : (
          <T variant="body" color={L.ink}>
            That&apos;s the whole week. See you on Monday.
          </T>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginTop: 16 },
  card: {
    padding: 24,
    borderWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 12,
  },
  cardShadow: { boxShadow: '0px 1px 2px rgba(40,50,30,0.06), 0px 22px 40px -24px rgba(31,90,62,0.45)' },
  masthead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rule: { marginTop: 10, height: StyleSheet.hairlineWidth },
  stamp: {
    position: 'absolute',
    top: 54,
    right: 18,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.85,
  },
  stampMain: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 2.4 },
  stampDate: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 },
  title: { marginTop: 18, marginRight: 84, fontFamily: fonts.serif, fontSize: 36, lineHeight: 42 },
  summary: { marginTop: 6, marginRight: 60 },
  streak: { marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakValue: { fontFamily: fonts.bold, fontSize: 16 },
  share: { marginTop: 16, height: 52, borderRadius: 26, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  next: { marginTop: 12, padding: 14, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
