import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { Icon } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { PrimaryButton, Screen, SecondaryButton, TextButton } from '@/components/ui';
import { LOOKS, type LookTokens } from '@/constants/looks';
import { colors, fonts, REGION_COLORS, shadows } from '@/constants/theme';
import { ROUTINE_IDEAS } from '@/data/content';
import { getExercise } from '@/data/exercises';
import type { Routine } from '@/data/types';
import { relativeDay } from '@/lib/dates';
import { startSession } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { routineSession } from '@/lib/plan';
import { playSound } from '@/lib/sounds';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { resolveLook, useLook } from '@/store/useLook';

/**
 * Your own routines: build one from any stretch in the library, save it, and start it whenever you like.
 * Ideas give an empty tab somewhere to begin.
 */
export default function RoutinesTab() {
  const routines = useAppStore((s) => s.routines);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const startCustom = useAppStore((s) => s.startCustom);
  const choice = useLook((s) => s.choice);
  const now = useNow();
  const L = LOOKS[resolveLook(choice, now)];
  const [menu, setMenu] = useState<Routine | null>(null);
  const [confirming, setConfirming] = useState(false);
  const flat = L.dark && styles.flat;

  const build = (params?: { id?: string; idea?: string }) => {
    tap();
    playSound('next');
    router.push({ pathname: '/routine-builder', params });
  };
  const start = (routine: Routine) => {
    const session = routineSession(routine);
    if (session.exerciseIds.length === 0) return;
    startCustom(session);
    startSession(session.id);
  };
  const closeMenu = () => {
    setMenu(null);
    setConfirming(false);
  };

  return (
    <Screen scroll tabBar backdrop={L.background ? <LinearGradient colors={L.background} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} /> : undefined}>
      {/* Builds in once as the tab first opens: the title, the build card, your routines one by one, then ideas. */}
      <Appear>
        <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
          Your routines
        </T>
      </Appear>
      <Appear delay={80}>
        <T variant="body" color={L.muted} style={styles.sub}>
          Your own sessions, from 50+ stretches.
        </T>
      </Appear>

      <Appear kind="pop" delay={160}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Build a routine"
          accessibilityHint="Pick stretches, set the order and save it"
          onPress={() => build()}
          style={({ pressed }) => [styles.create, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, flat, pressed && styles.pressed]}
        >
          <View style={[styles.plus, { backgroundColor: L.button.bg }]}>
            <Icon name="plus" size={22} color={L.button.text} strokeWidth={2.6} />
          </View>
          <View style={styles.flex}>
            <T style={[styles.createTitle, { color: L.ink }]}>Build a routine</T>
            <T variant="caption" color={L.muted}>
              Pick stretches and set the order.
            </T>
          </View>
          <Icon name="chevron" size={18} color={L.muted} strokeWidth={2.2} />
        </Pressable>
      </Appear>

      {routines.length > 0 ? (
        <>
          <Appear delay={220} style={styles.sectionHeader}>
            <T style={[styles.heading, { color: L.ink }]}>Saved</T>
            <T variant="body" color={L.muted}>
              {routines.length}
            </T>
          </Appear>
          {routines.map((r, i) => (
            <Appear key={r.id} delay={280 + Math.min(i, 6) * 70}>
              <RoutineCard L={L} routine={r} now={now} onStart={() => start(r)} onMenu={() => setMenu(r)} />
            </Appear>
          ))}
        </>
      ) : null}

      <Appear delay={routines.length ? 360 + Math.min(routines.length, 6) * 70 : 240} style={styles.sectionHeader}>
        <T style={[styles.heading, { color: L.ink }]}>{routines.length ? 'More ideas' : 'Start from an idea'}</T>
      </Appear>
      <T variant="caption" color={L.muted} style={styles.ideasSub}>
        Tap one to build from it.
      </T>
      <View style={styles.ideas}>
        {ROUTINE_IDEAS.map((idea, i) => (
          <Appear key={idea.id} kind="pop" delay={(routines.length ? 420 + Math.min(routines.length, 6) * 70 : 300) + i * 80} style={styles.ideaCell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${idea.name}: ${idea.line}. Opens the builder`}
              onPress={() => build({ idea: idea.id })}
              style={({ pressed }) => [styles.idea, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, flat, pressed && styles.pressed]}
            >
              <Bubbles ids={idea.moves} size={28} max={3} />
              <T style={[styles.ideaName, { color: L.ink }]} numberOfLines={1}>
                {idea.name}
              </T>
              <T variant="caption" color={L.muted} numberOfLines={2}>
                {idea.line}
              </T>
            </Pressable>
          </Appear>
        ))}
      </View>

      <Sheet visible={menu !== null} onClose={closeMenu}>
        {menu ? (
          <>
            <T variant="title" center style={styles.sheetTitle}>
              {menu.name}
            </T>
            <T variant="body" color={colors.muted} center style={styles.sheetBody}>
              {summary(menu)}
            </T>
            <PrimaryButton
              label="Edit routine"
              style={styles.sheetCta}
              onPress={() => {
                const id = menu.id;
                closeMenu();
                build({ id });
              }}
            />
            {confirming ? (
              <SecondaryButton
                label={`Yes, delete ${menu.name}`}
                style={styles.sheetSecond}
                onPress={() => {
                  playSound('deselect');
                  deleteRoutine(menu.id);
                  closeMenu();
                }}
              />
            ) : (
              <TextButton label="Delete routine" color={colors.flameText} style={styles.sheetSecond} onPress={() => setConfirming(true)} />
            )}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

/** "6 moves · 8 min · twice through" */
function summary(r: Routine): string {
  const session = routineSession(r);
  const moves = r.moves.length;
  const rounds = r.rounds === 2 ? ' · twice through' : r.rounds === 3 ? ' · 3 times through' : '';
  return `${moves} ${moves === 1 ? 'move' : 'moves'} · ${session.minutes} min${rounds}`;
}

/** One saved routine: its first moves as overlapping drawings, the name, how long, when you last did it, and Start. */
function RoutineCard({ L, routine: r, now, onStart, onMenu }: { L: LookTokens; routine: Routine; now: Date; onStart: () => void; onMenu: () => void }) {
  // "Last done today", "Last done on Wednesday", "Last done on 2 Oct".
  const day = r.lastDone ? relativeDay(r.lastDone, now) : null;
  const last = !day ? 'Not done yet' : `Last done ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : `on ${day}`}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.name}, ${summary(r)}. ${last}. Starts the routine`}
      onPress={onStart}
      onLongPress={onMenu}
      style={({ pressed }) => [styles.card, { borderColor: L.chip.border }, L.dark && styles.flat, pressed && styles.pressed]}
    >
      <LinearGradient colors={L.dark ? [L.heroBase, L.background?.[1] ?? L.heroBase] : [L.heroBase, L.heroBase]} style={StyleSheet.absoluteFill} />
      <View style={styles.cardTop}>
        <Bubbles ids={r.moves} size={40} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit or delete ${r.name}`} hitSlop={10} onPress={onMenu} style={[styles.more, { borderColor: L.chip.border }]}>
          <T style={[styles.moreDots, { color: L.muted }]}>•••</T>
        </Pressable>
      </View>
      <T style={[styles.cardTitle, { color: L.ink }]} numberOfLines={1}>
        {r.name}
      </T>
      <View style={styles.cardBottom}>
        <View style={styles.flex}>
          <T variant="caption" color={L.muted}>
            {summary(r)}
          </T>
          <T variant="caption" color={r.lastDone ? L.accent : L.faint} style={styles.last}>
            {last}
          </T>
        </View>
        <View style={[styles.start, { backgroundColor: L.button.bg }]}>
          <Icon name="play" size={11} color={L.button.text} />
          <T style={[styles.startText, { color: L.button.text }]}>Start</T>
        </View>
      </View>
    </Pressable>
  );
}

/** The first few moves as small overlapping drawings, with "+3" when there are more. */
function Bubbles({ ids, size, max = 4 }: { ids: string[]; size: number; max?: number }) {
  const unique = [...new Set(ids)];
  const shown = unique.slice(0, max).map((id) => getExercise(id)).filter((e) => !!e);
  const more = unique.length - shown.length;
  return (
    <View style={styles.bubbles} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {shown.map((e, i) => (
        <PoseBubble key={e.id} pose={e.pose} size={size} color={REGION_COLORS[e.area]} dot={false} outline style={i > 0 ? { marginLeft: -size * 0.28 } : undefined} />
      ))}
      {more > 0 ? <T style={[styles.more2, { fontSize: size * 0.32 }]}>{`+${more}`}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flat: { boxShadow: 'none' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  sub: { marginTop: 4 },

  create: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, borderWidth: 1, boxShadow: shadows.small },
  plus: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  createTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },

  sectionHeader: { marginTop: 30, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },

  card: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
    borderBottomLeftRadius: 12,
    overflow: 'hidden',
    boxShadow: shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { width: 36, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moreDots: { fontSize: 10, letterSpacing: 1, lineHeight: 14 },
  cardTitle: { marginTop: 12, fontFamily: fonts.serif, fontSize: 21, lineHeight: 27 },
  cardBottom: { marginTop: 4, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  last: { marginTop: 2, fontFamily: fonts.semibold },
  start: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 16, borderRadius: 18 },
  startText: { fontFamily: fonts.semibold, fontSize: 14 },

  ideasSub: { marginTop: 4 },
  ideas: { marginTop: 12, flexDirection: 'row', gap: 10 },
  ideaCell: { flex: 1 },
  idea: { flex: 1, padding: 12, gap: 6, borderRadius: 18, borderWidth: 1, minHeight: 120 },
  ideaName: { marginTop: 4, fontFamily: fonts.semibold, fontSize: 14.5, lineHeight: 19 },

  bubbles: { flexDirection: 'row', alignItems: 'center' },
  more2: { marginLeft: 6, fontFamily: fonts.semibold, color: colors.muted },

  sheetTitle: { marginTop: 22, fontSize: 28, lineHeight: 32 },
  sheetBody: { marginTop: 8 },
  sheetCta: { marginTop: 22 },
  sheetSecond: { marginTop: 10 },
});
