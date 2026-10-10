import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { MoveThumb } from '@/components/ExerciseArt';
import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts, NATIVE_DRIVER } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { crescent, SKIES, STARS } from '@/data/sky';
import { dayPartAt, TIME_STRETCHES, type DayPart, type TimeStretch } from '@/data/timeOfDay';
import type { Exercise } from '@/data/types';
import { startSession } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { restSeconds, sessionMinutes } from '@/lib/holds';
import { timeOfDaySession } from '@/lib/plan';
import { useNow } from '@/lib/useNow';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useAppStore } from '@/store/useAppStore';

import { Section } from './Section';

/** How much of the row a card takes: the rest shows the next card peeking in, to say "swipe". */
const CARD_SHARE = 0.86;
const GAP = 12;

/** How far the sun travels along its arc as a card slides one card's width, in degrees. */
const TRAVEL = 34;

/**
 * Quick routines: ready-made sessions for each part of the day, as skies to swipe through, Morning first.
 * Each card is that time of day: its colours, its sun or moon on an arc over the horizon, and the moves laid
 * across the sky in order, like a path to walk. As a card slides, its sun moves along the arc, so swiping
 * feels like time passing. The card in the middle sits full size; the dots below show where you are.
 */
export function TimeOfDay({ L }: { L: LookTokens }) {
  const startCustom = useAppStore((s) => s.startCustom);
  const holds = useAppStore((s) => s.holds);
  const readySeconds = useAppStore((s) => restSeconds(s.readySeconds));
  const now = useNow();
  const current = dayPartAt(now);
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  // How far the row has scrolled, driving each card's size and its sun's journey.
  const [scrollX] = useState(() => new Animated.Value(0));

  const cardWidth = Math.round(width * CARD_SHARE);
  const step = cardWidth + GAP;

  const start = (stretch: TimeStretch) => {
    tap();
    const session = timeOfDaySession(stretch);
    startCustom(session);
    startSession(session.id);
  };

  // Scroll positions where card i is one card left, half way, in the middle, half way, one card right.
  const around = (i: number) => [(i - 1) * step, (i - 0.5) * step, i * step, (i + 0.5) * step, (i + 1) * step];

  return (
    <Section L={L} title="Quick routines" sub="A short routine for every part of the day. Swipe through the sky.">
      <View style={styles.body} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width ? (
          <>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              // One card at a time, landing square in the middle of the swipe.
              snapToInterval={step}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: NATIVE_DRIVER })}
              contentContainerStyle={[styles.row, { paddingRight: width - cardWidth }]}
            >
              {TIME_STRETCHES.map((stretch, i) => {
                const moves = timeOfDaySession(stretch).exerciseIds.map((id) => getExercise(id)).filter((e): e is Exercise => !!e);
                // Your own holds and rest, so the card shows the same time as the preview it opens.
                const minutes = sessionMinutes(moves, holds, readySeconds);
                const on = stretch.id === current;
                const scale = reduceMotion
                  ? 1
                  : scrollX.interpolate({ inputRange: around(i), outputRange: [0.92, 0.96, 1, 0.96, 0.92], extrapolate: 'clamp' });
                return (
                  <Animated.View key={stretch.id} style={{ width: cardWidth, transform: [{ scale }] }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${stretch.name}${on ? ', suggested for now' : ''}, ${minutes} minutes, ${moves.length} moves. ${stretch.line}`}
                      accessibilityHint="Starts this routine"
                      onPress={() => start(stretch)}
                      style={({ pressed }) => [styles.card, { height: cardWidth }, pressed && styles.pressed]}
                    >
                      <SkyCard
                        part={stretch.id}
                        size={cardWidth}
                        ids={moves.map((e) => e.id)}
                        scrollX={scrollX}
                        inputRange={around(i)}
                        still={reduceMotion}
                      />
                      <View style={styles.words}>
                        <View style={styles.kickerRow}>
                          <T style={styles.kicker}>{`${minutes} MIN`}</T>
                          {on ? (
                            <View style={styles.now}>
                              <T style={styles.nowText}>NOW</T>
                            </View>
                          ) : null}
                        </View>
                        <T style={styles.title}>{stretch.name}</T>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
            {/* Where you are: the dot for the card in view stretches out. */}
            <View style={styles.pager} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {TIME_STRETCHES.map((t, i) => (
                <Animated.View
                  key={t.id}
                  style={[
                    styles.page,
                    {
                      backgroundColor: L.accent,
                      opacity: scrollX.interpolate({ inputRange: [(i - 1) * step, i * step, (i + 1) * step], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }),
                      transform: [{ scaleX: scrollX.interpolate({ inputRange: [(i - 1) * step, i * step, (i + 1) * step], outputRange: [1, 3, 1], extrapolate: 'clamp' }) }],
                    },
                  ]}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Section>
  );
}

/**
 * One sky: the gradient, the ground under the horizon, a faint arc for the sun with the sun (or moon) on it,
 * and the moves on an inner dotted arc, first on the left, in the order you'll do them.
 */
function SkyCard({
  part,
  size,
  ids,
  scrollX,
  inputRange,
  still,
}: {
  part: DayPart;
  size: number;
  ids: string[];
  scrollX: Animated.Value;
  inputRange: number[];
  still: boolean;
}) {
  const { sky, angle, moon } = SKIES[part];
  const cx = size / 2;
  const horizon = size * 0.86;
  const outer = size * 0.42;
  const inner = size * 0.3;
  const thumb = Math.round(size * 0.15);
  const sun = size * 0.12;
  const at = (deg: number, r: number) => ({ x: cx + Math.cos((deg * Math.PI) / 180) * r, y: horizon + Math.sin((deg * Math.PI) / 180) * r });

  // The sun's journey: where it sits across the five scroll points, as plain numbers to slide between.
  const path = [-TRAVEL, -TRAVEL / 2, 0, TRAVEL / 2, TRAVEL].map((d) => at(angle + d, outer));
  const sunX = still ? path[2].x - sun : scrollX.interpolate({ inputRange, outputRange: path.map((p) => p.x - sun), extrapolate: 'clamp' });
  const sunY = still ? path[2].y - sun : scrollX.interpolate({ inputRange, outputRange: path.map((p) => p.y - sun), extrapolate: 'clamp' });

  // Moves spread over the top of the inner arc, from the lower left round to the lower right.
  const shown = ids.slice(0, 6);
  const spots = shown.map((_, k) => at(shown.length === 1 ? 270 : 200 + (140 / (shown.length - 1)) * k, inner));
  const arc = (r: number, from: number, to: number) => {
    const a = at(from, r);
    const b = at(to, r);
    return `M${a.x} ${a.y} A${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <LinearGradient colors={sky} style={StyleSheet.absoluteFill} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {moon ? STARS.map(([x, y, r], k) => <Circle key={k} cx={x * size} cy={y * size} r={Math.max(1, r * size)} fill="#FFFFFF" opacity={0.7} />) : null}
        {/* The sun's path, and the moves' path inside it. */}
        <Path d={arc(outer, 180, 360)} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1} fill="none" />
        <Path d={arc(inner, 200, 340)} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.4} strokeDasharray="2 6" strokeLinecap="round" fill="none" />
        {/* The ground: a little darker under the horizon. */}
        <Path d={`M0 ${horizon} H${size} V${size} H0 Z`} fill="#000000" fillOpacity={0.18} />
        <Path d={`M0 ${horizon} H${size}`} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1} />
      </Svg>

      <Animated.View style={[styles.sun, { width: sun * 2, height: sun * 2, transform: [{ translateX: sunX }, { translateY: sunY }] }]}>
        <Svg width={sun * 2} height={sun * 2}>
          <Defs>
            <RadialGradient id={`glow-${part}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={moon ? '#EEF3FF' : '#FFF4D6'} stopOpacity={moon ? 0.35 : 0.6} />
              <Stop offset="1" stopColor={moon ? '#EEF3FF' : '#FFD08A'} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={sun} cy={sun} r={sun} fill={`url(#glow-${part})`} />
          {moon ? (
            // A crescent, drawn as its own shape so it sits cleanly on any part of the sky.
            <Path d={crescent(sun, sun, sun * 0.42)} fill="#F2F5FB" />
          ) : (
            <Circle cx={sun} cy={sun} r={sun * 0.42} fill="#FFE3A3" />
          )}
        </Svg>
      </Animated.View>

      {spots.map((p, k) => (
        <View
          key={`${shown[k]}-${k}`}
          style={[styles.stone, { left: p.x - thumb / 2 - 2, top: p.y - thumb / 2 - 2, width: thumb + 4, height: thumb + 4, borderRadius: (thumb + 4) / 2 }]}
        >
          <MoveThumb id={shown[k]} size={thumb} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: 14 },
  row: { gap: GAP },
  card: { borderRadius: 32, overflow: 'hidden' },
  pressed: { opacity: 0.92 },
  words: { padding: 20 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.8, color: 'rgba(255,255,255,0.78)' },
  now: { height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center' },
  nowText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.8, color: '#FFFFFF' },
  title: { marginTop: 4, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: '#FFFFFF' },
  sun: { position: 'absolute', left: 0, top: 0 },
  stone: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.55)' },
  pager: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 14 },
  page: { width: 6, height: 6, borderRadius: 3 },
});
