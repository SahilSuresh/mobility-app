import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { T } from '@/components/T';
import type { LookTokens } from '@/constants/looks';
import { fonts, NATIVE_DRIVER, REGION_COLORS } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import type { AreaId, CompletedSession } from '@/data/types';
import { mix } from '@/lib/color';
import { gardenLine, plantFor, plantLabel, type Plant } from '@/lib/garden';
import { success, tap } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/useReduceMotion';

const DROOP: Record<Plant['health'], number> = { fresh: 0, thirsty: 12, wilting: 26 };
const DRY = '#B9A98F';

/** One area's plant, drawn on a 48×76 box with its base at the bottom centre. */
function PlantArt({ plant, L }: { plant: Plant; L: LookTokens }) {
  const region = REGION_COLORS[plant.area];
  const dryness = plant.health === 'fresh' ? 1 : plant.health === 'thirsty' ? 0.6 : 0.3;
  const leaf = mix(mix(region, L.garden.stem, 0.55), DRY, dryness);
  const stem = mix(L.garden.stem, DRY, dryness);
  const { stage } = plant;

  if (stage === 'seed') {
    return (
      <Svg width={48} height={76} viewBox="0 0 48 76">
        <Ellipse cx={24} cy={70} rx={5.5} ry={3.5} fill={mix(L.garden.soil, '#6B5236', 0.45)} />
        <Path d="M24 67c0.5-3 2-5 4.5-6" stroke={stem} strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
    );
  }

  const top = stage === 'sprout' ? 50 : 30;
  return (
    <Svg width={48} height={76} viewBox="0 0 48 76">
      <G transform={`rotate(${DROOP[plant.health]} 24 74)`}>
        <Path d={`M24 74C23.5 64 24.5 ${top + 12} 24 ${top}`} stroke={stem} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <Path d="M24 62C17 61 13.5 56 13.5 51C19.5 51 24 55 24 62Z" fill={leaf} />
        <Path d="M24 58C30.5 57 34.5 52 34.5 47C28.5 47 24 51 24 58Z" fill={leaf} />
        {stage !== 'sprout' ? (
          <>
            <Path d="M24 48C18 47.5 15 43 15 38.5C20 38.5 24 42 24 48Z" fill={leaf} />
            <Path d="M24 42C29.5 41.5 32.5 37.5 32.5 33C27.5 33 24 36.5 24 42Z" fill={leaf} />
          </>
        ) : null}
        {stage === 'bloom' ? (
          <G opacity={plant.health === 'wilting' ? 0.55 : 1}>
            {[0, 72, 144, 216, 288].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return <Circle key={deg} cx={24 + Math.sin(r) * 4.6} cy={26 - Math.cos(r) * 4.6} r={4} fill={mix(region, '#FFFFFF', 0.85)} />;
            })}
            <Circle cx={24} cy={26} r={2.8} fill="#F2C14E" />
          </G>
        ) : null}
      </G>
    </Svg>
  );
}

/** "Today", "Yesterday", "4 days ago" or "Not yet". */
function lastSeen(days: number | null): string {
  if (days === null) return 'Not yet';
  if (days === 0) return 'Today';
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

type Props = { L: LookTokens; areas: AreaId[]; history: CompletedSession[]; now: Date };

/** The day the garden last celebrated, so today's growth plays once rather than on every visit. */
let celebratedOn = '';

/**
 * Your areas as a small garden: each plant grows with how often its area is trained and
 * droops when it goes a while without a stretch. The sun (or moon) moves with the time of day.
 */
export function Garden({ L, areas, history, now }: Props) {
  const plants = areas.map((a) => plantFor(a, history, now));
  const reduceMotion = useReduceMotion();
  const [sway] = useState(() => new Animated.Value(0.5));
  const today = now.toDateString();
  const grewToday = plants.some((p) => p.days === 0);
  const [grow] = useState(() => new Animated.Value(grewToday && celebratedOn !== today ? 0 : 1));

  // The one celebratory moment: the first time you see the garden after training, today's plants grow in.
  useEffect(() => {
    if (!grewToday || celebratedOn === today) return;
    celebratedOn = today;
    if (reduceMotion) {
      grow.setValue(1);
      return;
    }
    grow.setValue(0);
    Animated.timing(grow, { toValue: 1, duration: 900, delay: 250, easing: Easing.out(Easing.exp), useNativeDriver: NATIVE_DRIVER }).start(({ finished }) => {
      if (finished) success();
    });
  }, [grewToday, today, reduceMotion, grow]);

  // One gentle sway shared by every plant; still when the system asks for reduced motion.
  useEffect(() => {
    if (reduceMotion) {
      sway.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(sway, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, sway]);

  // The sun travels a low arc from 5 am to 8 pm; at night a moon sits high on the right.
  const hours = now.getHours() + now.getMinutes() / 60;
  const night = L.dark;
  const t = night ? 0.82 : Math.min(1, Math.max(0, (hours - 5) / 15));
  const sunLeft = `${8 + t * 78}%` as const;
  const sunTop = (1 - Math.sin(Math.PI * t)) * 30;
  const perRow = plants.length <= 5 ? Math.max(plants.length, 3) : Math.ceil(plants.length / 2);

  return (
    <View style={[styles.card, { borderColor: L.chip.border }]}>
      <LinearGradient colors={L.garden.sky} style={StyleSheet.absoluteFill} />

      <View style={styles.head}>
        <View style={styles.flex}>
          <T style={[styles.heading, { color: L.ink }]} accessibilityRole="header">
            Your garden
          </T>
          <T variant="body" color={L.muted} style={styles.line}>
            {gardenLine(plants)}
          </T>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/edit-areas')} hitSlop={{ top: 13, bottom: 13, left: 10, right: 10 }}>
          <T variant="smallStrong" color={L.accent}>
            Edit
          </T>
        </Pressable>
      </View>

      <View style={styles.bed}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.sun, { left: sunLeft, top: sunTop }]}>
          <Svg width={26} height={26} viewBox="0 0 26 26">
            <Circle cx={13} cy={13} r={night ? 9 : 10} fill={L.garden.sun} opacity={night ? 0.9 : 1} />
            {night ? <Circle cx={17} cy={10} r={8} fill={L.garden.sky[0]} /> : null}
          </Svg>
        </View>
        {plants.map((p, i) => (
          <Pressable
            key={p.area}
            accessibilityRole="button"
            accessibilityLabel={`${plantLabel(p)}. Last trained: ${lastSeen(p.days).toLowerCase()}`}
            accessibilityHint="Opens this area"
            onPress={() => {
              tap();
              router.push({ pathname: '/area/[id]', params: { id: p.area } });
            }}
            style={({ pressed }) => [styles.plant, { width: `${100 / perRow}%` }, pressed && styles.pressed]}
          >
            <Animated.View
              style={{
                transformOrigin: 'bottom',
                transform: [
                  { rotate: sway.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? ['1.6deg', '-1.6deg'] : ['-1.6deg', '1.6deg'] }) },
                  ...(p.days === 0 ? [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] : []),
                ],
              }}
            >
              <PlantArt plant={p} L={L} />
            </Animated.View>
            <Svg width={46} height={10} viewBox="0 0 46 10" style={styles.mound}>
              <Ellipse cx={23} cy={5} rx={22} ry={4.5} fill={L.garden.soil} />
            </Svg>
            <T style={[styles.name, { color: L.ink }]} numberOfLines={1}>
              {AREA_NAMES[p.area]}
            </T>
            <T variant="caption" color={p.health === 'fresh' ? L.muted : L.ink} style={styles.when} numberOfLines={1}>
              {p.health === 'fresh' ? lastSeen(p.days) : p.health === 'thirsty' ? 'Thirsty' : 'Wilting'}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginTop: 24,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 12,
    overflow: 'hidden',
  },
  sun: { position: 'absolute', marginLeft: -13 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 4 },
  heading: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  line: { marginTop: 4 },
  bed: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 6 },
  plant: { alignItems: 'center', minHeight: 44, paddingTop: 4 },
  pressed: { opacity: 0.7 },
  mound: { marginTop: -6 },
  name: { marginTop: 4, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17 },
  when: { fontSize: 12, lineHeight: 16 },
});
