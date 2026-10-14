import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { Screen } from '@/components/ui';
import { config } from '@/constants/config';
import { colors, fonts, isDark, shade, shadows, tint } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { reloadApp, saveAppearance } from '@/lib/appearance';
import { restSeconds } from '@/lib/holds';
import { cancelReminders } from '@/lib/notifications';
import { reminderSummary } from '@/lib/reminders';
import { manageSubscription, purchasesLive, restore } from '@/lib/purchases';
import { isReviewCode } from '@/lib/reviewAccess';
import { useNotificationStatus } from '@/lib/useNotificationStatus';
import { useAppStore } from '@/store/useAppStore';

type RowProps = { label: string; value?: string; href?: Href; onPress?: () => void; last?: boolean };

function Row({ label, value, href, onPress, last }: RowProps) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onPress ?? (href ? () => router.push(href) : undefined)}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: tint(0.05) }]}
      >
        {/* The label keeps its one line; a value beside it takes the rest and shortens with "…" if it must. */}
        <T variant="body" numberOfLines={1} style={[value ? styles.label : styles.flex, { fontFamily: fonts.medium }]}>
          {label}
        </T>
        {value ? (
          <T variant="body" color={colors.muted} numberOfLines={1} style={styles.value}>
            {value}
          </T>
        ) : null}
        {href ? <Icon name="chevron" size={16} color={colors.chevron} strokeWidth={2.2} /> : null}
      </Pressable>
      {last ? null : <View style={styles.hairline} />}
    </>
  );
}

export default function SettingsTab() {
  const plan = useAppStore((s) => s.plan);
  const reminder = useAppStore((s) => s.reminder);
  const isPremium = useAppStore((s) => s.isPremium);
  const setPremium = useAppStore((s) => s.setPremium);
  const unlockReviewAccess = useAppStore((s) => s.unlockReviewAccess);
  const sounds = useAppStore((s) => s.sounds);
  const readySeconds = useAppStore((s) => s.readySeconds);
  // Short enough to fit beside the label: "Voice & chimes · 5s rest", "Chimes · 10s rest", "Silent · 5s rest".
  const chimes = sounds.moveEnd || sounds.readyEnd;
  const audio = chimes && sounds.voice ? 'Voice & chimes' : chimes ? 'Chimes' : sounds.voice ? 'Voice' : 'Silent';
  const soundSummary = `${audio} · ${restSeconds(readySeconds)}s rest`;
  // "7:00 pm · Plan days", "Off", or a warning when the phone is blocking them.
  const { status: notifyStatus } = useNotificationStatus();
  const notificationSummary = notifyStatus === 'denied' ? 'Blocked in Settings' : reminderSummary(reminder);
  const reset = useAppStore((s) => s.reset);
  const [note, setNote] = useState('');
  const [darkMode, setDarkMode] = useState(isDark);
  // The access code box, for app store review: closed until asked for.
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  if (!plan) return null;

  const restorePurchases = async () => {
    const store = Platform.OS === 'android' ? 'Google Play' : 'App Store';
    try {
      const active = await restore();
      if (active) setPremium(true);
      setNote(active ? 'Premium restored.' : active === null ? `Restore works once the ${store} is connected.` : 'No purchases to restore.');
    } catch {
      setNote(`Couldn't reach the ${store}. Check your connection and try again.`);
    }
  };

  const applyCode = async () => {
    if (await isReviewCode(code)) {
      unlockReviewAccess();
      setCodeOpen(false);
      setCode('');
      setNote('Premium is on for this phone.');
    } else {
      setNote("That code didn't work. Check it and try again.");
    }
  };

  const openSubscription = async () => {
    if (!(await manageSubscription())) setNote('Manage your subscription in your App Store or Google Play account settings.');
  };

  return (
    <Screen scroll tabBar>
      <T variant="title" style={styles.title}>
        Settings
      </T>

      {isPremium ? (
        <View style={[styles.group, styles.premiumOn]}>
          <Icon name="check" size={18} color={colors.green} strokeWidth={2.6} />
          <T variant="bodyStrong">Premium is on</T>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => router.push('/premium')} style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
          <LinearGradient colors={isDark ? ['#2C5541', colors.card] : ['#2B3A31', colors.ink]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.premiumCard}>
            <View style={styles.flex}>
              <T variant="bodyStrong" color={colors.cream} style={{ fontSize: 17, fontFamily: fonts.bold }}>
                Get Premium
              </T>
              <T variant="caption" color="#CFC6B6" style={{ marginTop: 2 }}>
                Unlock every session in your plan
              </T>
            </View>
            <View style={styles.arrow}>
              <Icon name="chevron" size={16} color={colors.onGreen} strokeWidth={2.6} />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      <T variant="kicker" style={styles.section}>
        Your plan
      </T>
      <View style={styles.group}>
        <Row label="Areas" value={plan.areas.map((a) => AREA_NAMES[a]).join(', ')} href="/edit-areas" />
        <Row label="Days a week" value={plan.days === 7 ? 'Every day' : String(plan.days)} href={{ pathname: '/onboarding/days', params: { edit: '1' } }} />
        <Row label="Session length" value={`${plan.minutes} min`} href={{ pathname: '/onboarding/days', params: { edit: '1' } }} last />
      </View>

      <T variant="kicker" style={styles.section}>
        Appearance
      </T>
      <View style={styles.group}>
        <View style={styles.row}>
          <Icon name="moon" size={18} color={colors.greenText} />
          <T variant="body" style={[styles.flex, { fontFamily: fonts.medium }]}>
            Dark mode
          </T>
          <Switch
            accessibilityLabel="Dark mode"
            value={darkMode}
            onValueChange={(on) => {
              setDarkMode(on);
              saveAppearance(on ? 'dark' : 'light');
              // The whole app is drawn in one palette, picked at start-up, so it reloads to switch.
              reloadApp(() => setNote('Restart the app to see the new look.'));
            }}
            trackColor={{ true: colors.green, false: colors.line }}
          />
        </View>
      </View>

      <T variant="kicker" style={styles.section}>
        Sessions
      </T>
      <View style={styles.group}>
        <Row label="Sound & timer" value={soundSummary} href="/sound-timer" last />
      </View>

      <T variant="kicker" style={styles.section}>
        Notifications
      </T>
      <View style={styles.group}>
        <Row label="Notifications" value={notificationSummary} href="/notifications" last />
      </View>

      <T variant="kicker" style={styles.section}>
        General
      </T>
      <View style={styles.group}>
        {isPremium && purchasesLive() ? <Row label="Manage subscription" onPress={openSubscription} /> : null}
        <Row label="Restore purchases" onPress={restorePurchases} />
        {isPremium ? null : <Row label="Have an access code?" onPress={() => setCodeOpen((o) => !o)} />}
        {codeOpen && !isPremium ? (
          <>
            <View style={[styles.row, styles.codeRow]}>
              <TextInput
                accessibilityLabel="Access code"
                value={code}
                onChangeText={setCode}
                onSubmitEditing={applyCode}
                placeholder="Access code"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                style={[styles.flex, styles.codeInput]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={applyCode}
                disabled={!code.trim()}
                style={({ pressed }) => [styles.apply, !code.trim() && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}
              >
                <T variant="smallStrong" color={colors.onGreen}>
                  Apply
                </T>
              </Pressable>
            </View>
            <View style={styles.hairline} />
          </>
        ) : null}
        <Row label="Help" onPress={() => Linking.openURL(config.links.help)} />
        <Row label="Privacy and terms" onPress={() => Linking.openURL(config.links.privacy)} last />
      </View>
      {note ? (
        <T variant="caption" center style={{ marginTop: 10 }}>
          {note}
        </T>
      ) : null}

      {__DEV__ ? (
        <>
          <T variant="kicker" style={styles.section}>
            Testing
          </T>
          <View style={styles.group}>
            <View style={styles.row}>
              <T variant="body" style={[styles.flex, { fontFamily: fonts.medium }]}>
                Premium (test)
              </T>
              <Switch value={isPremium} onValueChange={setPremium} trackColor={{ true: colors.green, false: colors.line }} />
            </View>
            <View style={styles.hairline} />
            <Row
              label="Start again from Welcome"
              onPress={async () => {
                await cancelReminders();
                router.replace('/welcome');
                reset();
              }}
              last
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { minHeight: 44, textAlignVertical: 'center' },
  premiumCard: { marginTop: 12, height: 76, borderRadius: 24, paddingLeft: 20, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: `0px 14px 28px -14px ${shade(0.6)}` },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  premiumOn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18 },
  section: { marginTop: 26 },
  group: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    boxShadow: shadows.small,
  },
  row: { minHeight: 52, paddingHorizontal: 16, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flexShrink: 0 },
  value: { flex: 1, textAlign: 'right' },
  codeRow: { gap: 10 },
  codeInput: { minHeight: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.ink, fontFamily: fonts.medium, fontSize: 16 },
  apply: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  hairline: { marginLeft: 16, height: 1, backgroundColor: tint(0.10) },
});
