import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, MAX_FONT_SCALE } from '@/constants/theme';
import { AREA_NAMES, AREA_ORDER } from '@/data/areas';
import type { AreaId } from '@/data/types';
import { tap } from '@/lib/haptics';

import { Icon } from './Icon';

/**
 * Every area as a chip, wrapped so all of them are in view: the list alternative to tapping the body map.
 * Selected chips turn green with a check, so the state never relies on colour alone.
 */
export function AreaChips({ selected, onToggle }: { selected: AreaId[]; onToggle: (area: AreaId) => void }) {
  return (
    <View style={styles.wrap}>
      {AREA_ORDER.map((area) => {
        const on = selected.includes(area);
        return (
          <Pressable
            key={area}
            accessibilityRole="checkbox"
            accessibilityLabel={AREA_NAMES[area]}
            accessibilityState={{ checked: on }}
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => {
              tap();
              onToggle(area);
            }}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
          >
            <Icon name={on ? 'check' : 'plus'} size={13} color={on ? colors.white : colors.greenText} strokeWidth={2.4} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, on && styles.labelOn]}>
              {AREA_NAMES[area]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green, boxShadow: '0px 6px 12px -8px rgba(47,122,86,0.8)' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  labelOn: { color: colors.white },
});
