import { StyleSheet, View } from 'react-native';

import { MoveThumb } from '@/components/ExerciseArt';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import type { PlannedSession } from '@/data/types';
import { longDate } from '@/lib/dates';

import { CARD } from './Section';

/** How many move pictures the card shows before "+N". */
const THUMBS = 6;

/**
 * On the Plan tab once this week's sessions are all done: what's next and when.
 * It's a look ahead, not a Start: that session belongs to next week. Today covers training in the meantime.
 */
export function UpNext({ L, session, date }: { L: LookTokens; session: PlannedSession; date: Date }) {
  const ids = [...new Set(session.exerciseIds)];
  const names = ids.map((id) => getExercise(id)?.name).filter(Boolean);
  const extra = ids.length - THUMBS;
  const when = longDate(date);

  return (
    <View
      accessible
      accessibilityLabel={`Up next, ${when}: ${session.title}, ${session.minutes} minutes, ${session.exerciseIds.length} moves: ${names.join(', ')}`}
      style={[styles.card, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}
    >
      <View style={styles.kicker}>
        <Icon name="calendar" size={14} color={L.accent} strokeWidth={2.2} />
        <T variant="smallStrong" color={L.accent}>
          {`Up next, ${when}`}
        </T>
      </View>
      <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
        {session.title}
      </T>
      <T variant="body" color={L.muted}>
        {`${session.minutes} minutes, ${session.exerciseIds.length} moves`}
      </T>
      <View style={styles.thumbs}>
        {ids.slice(0, THUMBS).map((id) => (
          <MoveThumb key={id} id={id} size={40} />
        ))}
        {extra > 0 ? (
          <View style={[styles.more, { borderColor: L.chip.border }]}>
            <T variant="smallStrong" color={L.muted}>{`+${extra}`}</T>
          </View>
        ) : null}
      </View>
      <T variant="caption" color={L.muted} style={styles.note}>
        Your plan picks up then. Until then, anything on Today is yours to train.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 16, borderRadius: CARD.radius, borderWidth: 1 },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { marginTop: 8, fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  thumbs: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  more: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 12 },
});
