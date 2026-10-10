import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MoveThumb } from '@/components/ExerciseArt';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { CATEGORIES, type Category } from '@/data/categories';
import { getExercise } from '@/data/exercises';
import type { Exercise } from '@/data/types';
import { tap } from '@/lib/haptics';
import { restSeconds, sessionMinutes } from '@/lib/holds';
import { categorySession } from '@/lib/plan';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

import { CARD, Section } from './Section';

/** The categories two to a row, so the grid stays even. */
const ROWS = CATEGORIES.reduce<Category[][]>((rows, c, i) => (i % 2 ? [...rows.slice(0, -1), [...rows[rows.length - 1], c]] : [...rows, [c]]), []);

/**
 * Training by category: a session for what you're doing (a workout, a run) or what you're after (posture,
 * flexibility), free for everyone. One tap starts it; each tile shows its picture, its name and how long it takes.
 */
export function Categories({ L }: { L: LookTokens }) {
  const startCustom = useAppStore((s) => s.startCustom);
  const holds = useAppStore((s) => s.holds);
  const readySeconds = useAppStore((s) => restSeconds(s.readySeconds));

  const start = (category: Category) => {
    tap();
    playSound('next');
    const session = categorySession(category);
    startCustom(session);
    // Free for everyone, so straight to the preview, not through startSession and its paywall.
    router.push({ pathname: '/preview', params: { id: session.id } });
  };

  return (
    <Section
      L={L}
      title="Train by category"
      sub="A session for what you're doing today."
      aside={
        <View style={[styles.free, { borderColor: L.accent }]}>
          <T style={[styles.freeText, { color: L.accent }]}>Free</T>
        </View>
      }
    >
      <View style={styles.grid}>
        {ROWS.map((row) => (
          <View key={row[0].id} style={styles.row}>
            {row.map((c) => {
              const moves = categorySession(c).exerciseIds.map((id) => getExercise(id)).filter((e): e is Exercise => !!e);
              // Your own holds and rest, so the tile shows the same time as the session it opens.
              const minutes = sessionMinutes(moves, holds, readySeconds);
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${minutes} minutes, ${moves.length} moves, free. ${c.line}`}
                  accessibilityHint="Starts this session"
                  onPress={() => start(c)}
                  style={({ pressed }) => [styles.tile, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, pressed && styles.pressed]}
                >
                  <MoveThumb id={c.cover} size={44} />
                  <View style={styles.words}>
                    <T style={[styles.name, { color: L.ink }]} numberOfLines={1}>
                      {c.name}
                    </T>
                    <T variant="caption" color={L.muted} numberOfLines={1}>
                      {`${minutes} min · ${moves.length} moves`}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  free: { height: 22, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, justifyContent: 'center' },
  freeText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  grid: { gap: CARD.gap },
  row: { flexDirection: 'row', gap: CARD.gap },
  tile: {
    flex: 1,
    minHeight: 72,
    padding: 12,
    borderWidth: 1,
    borderRadius: CARD.tileRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  words: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19 },
  pressed: { opacity: 0.8 },
});
