import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear, STAGGER } from '@/components/Appear';
import { AreaChips } from '@/components/AreaChips';
import { BodyMap, ViewToggle } from '@/components/BodyFigure';
import { PremiumSheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen } from '@/components/ui';
import { AREA_NAMES, AREA_ORDER, sortAreas, VISIBLE } from '@/data/areas';
import type { AreaId, BodyView } from '@/data/types';
import { goBack } from '@/lib/flow';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useViewport } from '@/lib/viewport';
import { useAppStore } from '@/store/useAppStore';

export default function EditAreas() {
  const plan = useAppStore((s) => s.plan);
  const isPremium = useAppStore((s) => s.isPremium);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const [view, setView] = useState<BodyView>('back');
  const [selected, setSelected] = useState<AreaId[]>(plan?.areas ?? []);
  const [sheet, setSheet] = useState<{ area: AreaId; adding: boolean } | null>(null);
  const { height } = useViewport();
  const mapHeight = Math.max(240, Math.min(440, height - 420));
  useEffect(() => preloadSounds(), []);
  if (!plan) return null;

  // The screen builds in like onboarding: the toggle, the body, the areas one by one with a soft pop, then Save.
  const CHIPS_AT = 500;
  const BUTTON_AT = CHIPS_AT + AREA_ORDER.length * STAGGER + 150;

  const changed = sortAreas(selected).join() !== sortAreas(plan.areas).join();

  const toggle = (area: AreaId) => {
    const adding = !selected.includes(area);
    // Changing areas after onboarding is Premium: free users see why at the moment they try.
    if (!isPremium) {
      setSheet({ area, adding });
      return;
    }
    playSound(adding ? 'select' : 'deselect');
    setSelected(adding ? [...selected, area] : selected.filter((a) => a !== area));
    // Picking an area from the list turns the body round if it can only be seen from the other side.
    if (adding && !VISIBLE[view].includes(area)) setView(view === 'front' ? 'back' : 'front');
  };

  return (
    <Screen modal>
      <View style={styles.header}>
        <IconButton icon="close" label="Close" onPress={() => goBack()} />
        <T variant="bodyStrong" center style={styles.flex}>
          Your areas
        </T>
        <View style={{ width: 44 }} />
      </View>
      <Appear delay={80} style={styles.toggle}>
        <ViewToggle view={view} onChange={setView} />
      </Appear>
      <Appear delay={200} style={styles.stage}>
        <BodyMap view={view} selected={selected} onToggle={toggle} height={mapHeight} />
      </Appear>
      <AreaChips selected={selected} onToggle={toggle} introDelay={CHIPS_AT} />
      <Appear delay={BUTTON_AT}>
        {isPremium ? (
          <PrimaryButton
            label="Save"
            disabled={!changed || selected.length === 0}
            style={styles.cta}
            onPress={() => {
              playSound('next');
              updatePlan({ areas: selected });
              goBack();
            }}
          />
        ) : (
          <T variant="caption" center style={styles.cta}>
            Tap an area to add it to your plan.
          </T>
        )}
      </Appear>
      <PremiumSheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet ? (sheet.adding ? `Add ${AREA_NAMES[sheet.area].toLowerCase()} to your plan?` : 'Change your areas?') : ''}
        body="Premium adjusts your plan whenever your goals change."
        highlight={sheet?.adding ? sheet.area : undefined}
        current={plan.areas}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: { marginTop: 18 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: 16 },
});
