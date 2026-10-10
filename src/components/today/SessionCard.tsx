import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';

import { BodyMap } from '@/components/BodyFigure';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { PrimaryButton } from '@/components/ui';
import type { LookTokens } from '@/constants/looks';
import { fonts } from '@/constants/theme';
import { AREA_NAMES, SPOTS, sortAreas, VISIBLE } from '@/data/areas';
import type { AreaId, BodyView, PlannedSession } from '@/data/types';
import { alpha } from '@/lib/color';
import { startSession } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { AREA_MINUTES, makeAreasSession } from '@/lib/plan';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

/** The figure's height in the card. */
const FIGURE = 290;
/**
 * Each length has a name for how it feels, with a small meter that rises with it, so choosing is quicker than
 * reading numbers. The minutes stay underneath. A planned length outside these four shows as "Your plan".
 */
const LENGTHS: Record<number, string> = { 2: 'Breather', 5: 'Loosen', 10: 'Unwind', 15: 'Deep' };
const lengthName = (m: number) => LENGTHS[m] ?? 'Your plan';

/** Callout labels stay at least this far apart, so two never touch. */
const LABEL_GAP = 34;

type Props = {
  L: LookTokens;
  /** Today's planned session, or null when the week's plan is done. */
  session: PlannedSession | null;
  /** The line above everything: "Today's session", "Catch-up from Monday" or "Build a session". */
  kicker: string;
  /** Under the kicker: what to do here (and, when the week is done, when the plan picks up). */
  hint: string;
};

function sameAreas(a: AreaId[], b: AreaId[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * Today's session, built on the body. It opens with today's planned areas already chosen; tap the body to add or
 * take away parts and pick a length. Left as planned, Start runs the planned session (so it counts for the week);
 * changed, it runs a session for exactly what's chosen.
 */
export function SessionCard({ L, session, kicker, hint }: Props) {
  const plan = useAppStore((s) => s.plan);
  const areaLevels = useAppStore((s) => s.areaLevels);
  const voice = useAppStore((s) => s.sounds.voice);
  const remembered = useAppStore((s) => s.areaMinutes);
  const startCustom = useAppStore((s) => s.startCustom);
  // Open on the side that shows today's areas: the back for a back-only session.
  const [view, setView] = useState<BodyView>(() => (session && !session.areas.some((a) => VISIBLE.front.includes(a)) ? 'back' : 'front'));
  const [picked, setPicked] = useState<AreaId[]>(session?.areas ?? []);
  const [minutes, setMinutes] = useState(session?.minutes ?? remembered);
  // The card's width, so the callouts can sit either side of the centred figure.
  const [width, setWidth] = useState(0);
  if (!plan) return null;

  // The planned length is always on offer, even when it isn't one of the usual four.
  const options = (AREA_MINUTES as readonly number[]).includes(minutes) ? [...AREA_MINUTES] : [...AREA_MINUTES.slice(0, 3), minutes];
  const asPlanned = !!session && minutes === session.minutes && sameAreas(picked, session.areas);
  const chosen = sortAreas(picked);
  const level = chosen.length ? Math.max(...chosen.map((a) => areaLevels[a] ?? plan.level)) : plan.level;

  const toggle = (area: AreaId) => {
    playSound(picked.includes(area) ? 'deselect' : 'select');
    setPicked((p) => (p.includes(area) ? p.filter((a) => a !== area) : [...p, area]));
  };
  const start = () => {
    if (!chosen.length) return;
    tap();
    if (asPlanned && session) {
      startSession(session.id);
      return;
    }
    const s = makeAreasSession(chosen, minutes, plan, areaLevels);
    startCustom(s);
    startSession(s.id);
  };

  // Callouts: one per chosen part on this side, alternating left and right down the body, each with a line to its spot.
  const scale = FIGURE / 440;
  const figureLeft = (width - FIGURE / 2) / 2;
  const figureRight = figureLeft + FIGURE / 2;
  const spots = chosen
    .filter((a) => VISIBLE[view].includes(a))
    .map((area) => ({ area, y: SPOTS[view].find(([s]) => s === area)![2] * scale }))
    .sort((a, b) => a.y - b.y)
    .map((c, i) => {
      const left = i % 2 === 0;
      const own = SPOTS[view].filter(([s]) => s === c.area);
      // The spot on the callout's own side of the body, so the line never crosses it.
      const [, x] = own.reduce((m, s) => (left ? (s[1] < m[1] ? s : m) : s[1] > m[1] ? s : m));
      return { ...c, left, x: figureLeft + x * scale };
    });
  const place = (side: boolean) =>
    spots
      .filter((c) => c.left === side)
      .reduce<(typeof spots[number] & { labelY: number })[]>(
        (placed, c) => [...placed, { ...c, labelY: Math.max(c.y, (placed.at(-1)?.labelY ?? -Infinity) + LABEL_GAP) }],
        [],
      );
  const callouts = width ? [...place(true), ...place(false)] : [];

  return (
    <View style={[styles.card, { backgroundColor: L.chip.bg, borderColor: L.chip.border }]}>
      <View style={styles.stageArea}>
        {/* A faint green wash from the top of the card, so the body sits in its own lit space. */}
        <LinearGradient colors={[alpha(L.accent, L.dark ? 0.1 : 0.08), alpha(L.accent, 0)]} style={StyleSheet.absoluteFill} />
        {width ? (
          <Svg width={width + 32} height="100%" style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
            <Defs>
              <RadialGradient id="body-spot" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={L.accent} stopOpacity={L.dark ? 0.2 : 0.16} />
                <Stop offset="1" stopColor={L.accent} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="body-floor" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#000000" stopOpacity={L.dark ? 0.45 : 0.16} />
                <Stop offset="1" stopColor="#000000" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* A soft spotlight behind the figure, and a shadow where it stands, so it isn't floating. */}
            <Ellipse cx={(width + 32) / 2} cy={76 + FIGURE * 0.48} rx={FIGURE * 0.42} ry={FIGURE * 0.5} fill="url(#body-spot)" />
            <Ellipse cx={(width + 32) / 2} cy={76 + FIGURE * 0.985} rx={FIGURE * 0.2} ry={9} fill="url(#body-floor)" />
          </Svg>
        ) : null}
      <View style={styles.head}>
        <View style={styles.flex}>
          <T style={[styles.kicker, { color: L.accent }]}>{(session && !asPlanned ? 'Build your session' : kicker).toUpperCase()}</T>
          <T variant="small" color={L.muted}>
            {hint}
          </T>
        </View>
        <View style={[styles.sides, { borderColor: L.chip.border }]} accessibilityRole="tablist">
          {(['front', 'back'] as const).map((v) => (
            <Pressable
              key={v}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}
              accessibilityLabel={v === 'front' ? 'Show the front of the body' : 'Show the back of the body'}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => {
                tap();
                setView(v);
              }}
              style={[styles.side, view === v && { backgroundColor: L.button.bg }]}
            >
              <T style={[styles.sideText, { color: view === v ? L.button.text : L.muted }]}>{v === 'front' ? 'Front' : 'Back'}</T>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.stage} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <BodyMap view={view} selected={picked} onToggle={toggle} height={FIGURE} />
        {/* The lines sit under the labels and never catch a tap meant for the body. */}
        <Svg width={width || 1} height={FIGURE} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          {callouts.map((c) => (
            <Line
              key={c.area}
              x1={c.x}
              y1={c.y}
              x2={c.left ? figureLeft + 6 : figureRight - 6}
              y2={c.labelY}
              stroke={L.accent}
              strokeWidth={1.2}
              strokeOpacity={0.75}
            />
          ))}
        </Svg>
        {callouts.map((c) => (
          <Pressable
            key={`${c.area}-label`}
            // Screen readers remove parts with the chips below; this is the same action for a finger.
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            hitSlop={8}
            onPress={() => {
              tap();
              toggle(c.area);
            }}
            style={[
              styles.pill,
              { top: c.labelY - 14, borderColor: L.accent, backgroundColor: L.heroBase },
              c.left ? { right: width - figureLeft - 6 } : { left: figureRight - 6 },
            ]}
          >
            <T variant="smallStrong" color={L.ink} numberOfLines={1}>
              {AREA_NAMES[c.area]}
            </T>
          </Pressable>
        ))}
      </View>

        <View style={[styles.divider, { backgroundColor: L.rule }]} />
      </View>

      {/* Everything below the body keeps a fixed size, so choosing parts changes the words, never the layout. */}
      <T style={[styles.title, { color: chosen.length ? L.ink : L.muted }]} numberOfLines={1} accessibilityRole="header" accessibilityLiveRegion="polite">
        {chosen.length === 0 ? 'Nothing selected yet' : `${chosen.length} ${chosen.length === 1 ? 'area' : 'areas'} selected`}
      </T>
      {/* Secondary: the level, and the voice, which is a setting, so it opens Sound & timer. */}
      <View style={styles.meta}>
        <T variant="caption" color={L.muted}>{`Level ${level}`}</T>
        {voice ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice-guided. Change in Sound and timer"
            hitSlop={10}
            onPress={() => {
              tap();
              router.push('/sound-timer');
            }}
            style={styles.voice}
          >
            <Icon name="headphones" size={13} color={L.muted} strokeWidth={2} />
            <T variant="caption" color={L.muted}>
              Voice-guided
            </T>
          </Pressable>
        ) : null}
      </View>
      {/* One row, always there: the chosen parts as removable chips, swiping sideways if there are many. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        {chosen.length ? (
          chosen.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              accessibilityLabel={`${AREA_NAMES[a]}, selected. Tap to remove`}
              onPress={() => {
                tap();
                toggle(a);
              }}
              style={({ pressed }) => [styles.chip, { borderColor: L.chip.border, backgroundColor: L.chip.bg }, pressed && styles.pressed]}
            >
              <Icon name="check" size={13} color={L.accent} strokeWidth={2.6} />
              <T variant="smallStrong" color={L.ink}>
                {AREA_NAMES[a]}
              </T>
              <Icon name="close" size={12} color={L.muted} strokeWidth={2.4} />
            </Pressable>
          ))
        ) : (
          <View style={[styles.chip, styles.placeholder, { borderColor: L.chip.border }]}>
            <T variant="caption" color={L.muted}>
              Your chosen areas show here
            </T>
          </View>
        )}
      </ScrollView>

      <View style={styles.times} accessibilityRole="radiogroup" accessibilityLabel="How long">
        {options.map((m, i) => {
          const on = minutes === m;
          const ink = on ? L.chip.onText : L.ink;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${lengthName(m)}, ${m} minutes`}
              onPress={() => {
                tap();
                if (!on) playSound('select');
                setMinutes(m);
              }}
              style={[styles.time, { borderColor: on ? L.accent : L.chip.border, backgroundColor: on ? L.chip.onBg : 'transparent' }]}
            >
              {/* A meter that rises with the length: one bar for a breather, four for a deep session. */}
              <View style={styles.meter} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {[0, 1, 2, 3].map((b) => (
                  <View
                    key={b}
                    style={[
                      styles.bar,
                      { height: 5 + b * 4, backgroundColor: b <= i ? (on ? L.chip.onText : L.accent) : alpha(on ? L.chip.onText : L.ink, 0.18) },
                    ]}
                  />
                ))}
              </View>
              <T style={[styles.timeName, { color: ink }]} numberOfLines={1}>
                {lengthName(m)}
              </T>
              <T style={[styles.timeUnit, { color: on ? L.chip.onText : L.muted }]}>{`${m} min`}</T>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label={chosen.length ? `Start · ${lengthName(minutes)}, ${minutes} min` : 'Pick an area to start'}
        icon="play"
        disabled={!chosen.length}
        onPress={start}
        style={styles.start}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: 28, padding: 16, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  // The body's lit space runs to the card's edges, with a quiet line under it before the controls.
  stageArea: { marginTop: -16, marginHorizontal: -16, paddingTop: 16, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: -16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kicker: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, marginBottom: 2 },
  sides: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, padding: 3 },
  side: { height: 30, paddingHorizontal: 14, borderRadius: 15, justifyContent: 'center' },
  sideText: { fontFamily: fonts.semibold, fontSize: 13 },
  stage: { marginTop: 12, height: FIGURE, alignItems: 'center' },
  pill: { position: 'absolute', height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
  title: { marginTop: 14, fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  meta: { marginTop: 2, height: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  voice: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipRow: { marginTop: 10, height: 34, flexGrow: 0 },
  chipRowContent: { gap: 8, alignItems: 'center' },
  placeholder: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  chip: { height: 34, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pressed: { opacity: 0.8 },
  times: { marginTop: 16, flexDirection: 'row', gap: 8 },
  time: { flex: 1, height: 78, paddingVertical: 10, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  meter: { height: 17, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, borderRadius: 2 },
  timeName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  timeUnit: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  start: { marginTop: 16 },
});
