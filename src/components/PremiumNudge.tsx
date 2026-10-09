import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { accent, colors, fonts } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { PROGRAMMES } from '@/data/content';
import { tap } from '@/lib/haptics';
import { shouldNudge } from '@/lib/nudge';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

import { Appear, STAGGER } from './Appear';
import { MoveThumb } from './ExerciseArt';
import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';
import { T } from './T';
import { PrimaryButton, TextButton } from './ui';

/** How long after Today settles before the pop-up rises, so it never lands on top of the screen opening. */
const DELAY_MS = 1500;

/** Three moves across the body, as a taste of what's inside. */
const PICTURES = ['ub-catcow', 'hip-pigeon', 'lb-child'];

const POINTS: { icon: IconName; label: string }[] = [
  { icon: 'calendar', label: 'Every session of your plan' },
  { icon: 'layers', label: `All ${EXERCISES.length} moves and ${PROGRAMMES.length} programmes` },
  { icon: 'sliders', label: 'Adjusts to how each session felt' },
];

/**
 * A friendly Premium reminder on Today, shown as the app opens or comes back from the background. When it may
 * show (and when it never does, such as for anyone with Premium) is decided in `lib/nudge.ts`. It closes itself
 * the moment Premium turns on, even mid-way.
 */
export function PremiumNudge() {
  const isPremium = useAppStore((s) => s.isPremium);
  const [open, setOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const consider = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          // Checked again at the last moment: Premium may have arrived, or the app gone back to the background.
          const s = useAppStore.getState();
          if (AppState.currentState !== 'active' || !shouldNudge(s, new Date())) return;
          s.noteNudgeShown();
          setOpen(true);
        }, DELAY_MS);
      };
      consider();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') consider();
      });
      return () => {
        if (timer) clearTimeout(timer);
        sub.remove();
      };
    }, []),
  );

  const notNow = () => {
    setOpen(false);
    useAppStore.getState().dismissNudge();
  };

  return (
    <Sheet visible={open && !isPremium} onClose={notNow}>
      <View style={styles.pictures} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {PICTURES.map((id, i) => (
          <Appear key={id} kind="pop" delay={250 + i * STAGGER} style={[styles.picture, i > 0 && styles.overlap, i === 1 && styles.middle]}>
            <MoveThumb id={id} size={i === 1 ? 84 : 68} />
          </Appear>
        ))}
      </View>
      <T variant="title" center style={styles.title}>
        Unlock every session
      </T>
      <T variant="body" color={colors.muted} center style={styles.body}>
        Your plan is built for you. Premium lets you train all of it.
      </T>
      <View style={styles.points}>
        {POINTS.map((p, i) => (
          <Appear key={p.label} delay={450 + i * STAGGER} style={styles.point}>
            <View style={styles.pointIcon}>
              <Icon name={p.icon} size={15} color={colors.greenText} strokeWidth={2.2} />
            </View>
            <T variant="body" style={styles.pointText}>
              {p.label}
            </T>
          </Appear>
        ))}
      </View>
      <PrimaryButton
        label="See Premium"
        style={styles.cta}
        onPress={() => {
          tap();
          playSound('next');
          setOpen(false);
          router.push('/premium');
        }}
      />
      <TextButton label="Not now" onPress={notNow} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pictures: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  picture: { borderRadius: 50, borderWidth: 3, borderColor: colors.sheet },
  overlap: { marginLeft: -16 },
  middle: { zIndex: 1 },
  title: { marginTop: 16, fontSize: 28, lineHeight: 32 },
  body: { marginTop: 8, alignSelf: 'center', maxWidth: 300 },
  points: { marginTop: 18, gap: 10, alignSelf: 'center' },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: accent(0.12) },
  pointText: { fontFamily: fonts.medium, fontSize: 15 },
  cta: { marginTop: 24 },
});
