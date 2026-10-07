import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, Screen } from '@/components/ui';
import { colors, fonts, tint } from '@/constants/theme';
import { goBack } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { READY_OPTIONS, restSeconds } from '@/lib/holds';
import { playSound, speak } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

/**
 * Sound & timer: the chimes, the voice guide, and how long you rest between stretches.
 * Each sound can be heard right here with its play button.
 */
export default function SoundTimer() {
  const sounds = useAppStore((s) => s.sounds);
  const setSound = useAppStore((s) => s.setSound);
  const readySeconds = useAppStore((s) => restSeconds(s.readySeconds));
  const setReadySeconds = useAppStore((s) => s.setReadySeconds);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={goBack} />
      </View>
      <T style={styles.title} accessibilityRole="header">
        Sound & timer
      </T>
      <T variant="body" color={colors.muted} style={styles.sub}>
        Follow along without looking at your phone.
      </T>

      <T variant="kicker" style={styles.section}>
        Sounds
      </T>
      <View style={styles.group}>
        <SettingRow
          icon="check"
          label="End of each exercise"
          hint="A soft chime when a move's time is up"
          on={sounds.moveEnd}
          onChange={(on) => setSound('moveEnd', on)}
          onPreview={() => playSound('done')}
        />
        <View style={styles.hairline} />
        <SettingRow
          icon="play"
          label="When each stretch starts"
          hint="A tone as your rest ends"
          on={sounds.readyEnd}
          onChange={(on) => setSound('readyEnd', on)}
          onPreview={() => playSound('go')}
        />
      </View>

      <T variant="kicker" style={styles.section}>
        Voice
      </T>
      <View style={styles.group}>
        <SettingRow
          icon="person"
          label="Voice guide"
          hint="Talks you through rests, what's next, how long to hold and when to switch sides, and counts down the last 5 seconds"
          on={sounds.voice}
          onChange={(on) => setSound('voice', on)}
          onPreview={() => speak(`Rest for ${readySeconds} seconds. Next: Child's pose. Hold for 1 minute.`)}
        />
      </View>

      <T variant="kicker" style={styles.section}>
        Rest between stretches
      </T>
      <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Rest between stretches">
        {READY_OPTIONS.map((s) => {
          const on = s === readySeconds;
          return (
            <Pressable
              key={s}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${s} seconds`}
              onPress={() => {
                tap();
                setReadySeconds(s);
              }}
              style={({ pressed }) => [styles.segment, on && styles.segmentOn, pressed && !on && styles.pressed]}
            >
              <T style={[styles.segmentText, on && styles.segmentTextOn]}>{`${s}s`}</T>
            </Pressable>
          );
        })}
      </View>
      <T variant="caption" style={styles.note} accessibilityLiveRegion="polite">
        {`After each stretch you rest for ${readySeconds} seconds while the next one is announced, then it starts.`}
      </T>

      <View style={styles.footer}>
        <Icon name="sun" size={14} color={colors.faint} />
        <T variant="caption" style={styles.footerText}>
          Sounds and voice play over your music, and stay quiet when your phone is on silent.
        </T>
      </View>
    </Screen>
  );
}

/** A setting with a switch: icon, label, a short hint, a play button to hear it, and the switch. */
function SettingRow({
  icon,
  label,
  hint,
  on,
  disabled,
  onChange,
  onPreview,
}: {
  icon: IconName;
  label: string;
  hint: string;
  on: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
  onPreview: () => void;
}) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={16} color={colors.greenText} strokeWidth={2.2} />
      </View>
      <View style={styles.flex}>
        <T variant="body" style={styles.label}>
          {label}
        </T>
        <T variant="caption">{hint}</T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Hear: ${label}`}
        disabled={disabled}
        hitSlop={8}
        onPress={onPreview}
        style={({ pressed }) => [styles.preview, pressed && styles.pressed]}
      >
        <Icon name="play" size={12} color={colors.greenText} />
      </Pressable>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        disabled={disabled}
        value={on}
        onValueChange={(next) => {
          onChange(next);
          if (next) onPreview();
        }}
        trackColor={{ true: colors.green, false: colors.line }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row' },
  title: { marginTop: 12, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink },
  sub: { marginTop: 4 },
  section: { marginTop: 28, marginBottom: 10 },

  group: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 12, paddingHorizontal: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenTint },
  label: { fontFamily: fonts.medium },
  preview: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  hairline: { marginLeft: 58, height: 1, backgroundColor: tint(0.1) },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.6 },

  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: tint(0.08) },
  segment: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.green },
  segmentText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  segmentTextOn: { color: colors.onGreen },
  note: { marginTop: 10, paddingHorizontal: 4 },

  footer: { marginTop: 32, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  footerText: { flex: 1 },
});
