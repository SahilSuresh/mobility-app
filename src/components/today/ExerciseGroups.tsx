import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ArtIcon, ExerciseArt, MoveThumb } from '@/components/ExerciseArt';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { PrimaryButton } from '@/components/ui';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { AREA_COVER } from '@/data/art';
import { getExercise } from '@/data/exercises';
import type { AreaId, Exercise, PlannedSession } from '@/data/types';
import { alpha } from '@/lib/color';
import { tap } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import { minutesForMoves } from '@/lib/plan';

import { CARD } from './Section';

/** The area pictures on the tiles: big enough for the figure to read, small enough for three tiles a row. */
const TILE_ART = 40;

type Move = { exercise: Exercise; order: number };
type Group = { area: AreaId; moves: Move[] };

/** The session's moves gathered by body area, in the order each area first comes up. */
function groupByArea(session: PlannedSession): Group[] {
  const groups = new Map<AreaId, Move[]>();
  session.exerciseIds.forEach((id, i) => {
    const exercise = getExercise(id);
    if (!exercise) return;
    const list = groups.get(exercise.area) ?? [];
    list.push({ exercise, order: i + 1 });
    groups.set(exercise.area, list);
  });
  return [...groups].map(([area, moves]) => ({ area, moves }));
}

/** A group's time, worked out exactly as Start works it out, so the tile and the session always agree. */
function groupTime(moves: Move[]): string {
  return `${minutesForMoves(moves.map((m) => m.exercise.id))} min`;
}

function movesLabel(n: number): string {
  return n === 1 ? '1 move' : `${n} moves`;
}

/** "45 s", "45 s each side" or "1 min 30 s". */
function holdLabel(e: Exercise): string {
  const s = e.seconds;
  const time = s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}` : `${s} s`;
  return e.eachSide ? `${time} each side` : time;
}

function rows<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type TileProps = { L: LookTokens; label: string; detail: string; selected: boolean; onPress: () => void; area?: AreaId };

/** One choice in the area picker: a move picture for the area (or the all-areas icon), its name, and how much of today it is. */
function AreaTile({ L, label, detail, selected, onPress, area }: TileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${detail}`}
      accessibilityHint={area ? 'Shows this area’s moves, and Start trains just these' : 'Shows every move, and Start trains the full session'}
      onPress={() => {
        tap();
        onPress();
      }}
      // Selected uses the accent, the same in every section. The border width never changes, so nothing shifts on tap.
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: selected ? alpha(L.accent, L.dark ? 0.14 : 0.08) : L.chip.bg, borderColor: selected ? L.accent : L.chip.border },
        pressed && styles.pressed,
      ]}
    >
      {area ? <MoveThumb id={AREA_COVER[area]} size={TILE_ART} style={styles.tileArt} /> : <ArtIcon name="layers" size={TILE_ART} style={styles.tileArt} />}
      <T variant="smallStrong" color={L.ink} numberOfLines={1}>
        {label}
      </T>
      <T variant="caption" color={L.muted} numberOfLines={1}>
        {detail}
      </T>
    </Pressable>
  );
}

/** One move in the pop-up: its picture, name, hold time and its place in the session. */
function MoveRow({ L, move: { exercise: e, order }, total, first, onOpen }: { L: LookTokens; move: Move; total: number; first: boolean; onOpen: (id: string) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Move ${order} of ${total}: ${e.name}, ${holdLabel(e)}`}
      accessibilityHint="Opens how to do this move"
      onPress={() => {
        tap();
        onOpen(e.id);
      }}
      style={({ pressed }) => [styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: L.rule }, pressed && styles.pressed]}
    >
      <ExerciseArt exercise={e} size={48} dot={false} />
      <View style={styles.flex}>
        <T variant="bodyStrong" color={L.ink} numberOfLines={2}>
          {e.name}
        </T>
        <View style={styles.meta}>
          <Icon name="clock" size={13} color={L.muted} strokeWidth={2} />
          <T variant="caption" color={L.muted}>
            {holdLabel(e)}
          </T>
        </View>
      </View>
      {/* Its place in the session: areas alternate, so this is the real order you'll do it in. */}
      <View style={[styles.order, { borderColor: L.chip.border }]}>
        <T style={[styles.orderText, { color: L.muted }]}>{String(order)}</T>
      </View>
    </Pressable>
  );
}

/** A heading for one area inside the pop-up, used when all areas are shown together. */
function AreaHeading({ L, group }: { L: LookTokens; group: Group }) {
  return (
    <View style={styles.areaHeading}>
      <MoveThumb id={AREA_COVER[group.area]} size={28} />
      <T variant="smallStrong" color={L.ink} style={styles.flex} accessibilityRole="header">
        {AREA_NAMES[group.area]}
      </T>
      <T variant="caption" color={L.muted}>{`${movesLabel(group.moves.length)}, ${groupTime(group.moves)}`}</T>
    </View>
  );
}

type Props = {
  L: LookTokens;
  session: PlannedSession;
  /** The area chosen, or all of them. Start trains exactly this. */
  focus: AreaId | 'all';
  onFocus: (next: AreaId | 'all') => void;
  /** Starts what's chosen, the same as the Start button at the bottom of Today. */
  onStart: () => void;
  /** What Start trains, for the pop-up's button: "10 min" or "Hips, 2 min". */
  startLabel: string;
};

/**
 * Today's session as a picker of its areas (or all of them). Tapping one opens a pop-up with exactly those
 * moves and a Start button, so the page stays short. Picking an area also sets what Start trains.
 */
export function ExerciseGroups({ L, session, focus, onFocus, onStart, startLabel }: Props) {
  const groups = groupByArea(session);
  const total = session.exerciseIds.length;
  const [open, setOpen] = useState(false);
  const { height } = useWindowDimensions();
  const shown = focus === 'all' ? groups : groups.filter((g) => g.area === focus);
  const chosen = groups.find((g) => g.area === focus);

  const choose = (next: AreaId | 'all') => {
    if (next !== focus) playSound('select');
    onFocus(next);
    setOpen(true);
    const group = groups.find((g) => g.area === next);
    AccessibilityInfo.announceForAccessibility(group ? `${AREA_NAMES[group.area]}, ${movesLabel(group.moves.length)}` : `All ${total} moves`);
  };

  // Close the pop-up before going anywhere, so it never sits on top of the next screen.
  const openMove = (id: string) => {
    setOpen(false);
    router.push({ pathname: '/exercise/[id]', params: { id } });
  };

  const tiles: TileProps[] = [
    { L, label: 'All areas', detail: `${movesLabel(total)}, ${session.minutes} min`, selected: focus === 'all', onPress: () => choose('all') },
    ...groups.map((g) => ({
      L,
      area: g.area,
      label: AREA_NAMES[g.area],
      detail: `${movesLabel(g.moves.length)}, ${groupTime(g.moves)}`,
      selected: focus === g.area,
      onPress: () => choose(g.area),
    })),
  ];

  return (
    // The session's name above is this part's heading, so it needs no title of its own.
    <View style={styles.wrap}>
      {/* Three to a row, so every area fits on screen without a sideways scroll. */}
      <View style={styles.tiles}>
        {rows(tiles, 3).map((row) => (
          <View key={row.map((t) => t.label).join('-')} style={styles.tileRow}>
            {row.map((t) => (
              <AreaTile key={t.label} {...t} />
            ))}
            {Array.from({ length: 3 - row.length }, (_, i) => (
              <View key={`gap-${i}`} style={styles.tileSpacer} />
            ))}
          </View>
        ))}
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.sheetHead}>
          {chosen ? <MoveThumb id={AREA_COVER[chosen.area]} size={56} /> : <ArtIcon name="layers" size={56} />}
          <View style={styles.flex}>
            <T style={[styles.sheetTitle, { color: L.ink }]} accessibilityRole="header">
              {chosen ? AREA_NAMES[chosen.area] : session.title}
            </T>
            <T variant="body" color={L.muted}>
              {chosen ? `${movesLabel(chosen.moves.length)}, ${groupTime(chosen.moves)}` : `${movesLabel(total)}, ${session.minutes} min`}
            </T>
          </View>
        </View>

        {/* Long lists scroll inside the pop-up; Start stays in view below them. */}
        <ScrollView style={{ maxHeight: height * 0.5 }} contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
          {shown.map((g) => (
            <View key={g.area}>
              {chosen ? null : <AreaHeading L={L} group={g} />}
              <View style={[styles.list, { borderColor: L.chip.border }]}>
                {g.moves.map((m, i) => (
                  <MoveRow key={`${m.exercise.id}-${m.order}`} L={L} move={m} total={total} first={i === 0} onOpen={openMove} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <PrimaryButton
          label={`Start · ${startLabel}`}
          icon="play"
          onPress={() => {
            setOpen(false);
            onStart();
          }}
          style={styles.sheetStart}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginTop: 18 },
  tiles: { gap: CARD.gap },
  tileRow: { flexDirection: 'row', gap: CARD.gap },
  tile: { flex: 1, minHeight: 96, padding: 10, borderRadius: CARD.tileRadius, borderWidth: 1.5, gap: 2 },
  // Same padding and border as a tile, so a short last row keeps tiles the same width.
  tileSpacer: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: 'transparent' },
  tileArt: { marginBottom: 6 },
  sheetHead: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 14 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  sheetList: { paddingTop: 16, gap: 14 },
  areaHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  list: { borderWidth: 1, borderRadius: CARD.radius, overflow: 'hidden' },
  row: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  order: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontFamily: fonts.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  sheetStart: { marginTop: 16 },
  pressed: { opacity: 0.75 },
});
