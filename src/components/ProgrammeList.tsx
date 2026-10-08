import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { PROGRAMMES, type Programme } from '@/data/content';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

import { Icon } from './Icon';
import { PoseBubble } from './PoseBubble';
import { T } from './T';

/**
 * The programmes section, shared by Today and Plan so both always look the same: a heading, one line about
 * what programmes are, then one card listing them. Programmes in progress come first, then ones for your areas.
 * Free programmes open for everyone; the rest need Premium.
 */
export function ProgrammeList({ L, hideFree }: { L: LookTokens; /** Leave out the free quick ones (Today shows them on their own). */ hideFree?: boolean }) {
  const plan = useAppStore((s) => s.plan);
  const isPremium = useAppStore((s) => s.isPremium);
  const programmeDays = useAppStore((s) => s.programmeDays);
  const startProgramme = useAppStore((s) => s.startProgramme);

  const inProgress = (done: number, days: number) => Number(done > 0 && done < days);
  const programmes = PROGRAMMES.filter((p) => !(hideFree && p.free))
    .map((p) => ({
      p,
      done: Math.min(p.days, programmeDays[p.id] ?? 0),
      matches: !!plan && p.areas.some((a) => plan.areas.includes(a)),
    }))
    .sort((a, b) => inProgress(b.done, b.p.days) - inProgress(a.done, a.p.days) || Number(b.matches) - Number(a.matches));

  const open = (id: string) => {
    const programme = PROGRAMMES.find((p) => p.id === id);
    if (!isPremium && !programme?.free) {
      router.push('/premium');
      return;
    }
    const s = startProgramme(id);
    if (s) {
      playSound('next');
      router.push({ pathname: '/preview', params: { id: s.id } });
    }
  };

  return (
    <>
      <View style={styles.header}>
        <T style={[styles.heading, { color: L.ink }]} accessibilityRole="header">
          Programmes
        </T>
        {isPremium ? null : (
          <View style={[styles.premium, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
            <Icon name="lock" size={11} color={L.muted} strokeWidth={2.6} />
            <T variant="caption" color={L.muted}>
              Premium
            </T>
          </View>
        )}
      </View>
      <T variant="body" color={L.muted} style={styles.sub}>
        Short daily series for one goal, alongside your plan.
      </T>
      <View style={[styles.card, { borderColor: L.chip.border }, L.dark && styles.flat]}>
        <LinearGradient colors={L.dark ? [L.heroBase, L.background?.[1] ?? L.heroBase] : [L.heroBase, L.heroBase]} style={StyleSheet.absoluteFill} />
        {programmes.map(({ p, done, matches }, i) => (
          <ProgrammeRow key={p.id} L={L} programme={p} done={done} matches={matches} locked={!isPremium && !p.free} first={i === 0} onPress={() => open(p.id)} />
        ))}
      </View>
    </>
  );
}

/** One programme: its drawing, name, length and what it's for, progress once started, and what tapping does. */
function ProgrammeRow({
  L,
  programme: p,
  done,
  matches,
  locked,
  first,
  onPress,
}: {
  L: LookTokens;
  programme: Programme;
  done: number;
  matches: boolean;
  locked: boolean;
  first: boolean;
  onPress: () => void;
}) {
  const started = done > 0;
  const finished = done >= p.days;
  const areas = p.areas.map((a) => AREA_NAMES[a]).join(', ');
  const progress = started ? `, ${finished ? 'complete' : `day ${done + 1} of ${p.days}`}` : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.title}, ${p.days} days, ${p.minutes} minutes a day, ${areas}${progress}${p.free ? ', free' : locked ? ', Premium' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && { borderTopWidth: 1, borderTopColor: L.rule }, pressed && styles.pressed]}
    >
      <PoseBubble pose={p.pose} size={52} color={p.color} dot={false} />
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <T style={[styles.title, { color: L.ink }]} numberOfLines={1}>
            {p.title}
          </T>
          {p.free || (matches && !started) ? (
            <View style={[styles.tag, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
              <T style={[styles.tagText, { color: L.accent }]}>{p.free ? 'Free' : 'For your plan'}</T>
            </View>
          ) : null}
        </View>
        <T variant="caption" color={L.muted} numberOfLines={1}>
          {p.days} days · {p.minutes} min a day
        </T>
        <T variant="caption" color={L.faint} numberOfLines={2} style={styles.areas}>
          {p.about}
        </T>
        {started ? (
          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: L.rule }]}>
              <View style={[styles.fill, { width: `${(done / p.days) * 100}%`, backgroundColor: L.bright }]} />
            </View>
            <T variant="caption" color={L.accent} style={styles.strong}>
              {finished ? 'Complete' : `Day ${done + 1} of ${p.days}`}
            </T>
          </View>
        ) : null}
      </View>
      {locked ? (
        <View style={[styles.lock, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
          <Icon name="lock" size={13} color={L.muted} strokeWidth={2.4} />
        </View>
      ) : started && !finished ? (
        <View style={[styles.action, { backgroundColor: L.button.bg }]}>
          <T style={[styles.actionText, { color: L.button.text }]}>Continue</T>
        </View>
      ) : (
        <View style={[styles.action, styles.ghost, { borderColor: L.accent }]}>
          <T style={[styles.actionText, { color: L.accent }]}>{finished ? 'Again' : 'Start'}</T>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  flat: { boxShadow: 'none' },
  header: { marginTop: 32, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  premium: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 12, borderWidth: 1 },
  sub: { marginTop: 4, fontSize: 15 },
  // Same shape as the garden card on Today: round, with one tucked-in corner.
  // The same card shape as the rest of Today (and Plan): plain 20pt corners, a hairline edge, no heavy shadow.
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 84, paddingVertical: 14, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  tag: { height: 20, paddingHorizontal: 7, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  tagText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  areas: { marginTop: 1 },
  progress: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  strong: { fontFamily: fonts.semibold },
  lock: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 14, borderRadius: 17 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5 },
  actionText: { fontFamily: fonts.semibold, fontSize: 13.5 },
});
