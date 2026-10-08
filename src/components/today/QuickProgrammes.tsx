import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { PROGRAMMES } from '@/data/content';
import { tap } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

import { CARD, Section } from './Section';

const QUICK = PROGRAMMES.filter((p) => p.free);

/**
 * The free quick programmes, as simply as possible: three buttons, one per length.
 * The time is what people choose by, so it leads; progress shows only once a programme is under way.
 */
export function QuickProgrammes({ L }: { L: LookTokens }) {
  const programmeDays = useAppStore((s) => s.programmeDays);
  const startProgramme = useAppStore((s) => s.startProgramme);

  const open = (id: string) => {
    tap();
    playSound('next');
    const s = startProgramme(id);
    if (s) router.push({ pathname: '/preview', params: { id: s.id } });
  };

  return (
    <Section
      L={L}
      title="Short on time?"
      aside={
        <View style={[styles.free, { borderColor: L.accent }]}>
          <T style={[styles.freeText, { color: L.accent }]}>Free</T>
        </View>
      }
    >
      <View style={styles.row}>
        {QUICK.map((p) => {
          const done = Math.min(p.days, programmeDays[p.id] ?? 0);
          const progress = done === 0 ? null : done >= p.days ? 'Complete' : `Day ${done + 1} of ${p.days}`;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Start ${p.title}, ${p.minutes} minutes, free${progress ? `, ${progress}` : ''}`}
              onPress={() => open(p.id)}
              style={({ pressed }) => [styles.tile, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, pressed && styles.pressed]}
            >
              <View style={styles.time}>
                <Icon name="play" size={11} color={L.accent} />
                <T style={[styles.number, { color: L.ink }]}>{String(p.minutes)}</T>
                <T variant="smallStrong" color={L.muted}>
                  min
                </T>
              </View>
              <T variant="caption" color={progress ? L.accent : L.muted} numberOfLines={1}>
                {progress ?? p.short ?? p.title}
              </T>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  free: { height: 22, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, justifyContent: 'center' },
  freeText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  row: { flexDirection: 'row', gap: CARD.gap },
  tile: { flex: 1, minHeight: 76, paddingVertical: 12, borderWidth: 1, borderRadius: CARD.tileRadius, alignItems: 'center', justifyContent: 'center', gap: 2 },
  time: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  number: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, fontVariant: ['lining-nums', 'tabular-nums'] },
  pressed: { opacity: 0.8 },
});
