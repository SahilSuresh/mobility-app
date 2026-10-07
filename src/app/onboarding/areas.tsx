import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AreaChips } from '@/components/AreaChips';
import { BodyMap, ViewToggle } from '@/components/BodyFigure';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { T } from '@/components/T';
import { PrimaryButton, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { VISIBLE } from '@/data/areas';
import type { AreaId, BodyView } from '@/data/types';
import { useViewport } from '@/lib/viewport';
import { useAppStore } from '@/store/useAppStore';

export default function Areas() {
  const selected = useAppStore((s) => s.draft.areas);
  const setDraft = useAppStore((s) => s.setDraft);
  const [view, setView] = useState<BodyView>('back');
  const { height } = useViewport();
  // Leaves room for the wrapped chips under the body.
  const mapHeight = Math.max(220, Math.min(440, height - 490));

  const toggle = (area: AreaId) => {
    const adding = !selected.includes(area);
    setDraft({ areas: adding ? [...selected, area] : selected.filter((a) => a !== area) });
    // Picking an area from the list turns the body round if it can only be seen from the other side.
    if (adding && !VISIBLE[view].includes(area)) setView(view === 'front' ? 'back' : 'front');
  };

  const count = selected.length;

  return (
    <Screen>
      <OnboardingHeader step={1} />
      <T variant="title" style={styles.title}>
        Where do you feel stiff?
      </T>
      <T variant="body" color={colors.muted} style={styles.sub}>
        Tap the body or pick from the list. Choose as many as you like.
      </T>
      <View style={styles.toggle}>
        <ViewToggle view={view} onChange={setView} />
      </View>
      <View style={styles.stage}>
        <BodyMap view={view} selected={selected} onToggle={toggle} height={mapHeight} />
      </View>
      <AreaChips selected={selected} onToggle={toggle} />
      <PrimaryButton
        label={count === 0 ? 'Pick at least one area' : `Continue with ${count} ${count === 1 ? 'area' : 'areas'}`}
        disabled={count === 0}
        style={styles.cta}
        onPress={() => router.push('/onboarding/goal')}
      />
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
