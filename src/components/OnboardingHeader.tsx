import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton, Segments } from './ui';

/** Onboarding questions: areas, goal, then the routine. */
const STEPS = 3;

/** Where Back goes when there's no history (e.g. the page was opened by URL or refreshed on web). */
const PREVIOUS: Record<number, Href> = {
  1: '/welcome',
  2: '/onboarding/areas',
  3: '/onboarding/goal',
};

/** Back button plus the progress bar used during onboarding. */
export function OnboardingHeader({ step }: { step?: number }) {
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(step ? PREVIOUS[step] : '/settings');
  };

  return (
    <View style={styles.row}>
      <IconButton icon="back" label="Back" onPress={back} style={styles.back} />
      {step ? <Segments count={STEPS} filled={step} /> : <View style={{ flex: 1 }} />}
      <View style={{ width: 34 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  back: { marginLeft: -6, backgroundColor: 'transparent', borderWidth: 0 },
});
