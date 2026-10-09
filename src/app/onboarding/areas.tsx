import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Appear, STAGGER } from '@/components/Appear';
import { AreaChips } from '@/components/AreaChips';
import { BodyMap, ViewToggle } from '@/components/BodyFigure';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { T } from '@/components/T';
import { PrimaryButton, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { AREA_ORDER, VISIBLE } from '@/data/areas';
import type { AreaId, BodyView } from '@/data/types';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useViewport } from '@/lib/viewport';
import { useAppStore } from '@/store/useAppStore';

export default function Areas() {
  const selected = useAppStore((s) => s.draft.areas);
  const setDraft = useAppStore((s) => s.setDraft);
  // The body always opens on the front, every time this screen is shown (coming back to it too).
  const [view, setView] = useState<BodyView>('front');
  useFocusEffect(useCallback(() => setView('front'), []));
  const { height } = useViewport();
  // Leaves room for the wrapped chips under the body.
  const mapHeight = Math.max(220, Math.min(440, height - 490));

  // Load the pops now, so the first one lands in time with the first chip.
  useEffect(() => preloadSounds(), []);

  const toggle = (area: AreaId) => {
    const adding = !selected.includes(area);
    playSound(adding ? 'select' : 'deselect');
    setDraft({ areas: adding ? [...selected, area] : selected.filter((a) => a !== area) });
    // Picking an area from the list turns the body round if it can only be seen from the other side.
    if (adding && !VISIBLE[view].includes(area)) setView(view === 'front' ? 'back' : 'front');
  };

  const count = selected.length;

  // The screen builds itself in order: the question, then the body, then the areas one by one, then the button.
  const CHIPS_AT = 650;
  const BUTTON_AT = CHIPS_AT + AREA_ORDER.length * STAGGER + 150;

  return (
    <Screen>
      <OnboardingHeader step={1} />
      <Appear>
        <T variant="title" style={styles.title}>
          Where do you feel stiff?
        </T>
      </Appear>
      <Appear delay={120}>
        <T variant="body" color={colors.muted} style={styles.sub}>
          Tap the body or pick from the list. Choose as many as you like.
        </T>
      </Appear>
      <Appear delay={260} style={styles.toggle}>
        <ViewToggle view={view} onChange={setView} />
      </Appear>
      <Appear delay={380} style={styles.stage}>
        <BodyMap view={view} selected={selected} onToggle={toggle} height={mapHeight} />
      </Appear>
      <AreaChips selected={selected} onToggle={toggle} introDelay={CHIPS_AT} />
      <Appear delay={BUTTON_AT}>
        <PrimaryButton
          label={count === 0 ? 'Pick at least one area' : `Continue with ${count} ${count === 1 ? 'area' : 'areas'}`}
          disabled={count === 0}
          style={styles.cta}
          onPress={() => {
            playSound('next');
            router.push('/onboarding/goal');
          }}
        />
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20 },
  sub: { marginTop: 8 },
  toggle: { marginTop: 18 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  cta: { marginTop: 18 },
});
