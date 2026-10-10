import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MoveThumb } from '@/components/ExerciseArt';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts, SCREEN_PADDING } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { rankProgrammes, type ProgrammePick } from '@/lib/programmes';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

import { CARD, Section } from './Section';

/** Wide enough for a two-line name, narrow enough that the next card peeks in to say "swipe". */
const CARD_WIDTH = 236;
/** Today shows a few; "See all" opens the full list on Plan. */
const SHOWN = 4;

/**
 * Programmes on Today: a short row of the ones worth starting, not the whole catalogue. The one under way leads,
 * then the best fit for your areas (marked "Recommended"); "See all" opens the full list on the Plan tab.
 * Each card says how many days it runs, so it reads as a commitment, not a one-off session.
 */
export function ProgrammeCards({ L }: { L: LookTokens }) {
  const plan = useAppStore((s) => s.plan);
  const isPremium = useAppStore((s) => s.isPremium);
  const programmeDays = useAppStore((s) => s.programmeDays);
  const startProgramme = useAppStore((s) => s.startProgramme);
  const picks = rankProgrammes(plan?.areas ?? [], programmeDays).slice(0, SHOWN);
  // Only the best fit is recommended, and only when nothing is already under way.
  const recommended = picks[0] && picks[0].done === 0 ? picks[0].programme.id : null;

  const open = ({ programme }: ProgrammePick) => {
    tap();
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    const s = startProgramme(programme.id);
    if (s) {
      playSound('next');
      router.push({ pathname: '/preview', params: { id: s.id } });
    }
  };

  return (
    <Section
      L={L}
      title="Programmes"
      sub="A few days in a row for one goal."
      aside={
        <Pressable accessibilityRole="link" accessibilityLabel="See all programmes" hitSlop={12} onPress={() => router.navigate('/plan')} style={styles.seeAll}>
          <T variant="smallStrong" color={L.accent}>
            See all
          </T>
          <Icon name="chevron" size={13} color={L.accent} strokeWidth={2.4} />
        </Pressable>
      }
    >
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
        {picks.map((pick) => {
          const { programme: p, done } = pick;
          const started = done > 0 && done < p.days;
          const finished = done >= p.days;
          const tag = started ? `Day ${done + 1} of ${p.days}` : finished ? 'Complete' : p.id === recommended ? 'Recommended' : null;
          // What tapping does, in words: a programme is a run of days, so the first one is "day 1".
          const action = !isPremium ? 'Unlock with Premium' : started ? `Continue day ${done + 1}` : finished ? 'Do it again' : 'Start day 1';
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}${tag ? `, ${tag}` : ''}, ${p.days} days, ${p.minutes} minutes a day. ${p.about} ${action}`}
              onPress={() => open(pick)}
              style={({ pressed }) => [styles.card, { backgroundColor: L.chip.bg, borderColor: tag === 'Recommended' || started ? L.accent : L.chip.border }, pressed && styles.pressed]}
            >
              <View style={styles.top}>
                <MoveThumb id={p.cover} size={52} />
                {tag ? (
                  <View style={[styles.tag, { backgroundColor: started || tag === 'Recommended' ? L.button.bg : L.chip.bg, borderColor: L.chip.border }]}>
                    <T style={[styles.tagText, { color: started || tag === 'Recommended' ? L.button.text : L.accent }]}>{tag}</T>
                  </View>
                ) : null}
              </View>
              <T style={[styles.title, { color: L.ink }]} numberOfLines={2}>
                {p.title}
              </T>
              {/* The length leads: it's what makes a programme different from a single session. */}
              <T variant="smallStrong" color={L.accent}>
                {`${p.days} days, ${p.minutes} min a day`}
              </T>
              <T variant="small" color={L.muted} style={styles.about}>
                {p.about}
              </T>
              {started ? (
                <View style={[styles.track, { backgroundColor: L.rule }]}>
                  <View style={[styles.fill, { width: `${(done / p.days) * 100}%`, backgroundColor: L.bright }]} />
                </View>
              ) : null}
              <View style={[styles.action, { borderTopColor: L.rule }]}>
                {isPremium ? <Icon name="play" size={11} color={L.accent} /> : <Icon name="lock" size={12} color={L.muted} strokeWidth={2.4} />}
                <T variant="smallStrong" color={isPremium ? L.accent : L.muted}>
                  {action}
                </T>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  // Pushed to the right edge, where a "See all" link usually sits.
  seeAll: { marginLeft: 'auto', minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 2 },
  // The row runs to the screen edges, with the first card lined up with the page.
  bleed: { marginTop: 14, marginHorizontal: -SCREEN_PADDING },
  row: { paddingHorizontal: SCREEN_PADDING, gap: CARD.gap },
  card: { width: CARD_WIDTH, minHeight: 236, padding: 14, borderRadius: CARD.radius, borderWidth: 1.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tag: { height: 22, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, justifyContent: 'center' },
  tagText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  title: { marginTop: 12, fontFamily: fonts.serif, fontSize: 19, lineHeight: 24 },
  about: { marginTop: 4 },
  track: { marginTop: 10, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  action: { marginTop: 'auto', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
