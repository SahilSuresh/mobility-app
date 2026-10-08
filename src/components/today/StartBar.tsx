import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/Appear';
import { HoldToStart } from '@/components/HoldToStart';
import { PrimaryButton } from '@/components/ui';
import type { LookTokens } from '@/constants/looks';

/** Height of the floating tab bar plus its gap below, so the bar sits just above it. */
const TAB_BAR = 64 + 4;
/** Space the scrolling content leaves at the bottom so the last move isn't hidden behind this bar. */
export const START_BAR_SPACE = 56 + 16;

type Props = {
  L: LookTokens;
  onStart: () => void;
  /** What Start will train, so the button never promises one length and plays another: "10 min" or "Hips, 2 min". */
  what: string;
};

/** Start, fixed above the tab bar, so it stays in thumb reach however long today's list is. */
export function StartBar({ L, onStart, what }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + TAB_BAR + 12 }]}>
      <Appear kind="pop" delay={420}>
        {L.start === 'hold' ? (
          <HoldToStart label={`Hold to start · ${what}`} onStart={onStart} bg={L.button.bg} text={L.button.text} halo={L.button.halo} />
        ) : (
          <PrimaryButton label={`Start · ${what}`} icon="play" onPress={onStart} />
        )}
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 24, right: 24 },
});
