import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ArtIcon, MoveThumb } from '@/components/ExerciseArt';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts, SCREEN_PADDING } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { dayPartAt, TIME_STRETCHES, type DayPart, type TimeStretch } from '@/data/timeOfDay';
import type { Exercise } from '@/data/types';
import { alpha } from '@/lib/color';
import { startSession } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { restSeconds, sessionMinutes } from '@/lib/holds';
import { timeOfDaySession } from '@/lib/plan';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';

import { CARD, Section } from './Section';

const ICONS: Record<DayPart, IconName> = { morning: 'sunrise', midday: 'sun', evening: 'feather', night: 'moon' };

/** Wide enough for the name and its line, narrow enough that the next card peeks in to say "swipe". */
const CARD_WIDTH = 264;
/** Move pictures on a card. */
const THUMBS = 5;

/** The day's stretches starting from right now: in the evening, Evening then Before bed, then tomorrow's Morning and Desk break. */
function fromNow(now: Date): TimeStretch[] {
  const at = TIME_STRETCHES.findIndex((t) => t.id === dayPartAt(now));
  return [...TIME_STRETCHES.slice(at), ...TIME_STRETCHES.slice(0, at)];
}

/**
 * Stretches for the time of day as cards to swipe through: morning, a desk break, evening and bedtime.
 * The first card is the one for right now, marked "Now"; the rest follow in the order the day runs.
 */
export function TimeOfDay({ L }: { L: LookTokens }) {
  const startCustom = useAppStore((s) => s.startCustom);
  const holds = useAppStore((s) => s.holds);
  const readySeconds = useAppStore((s) => restSeconds(s.readySeconds));
  const now = useNow();
  const current = dayPartAt(now);

  const start = (stretch: TimeStretch) => {
    tap();
    const session = timeOfDaySession(stretch);
    startCustom(session);
    startSession(session.id);
  };

  return (
    <Section L={L} title="For the time of day" sub="Swipe for morning, midday, evening and bedtime.">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Snap to each card so a swipe always lands on one, never half-way between two.
        snapToInterval={CARD_WIDTH + CARD.gap}
        snapToAlignment="start"
        decelerationRate="fast"
        style={styles.bleed}
        contentContainerStyle={styles.row}
      >
        {fromNow(now).map((stretch) => {
          const on = stretch.id === current;
          const moves = timeOfDaySession(stretch).exerciseIds.map((id) => getExercise(id)).filter((e): e is Exercise => !!e);
          // Your own holds and rest, so the card shows the same time as the preview it opens.
          const detail = `${sessionMinutes(moves, holds, readySeconds)} min, ${moves.length} moves`;
          return (
            <Pressable
              key={stretch.id}
              accessibilityRole="button"
              accessibilityLabel={`${stretch.name}${on ? ', suggested for now' : ''}, ${detail}. ${stretch.line}`}
              accessibilityHint="Starts this session"
              onPress={() => start(stretch)}
              // The one for now uses the accent, like a selected tile elsewhere on Today; the "Now" tag says it in words too.
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: on ? alpha(L.accent, L.dark ? 0.14 : 0.08) : L.chip.bg, borderColor: on ? L.accent : L.chip.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.top}>
                <ArtIcon name={ICONS[stretch.id]} size={44} />
                {on ? (
                  <View style={[styles.now, { backgroundColor: L.button.bg }]}>
                    <T style={[styles.nowText, { color: L.button.text }]}>Now</T>
                  </View>
                ) : null}
              </View>
              <T style={[styles.name, { color: L.ink }]}>{stretch.name}</T>
              <T variant="caption" color={L.muted} style={styles.line}>
                {stretch.line}
              </T>
              <View style={styles.thumbs}>
                {moves.slice(0, THUMBS).map((e) => (
                  <MoveThumb key={e.id} id={e.id} size={30} />
                ))}
              </View>
              <View style={styles.bottom}>
                <T variant="smallStrong" color={on ? L.accent : L.ink}>
                  {detail}
                </T>
                {/* Tapping the card starts it, so it carries a play button like the body-part cards. */}
                <View style={[styles.play, { backgroundColor: alpha(L.accent, L.dark ? 0.16 : 0.1) }]}>
                  <Icon name="play" size={12} color={L.accent} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  // The row runs to the screen edges, with the first card lined up with the page.
  bleed: { marginTop: 14, marginHorizontal: -SCREEN_PADDING },
  row: { paddingHorizontal: SCREEN_PADDING, gap: CARD.gap },
  card: { width: CARD_WIDTH, minHeight: 210, padding: 14, borderRadius: CARD.radius, borderWidth: 1.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  now: { height: 22, paddingHorizontal: 9, borderRadius: 11, justifyContent: 'center' },
  nowText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  name: { marginTop: 12, fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  line: { marginTop: 2 },
  thumbs: { marginTop: 12, flexDirection: 'row', gap: 4 },
  bottom: { marginTop: 'auto', paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  play: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
});
