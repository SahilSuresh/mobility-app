import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BodyMap, ViewToggle } from '@/components/BodyFigure';
import { Icon } from '@/components/Icon';
import { MoveThumb } from '@/components/ExerciseArt';
import { T } from '@/components/T';
import { SecondaryButton } from '@/components/ui';
import type { LookTokens } from '@/constants/looks';
import { fonts, SCREEN_PADDING } from '@/constants/theme';
import { AREA_NAMES, AREA_ORDER, areasPhrase } from '@/data/areas';
import { AREA_COVER } from '@/data/art';
import type { AreaId, BodyView, PlannedSession } from '@/data/types';
import { alpha } from '@/lib/color';
import { startSession } from '@/lib/flow';
import { playSound } from '@/lib/sounds';
import { plantFor } from '@/lib/garden';
import { tap } from '@/lib/haptics';
import { AREA_MINUTES, makeAreaSession, makeAreasSession } from '@/lib/plan';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';

import { CARD, Section } from './Section';

/** Card width: about two and a half fit on a phone, so the next one peeks in and says "swipe for more". */
const BLOCK_WIDTH = 140;

/**
 * When you last trained this part: "Not trained yet", "Trained today", "Trained yesterday", "Trained 6 days ago".
 * It says why a card is where it is in the row; the card itself is always a fresh session at the time picked above.
 */
function lastLabel(days: number | null): string {
  if (days === null) return 'Not trained yet';
  if (days === 0) return 'Trained today';
  return days === 1 ? 'Trained yesterday' : `Trained ${days} days ago`;
}

type BlockProps = {
  L: LookTokens;
  area: AreaId;
  /** For your plan's areas: how long since you trained it. */
  reason: string | null;
  /** True when it's been a while, so the reason is worth noticing. */
  due: boolean;
  minutes: number;
  moves: number;
  onStart: (area: AreaId) => void;
};

/** One body part: a real move for it, its name, what the chosen time gives you, and (for your areas) how long it's been. */
function Block({ L, area, reason, due, minutes, moves, onStart }: BlockProps) {
  const openMoves = () => router.push({ pathname: '/area/[id]', params: { id: area } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Train ${AREA_NAMES[area]} for ${minutes} minutes, ${moves} moves${reason ? `. ${reason}` : ''}`}
      accessibilityHint="Starts straight away. Long press to see every move."
      accessibilityActions={[{ name: 'activate' }, { name: 'moves', label: 'See every move' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'moves') openMoves();
        else onStart(area);
      }}
      onPress={() => onStart(area)}
      onLongPress={() => {
        tap();
        openMoves();
      }}
      style={({ pressed }) => [styles.block, { backgroundColor: L.chip.bg, borderColor: L.chip.border }, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <MoveThumb id={AREA_COVER[area]} size={48} />
        {/* Tapping starts this part at the chosen time, so the card carries a play button. */}
        <View style={[styles.play, { backgroundColor: alpha(L.accent, L.dark ? 0.16 : 0.1) }]}>
          <Icon name="play" size={12} color={L.accent} />
        </View>
      </View>
      <T variant="bodyStrong" color={L.ink} numberOfLines={1} style={styles.name}>
        {AREA_NAMES[area]}
      </T>
      <T variant="caption" color={L.muted} numberOfLines={1}>{`${minutes} min, ${moves} moves`}</T>
      {reason ? (
        <View style={styles.reason}>
          {due ? <View style={[styles.dot, { backgroundColor: L.accent }]} /> : null}
          <T style={[styles.reasonText, { color: due ? L.accent : L.muted }]} numberOfLines={1}>
            {reason}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Train any body part, fast. Choose how long first (remembered between visits), then tap a part to start.
 * Your plan's areas lead, the ones you've left longest first, each saying why. Or switch to the body
 * map and tap where you feel it.
 */
export function BodyPartGrid({ L, planAreas }: { L: LookTokens; planAreas: AreaId[] }) {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const areaLevels = useAppStore((s) => s.areaLevels);
  const minutes = useAppStore((s) => s.areaMinutes);
  const setMinutes = useAppStore((s) => s.setAreaMinutes);
  const startCustom = useAppStore((s) => s.startCustom);
  const now = useNow();
  // The list leads, every time Today opens; the body map is one switch away.
  const [mode, setMode] = useState<'row' | 'body'>('row');
  useFocusEffect(useCallback(() => setMode('row'), []));
  const [view, setView] = useState<BodyView>('front');
  // Every part chosen on the body map; one session trains them all.
  const [picked, setPicked] = useState<AreaId[]>([]);
  if (!plan) return null;

  // Your areas first, the one you've left longest at the front (never trained counts as longest); then the rest.
  const since = (a: AreaId) => plantFor(a, history, now).days;
  const mine = AREA_ORDER.filter((a) => planAreas.includes(a)).sort((a, b) => (since(b) ?? Infinity) - (since(a) ?? Infinity));
  const others = AREA_ORDER.filter((a) => !planAreas.includes(a));
  const sessionFor = (area: AreaId) => makeAreaSession(area, minutes, plan, areaLevels);

  const begin = (s: PlannedSession) => {
    tap();
    startCustom(s);
    startSession(s.id);
  };
  const start = (area: AreaId) => begin(sessionFor(area));
  // The body map's choice: one session across every chosen part, at the chosen time.
  const mix = picked.length > 0 ? makeAreasSession(picked, minutes, plan, areaLevels) : null;
  const toggle = (area: AreaId) => {
    playSound(picked.includes(area) ? 'deselect' : 'select');
    setPicked((p) => (p.includes(area) ? p.filter((a) => a !== area) : [...p, area]));
  };

  return (
    <Section
      L={L}
      title="Train by body part"
      // The row explains itself; the body map needs one line saying how it works.
      sub={mode === 'body' ? 'Tap every part you want to train, then start.' : undefined}
      aside={
        <View style={[styles.switch, { borderColor: L.chip.border }]} accessibilityRole="tablist">
          {(['row', 'body'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              accessibilityLabel={m === 'row' ? 'Show as a list' : 'Show on the body'}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => {
                tap();
                if (mode !== m) playSound('select');
                setMode(m);
              }}
              style={[styles.switchOption, mode === m && { backgroundColor: alpha(L.accent, L.dark ? 0.18 : 0.12) }]}
            >
              <T style={[styles.switchText, { color: mode === m ? L.accent : L.muted }]}>{m === 'row' ? 'List' : 'Body'}</T>
            </Pressable>
          ))}
        </View>
      }
    >
      {/* Time first: one choice here, then a single tap on a part starts it. */}
      <View style={styles.times} accessibilityRole="radiogroup" accessibilityLabel="How long">
        {AREA_MINUTES.map((m) => {
          const on = minutes === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${m} minutes`}
              onPress={() => {
                tap();
                if (!on) playSound('select');
                setMinutes(m);
              }}
              style={[styles.time, { borderColor: on ? L.accent : L.chip.border, backgroundColor: on ? L.chip.onBg : L.chip.bg }]}
            >
              <T style={[styles.timeNumber, { color: on ? L.chip.onText : L.ink }]}>{String(m)}</T>
              <T style={[styles.timeUnit, { color: on ? L.chip.onText : L.muted }]}>min</T>
            </Pressable>
          );
        })}
      </View>

      {mode === 'row' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // Snap to each card so swiping always lands cleanly, never half-way between two.
          snapToInterval={BLOCK_WIDTH + CARD.gap}
          snapToAlignment="start"
          decelerationRate="fast"
          style={styles.bleed}
          contentContainerStyle={styles.row}
        >
          {[...mine, ...others].map((area) => {
            const days = planAreas.includes(area) ? since(area) : undefined;
            return (
              <Block
                key={area}
                L={L}
                area={area}
                reason={days === undefined ? null : lastLabel(days)}
                due={days !== undefined && (days === null || days >= 4)}
                minutes={minutes}
                moves={sessionFor(area).exerciseIds.length}
                onStart={start}
              />
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.body}>
          <ViewToggle view={view} onChange={setView} />
          <BodyMap view={view} selected={picked} onToggle={toggle} height={320} />
          {mix ? (
            <>
              {/* What you've built: the parts, and what the chosen time gives you across them. */}
              <View style={styles.summary} accessibilityLiveRegion="polite">
                <T variant="bodyStrong" color={L.ink} style={styles.flex} numberOfLines={2}>
                  {areasPhrase(picked).replace(/^./, (c) => c.toUpperCase())}
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear chosen parts"
                  hitSlop={10}
                  onPress={() => {
                    playSound('deselect');
                    setPicked([]);
                  }}
                >
                  <T variant="smallStrong" color={L.accent}>
                    Clear
                  </T>
                </Pressable>
              </View>
              <T variant="caption" color={L.muted} style={styles.summaryMeta}>
                {`${minutes} min, ${mix.exerciseIds.length} moves${picked.length > 1 ? ', alternating between them' : ''}`}
              </T>
              {/* Secondary, so it never competes with the main Start button fixed at the bottom. */}
              <SecondaryButton label={`Train · ${minutes} min`} icon="play" onPress={() => begin(mix)} style={styles.bodyStart} />
            </>
          ) : (
            <T variant="body" color={L.muted}>
              Tap one or more parts of the body.
            </T>
          )}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  switch: { marginLeft: 'auto', flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 2 },
  switchOption: { height: 28, paddingHorizontal: 12, borderRadius: 14, justifyContent: 'center' },
  switchText: { fontFamily: fonts.semibold, fontSize: 13 },
  times: { flexDirection: 'row', gap: 8 },
  time: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: 12, gap: 3 },
  timeNumber: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 24, fontVariant: ['lining-nums', 'tabular-nums'] },
  timeUnit: { fontFamily: fonts.semibold, fontSize: 12 },
  // The row runs to the screen edges, with the first card lined up with the page.
  bleed: { marginTop: 14, marginHorizontal: -SCREEN_PADDING },
  row: { paddingHorizontal: SCREEN_PADDING, gap: CARD.gap },
  // One fixed height for every card, so the row stays even whether or not a card carries a reason.
  block: { width: BLOCK_WIDTH, height: 158, padding: 14, borderWidth: 1, borderRadius: CARD.tileRadius },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  play: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  name: { marginTop: 12 },
  reason: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  reasonText: { fontFamily: fonts.semibold, fontSize: 12 },
  body: { marginTop: 16, alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  summary: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryMeta: { alignSelf: 'stretch', marginTop: -8 },
  bodyStart: { alignSelf: 'stretch' },
});
