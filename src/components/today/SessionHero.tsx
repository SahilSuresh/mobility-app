import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { HoldToStart } from '@/components/HoldToStart';
import { Icon } from '@/components/Icon';
import { PoseBubble } from '@/components/PoseBubble';
import { T } from '@/components/T';
import { Card, PrimaryButton } from '@/components/ui';
import type { LookTokens } from '@/constants/looks';
import { fonts, POSE_COLORS, REGION_COLORS } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import type { PlannedSession } from '@/data/types';
import { alpha, mix } from '@/lib/color';
import { tap } from '@/lib/haptics';

/** A soft pool of the region colour behind the hero's move. Still: the start button already breathes. */
function RegionGlow({ color, dark }: { color: string; dark: boolean }) {
  return (
    <View pointerEvents="none" style={styles.blob}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="heroBlob" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={dark ? 0.55 : 0.75} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#heroBlob)" />
      </Svg>
    </View>
  );
}

type Props = {
  L: LookTokens;
  session: PlannedSession | undefined;
  /** When the session is for, at the start of the details line: "Today", "On Thursday", "Catch-up from Monday". */
  when: string;
  /** Shown minutes (animated by the caller). */
  minutes: number;
  level: number;
  note: string | null;
  onStart: () => void;
};

/** Today's session: its name as the headline, what it involves, the moves and the start button, in the look's colours. */
export function SessionHero({ L, session, when, minutes, level, note, onStart }: Props) {
  const moves = session ? [...new Set(session.exerciseIds)] : [];
  const first = session ? getExercise(session.exerciseIds[0]) : undefined;
  const region = REGION_COLORS[first?.area ?? session?.areas[0] ?? 'lowerBack'];

  const content = (
    <>
      <View style={styles.top}>
        <View style={styles.flex}>
          <T style={[styles.title, { color: L.ink }]} accessibilityRole="header">
            {session ? session.title : 'Week complete'}
          </T>
          <T variant="body" color={L.muted} style={styles.details}>
            {session ? `${when}, ${minutes} minutes, ${session.exerciseIds.length} moves at level ${level}` : 'Every session this week is done. Your next plan starts on Monday.'}
          </T>
        </View>
        <PoseBubble pose={first?.pose ?? 'reach'} size={96} color={first ? REGION_COLORS[first.area] : POSE_COLORS[0]} dot={!!session} shadow />
      </View>
      {note ? (
        <View style={styles.note}>
          <Icon name="check" size={13} color={L.accent} strokeWidth={2.6} />
          <T variant="caption" color={L.accent}>
            {note}
          </T>
        </View>
      ) : null}

      {session ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow} contentContainerStyle={styles.preview}>
            {moves.map((id) => {
              const e = getExercise(id);
              if (!e) return null;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={e.name}
                  onPress={() => {
                    tap();
                    router.push({ pathname: '/exercise/[id]', params: { id } });
                  }}
                  hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
                >
                  <PoseBubble pose={e.pose} size={40} color={REGION_COLORS[e.area]} dot={false} outline />
                </Pressable>
              );
            })}
          </ScrollView>
          {L.start === 'hold' ? (
            <HoldToStart label="Hold to start" onStart={onStart} bg={L.button.bg} text={L.button.text} halo={L.button.halo} style={styles.start} />
          ) : (
            <PrimaryButton label="Start session" icon="play" onPress={onStart} style={styles.start} />
          )}
        </>
      ) : null}
    </>
  );

  let hero: ReactNode;
  if (L.hero === 'card') {
    hero = (
      <Card big style={styles.card}>
        {content}
      </Card>
    );
  } else {
    // The hero takes the colour of today's focus area, with a shadow tinted to match.
    hero = (
      <View style={[styles.shadow, { boxShadow: `0px 26px 46px -28px ${alpha(region, L.dark ? 0.6 : 0.95)}` }]}>
        <View style={[styles.region, { borderColor: L.heroBorder, backgroundColor: L.heroBase }]}>
          <LinearGradient colors={[mix(region, L.heroBase, L.heroTint), L.heroBase]} locations={[0, 0.8]} style={StyleSheet.absoluteFill} />
          <RegionGlow color={region} dark={L.dark} />
          {content}
        </View>
      </View>
    );
  }
  return <View style={styles.wrap}>{hero}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginTop: 16 },
  card: { padding: 24 },
  shadow: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomRightRadius: 32, borderBottomLeftRadius: 12 },
  region: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomRightRadius: 32, borderBottomLeftRadius: 12, borderWidth: 1, padding: 24, overflow: 'hidden' },
  blob: { position: 'absolute', top: -70, right: -70, width: 280, height: 280 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  details: { marginTop: 8 },
  note: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewRow: { marginTop: 16, marginHorizontal: -24 },
  // Bubbles sit 4 apart so each one, with its hit slop, is a full 44pt target.
  preview: { paddingHorizontal: 24, gap: 4 },
  start: { marginTop: 24 },
});
