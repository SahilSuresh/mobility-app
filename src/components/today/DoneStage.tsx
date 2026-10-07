import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { areasPhrase } from '@/data/areas';
import type { CompletedSession } from '@/data/types';
import { shortDate } from '@/lib/dates';
import { tap } from '@/lib/haptics';
import { sessionMinutes } from '@/lib/progress';

import { CARD } from './Section';
import { streakHint, streakIcon } from './streak';

/** What today's training adds up to: minutes, moves and the areas worked. */
function totals(today: CompletedSession[]) {
  return {
    minutes: today.reduce((t, h) => t + sessionMinutes(h), 0),
    moves: today.reduce((t, h) => t + h.moves, 0),
    areas: [...new Set(today.flatMap((h) => h.areas))],
  };
}

function openShare() {
  tap();
  router.push('/share');
}

type Props = {
  L: LookTokens;
  today: CompletedSession[];
  run: number;
  now: Date;
  /** How many different days you've trained, this one included. */
  dayNumber: number;
  /** True when there's nothing left this week, so the card can say so. */
  weekDone: boolean;
  /** Folds the card away into the slim "Done today" bar. */
  onClose: () => void;
};

/** Today's card once you've trained: a stamped summary worth sharing. It shows briefly, then folds away. */
export function DoneStage({ L, today, run, now, dayNumber, weekDone, onClose }: Props) {
  const { minutes, moves, areas } = totals(today);

  return (
    <View style={[styles.card, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
      <View style={styles.masthead}>
        <T variant="smallStrong" color={L.accent}>{`Day ${dayNumber}`}</T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessibilityHint="Folds this card into a small bar"
          hitSlop={8}
          onPress={() => {
            tap();
            onClose();
          }}
          style={({ pressed }) => [styles.close, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, pressed && styles.pressed]}
        >
          <Icon name="close" size={16} color={L.muted} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* The stamp repeats what the text says, so screen readers skip it. */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.stamp, { borderColor: L.accent }]}>
        <T style={[styles.stampMain, { color: L.accent }]}>DONE</T>
        <T style={[styles.stampDate, { color: L.accent }]}>{shortDate(now).toUpperCase()}</T>
      </View>

      <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
        Done for today.
      </T>
      <T variant="body" color={L.muted} style={styles.summary}>
        {`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${moves} moves for your ${areasPhrase(areas)}.${weekDone ? ' That’s the whole week.' : ''}`}
      </T>

      <View accessible style={[styles.streak, { borderColor: L.rule }]}>
        <Icon name={streakIcon(run)} size={22} color={L.accent} strokeWidth={1.8} />
        <View style={styles.flex}>
          <T style={[styles.streakValue, { color: L.ink }]}>{`${run} day streak`}</T>
          <T variant="caption" color={L.muted}>
            {streakHint(run)}
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Share today's card" hitSlop={10} onPress={openShare} style={styles.shareLink}>
          <Icon name="share" size={16} color={L.accent} strokeWidth={2} />
          <T variant="smallStrong" color={L.accent}>
            Share
          </T>
        </Pressable>
      </View>
    </View>
  );
}

/** The folded card: one slim line saying today is done, with Share. Tap it to see the full card again. */
export function DoneBanner({ L, today, onOpen }: { L: LookTokens; today: CompletedSession[]; onOpen: () => void }) {
  const { minutes, moves } = totals(today);
  // Two buttons side by side (never one inside the other): the bar reopens the card, Share shares it.
  return (
    <View style={[styles.banner, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Done today: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ${moves} moves`}
        accessibilityHint="Shows today's card"
        onPress={() => {
          tap();
          onOpen();
        }}
        style={({ pressed }) => [styles.bannerMain, pressed && styles.pressed]}
      >
        <View style={[styles.badge, { backgroundColor: L.bright }]}>
          <Icon name="check" size={14} color={L.onBright} strokeWidth={2.8} />
        </View>
        <View style={styles.flex}>
          <T variant="bodyStrong" color={L.ink}>
            Done today
          </T>
          <T variant="caption" color={L.muted}>{`${minutes} min, ${moves} moves`}</T>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Share today's card" hitSlop={10} onPress={openShare} style={styles.shareLink}>
        <Icon name="share" size={16} color={L.accent} strokeWidth={2} />
        <T variant="smallStrong" color={L.accent}>
          Share
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  card: { marginTop: 16, padding: 20, borderWidth: 1, borderRadius: CARD.radius },
  masthead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    position: 'absolute',
    top: 64,
    right: 18,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.85,
  },
  stampMain: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 2.4 },
  stampDate: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 },
  title: { marginTop: 10, marginRight: 84, fontFamily: fonts.serif, fontSize: 32, lineHeight: 38 },
  summary: { marginTop: 6, marginRight: 60 },
  streak: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakValue: { fontFamily: fonts.bold, fontSize: 16 },
  shareLink: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 4 },
  banner: { marginTop: 16, minHeight: 60, paddingLeft: 14, paddingRight: 10, borderWidth: 1, borderRadius: CARD.radius, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerMain: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
