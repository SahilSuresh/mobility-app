import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, Screen, TextButton } from '@/components/ui';
import { colors, fonts, tint } from '@/constants/theme';
import type { Reminder } from '@/data/types';
import { timeLabel } from '@/lib/dates';
import { goBack } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { askPermission, openNotificationSettings, sendTestReminder, type NotificationStatus } from '@/lib/notifications';
import { nextSession } from '@/lib/progress';
import { COMEBACK_DAYS, reminderSummary, STREAK_HOUR } from '@/lib/reminders';
import { playSound } from '@/lib/sounds';
import { useNotificationStatus } from '@/lib/useNotificationStatus';
import { useAppStore } from '@/store/useAppStore';

/** Turning reminders on for the first time: 7:00 pm on your plan's days, with the usual nudges. Changeable under Time and days. */
const DEFAULT_REMINDER: Reminder = { slot: 'evening', hour: 19, minute: 0 };

/** "iPhone" on an iPhone, "phone" elsewhere, so the help text names the right device. */
const DEVICE = Platform.OS === 'ios' ? 'iPhone' : 'phone';

/**
 * Notifications, from Settings: whether the phone lets Unknot send them (and the way to fix it if not), session
 * reminders on or off with their time and days, each extra nudge, sound, and a test. Everything is scheduled on the
 * phone itself (local notifications), so it works offline and needs no account or server.
 */
export default function NotificationsScreen() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const reminder = useAppStore((s) => s.reminder);
  const setReminder = useAppStore((s) => s.setReminder);
  const { status, refresh } = useNotificationStatus();
  const [note, setNote] = useState<{ text: string; settings?: boolean } | null>(null);
  // The reminder as it was before being switched off here, so switching back on restores its time and days.
  const lastReminder = useRef<Reminder | null>(reminder);

  const on = reminder !== null;
  const blocked = status === 'denied';

  /** Asks the phone if needed; true when reminders can go ahead (or on the web preview, where settings just save). */
  const allowed = async (): Promise<boolean> => {
    const result = await askPermission();
    refresh();
    if (result === 'denied') {
      setNote({ text: `Notifications are off for Unknot. Turn them on in your ${DEVICE}'s Settings, then try again.`, settings: true });
      return false;
    }
    return true;
  };

  const toggleReminders = async (next: boolean) => {
    tap();
    setNote(null);
    if (!next) {
      playSound('deselect');
      lastReminder.current = reminder;
      setReminder(null);
      return;
    }
    if (!(await allowed())) return;
    playSound('select');
    setReminder(lastReminder.current ?? DEFAULT_REMINDER);
  };

  const update = (patch: Partial<Reminder>) => {
    if (reminder) setReminder({ ...reminder, ...patch });
  };

  const test = async () => {
    tap();
    playSound('select');
    const upcoming = plan ? nextSession(plan, history, new Date())?.session : undefined;
    const result = await sendTestReminder(upcoming, reminder?.sound !== false);
    refresh();
    setNote(
      result === 'granted'
        ? { text: `A test notification is on its way. Lock your ${DEVICE} to see it.` }
        : result === 'denied'
          ? { text: `Notifications are off for Unknot. Turn them on in your ${DEVICE}'s Settings.`, settings: true }
          : { text: 'Test notifications work on your phone, not in the browser preview.' },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={goBack} />
      </View>
      <Appear>
        <T style={styles.title} accessibilityRole="header">
          Notifications
        </T>
      </Appear>
      <Appear delay={80}>
        <T variant="body" color={colors.muted} style={styles.sub}>
          Choose what Unknot sends you, and when.
        </T>
      </Appear>

      <Appear delay={140}>
        <StatusCard status={status} remindersOn={on} onAllow={() => allowed().then(() => undefined)} />
      </Appear>

      <Appear delay={220}>
        <T variant="kicker" style={styles.section}>
          Session reminders
        </T>
        <View style={styles.group}>
          <SwitchRow
            icon="clock"
            label="Session reminders"
            hint={on ? 'What’s planned, on your days, at your time' : 'Off. Turn on to get a nudge on your plan days'}
            value={on}
            onChange={toggleReminders}
          />
          {on ? (
            <>
              <View style={styles.hairline} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Time and days, ${reminderSummary(reminder)}`}
                onPress={() => {
                  tap();
                  router.push({ pathname: '/reminder', params: { edit: '1' } });
                }}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <T variant="body" style={styles.rowLabel} numberOfLines={1}>
                  Time and days
                </T>
                <T variant="body" color={colors.muted} numberOfLines={1} style={styles.value}>
                  {reminderSummary(reminder)}
                </T>
                <Icon name="chevron" size={16} color={colors.chevron} strokeWidth={2.2} />
              </Pressable>
            </>
          ) : null}
        </View>
      </Appear>

      <Appear delay={300}>
        <T variant="kicker" style={styles.section}>
          Extra nudges
        </T>
        {/* They ride on your reminders (the welcome back changes one, the others follow your days), so they need them on. */}
        <View style={[styles.group, !on && styles.disabled]} accessibilityState={{ disabled: !on }}>
          <SwitchRow
            icon="flame"
            label="Streak saver"
            hint={`${timeLabel(STREAK_HOUR, 0)} on plan days, only if you haven’t trained yet`}
            value={on && reminder.streak !== false}
            disabled={!on}
            onChange={(v) => update({ streak: v })}
          />
          <View style={styles.hairline} />
          <SwitchRow
            icon="sprout"
            label="Welcome back"
            hint={`After ${COMEBACK_DAYS}+ days away, your next reminder welcomes you back`}
            value={on && reminder.comeback !== false}
            disabled={!on}
            onChange={(v) => update({ comeback: v })}
          />
          <View style={styles.hairline} />
          <SwitchRow
            icon="calendar"
            label="Week ahead"
            hint="Sunday at 6:00 pm: what next week holds"
            value={on && reminder.weekly === true}
            disabled={!on}
            onChange={(v) => update({ weekly: v })}
          />
        </View>
        {on ? null : (
          <T variant="caption" style={styles.groupNote}>
            Turn on session reminders to get these.
          </T>
        )}
      </Appear>

      <Appear delay={380}>
        <T variant="kicker" style={styles.section}>
          Sound
        </T>
        <View style={[styles.group, !on && styles.disabled]}>
          <SwitchRow
            icon="bars"
            label="Play a sound"
            hint={`When a reminder arrives. Silent mode and Focus on your ${DEVICE} still apply`}
            value={on && reminder.sound !== false}
            disabled={!on}
            onChange={(v) => update({ sound: v })}
          />
        </View>
      </Appear>

      <Appear delay={440}>
        <TextButton label="Send a test notification" color={colors.greenText} onPress={test} style={styles.test} />
        {note ? (
          <View style={styles.note} accessibilityLiveRegion="polite">
            <T variant="caption" center>
              {note.text}
            </T>
            {note.settings ? <TextButton label="Open Settings" color={colors.greenText} onPress={openNotificationSettings} /> : null}
          </View>
        ) : null}
        <T variant="caption" color={colors.faint} center style={styles.footer}>
          {blocked
            ? `Reminders can’t arrive while notifications are off for Unknot in your ${DEVICE}'s Settings.`
            : 'Reminders are set up on your phone, so they arrive even without internet. Unknot never sends adverts.'}
        </T>
      </Appear>
    </Screen>
  );
}

/** Whether notifications can reach you, in words, with the one thing to do about it when they can't. */
function StatusCard({ status, remindersOn, onAllow }: { status: NotificationStatus | null; remindersOn: boolean; onAllow: () => void }) {
  if (status === null) return <View style={[styles.status, styles.statusLoading]} />;
  const content: Record<NotificationStatus, { icon: IconName; title: string; body: string; action?: { label: string; onPress: () => void }; warn?: boolean }> = {
    granted: {
      icon: 'check',
      title: 'Notifications are allowed',
      body: `How they look (banners, lock screen, sounds) follows your ${DEVICE}'s Settings for Unknot.`,
      action: { label: `${DEVICE === 'iPhone' ? 'iPhone' : 'Phone'} Settings`, onPress: openNotificationSettings },
    },
    undetermined: {
      icon: 'info',
      title: 'Allow notifications',
      body: `So your reminders can reach you. Your ${DEVICE} will ask once.`,
      action: { label: 'Allow notifications', onPress: onAllow },
    },
    denied: {
      icon: 'lock',
      title: 'Notifications are off for Unknot',
      body: remindersOn
        ? `Your reminders are set but can’t arrive. Turn on Allow Notifications in Settings.`
        : `Your ${DEVICE} is blocking them. Turn on Allow Notifications in Settings.`,
      action: { label: 'Open Settings', onPress: openNotificationSettings },
      warn: true,
    },
    unsupported: {
      icon: 'info',
      title: 'Notifications work on your phone',
      body: 'This preview can’t send them, but your choices here are saved.',
    },
  };
  const c = content[status];
  return (
    <View style={[styles.status, c.warn && styles.statusWarn]}>
      <View style={[styles.statusIcon, c.warn && styles.statusIconWarn]}>
        <Icon name={c.icon} size={16} color={c.warn ? colors.flameText : colors.greenText} strokeWidth={2.4} />
      </View>
      <View style={styles.flex}>
        <T variant="bodyStrong">{c.title}</T>
        <T variant="caption" style={styles.statusBody}>
          {c.body}
        </T>
        {c.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tap();
              c.action?.onPress();
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.statusAction, pressed && styles.pressed]}
          >
            <T variant="smallStrong" color={colors.greenText}>
              {c.action.label}
            </T>
            <Icon name="chevron" size={14} color={colors.greenText} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function SwitchRow({ icon, label, hint, value, disabled, onChange }: { icon: IconName; label: string; hint: string; value: boolean; disabled?: boolean; onChange: (on: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={16} color={colors.greenText} strokeWidth={2.2} />
      </View>
      <View style={styles.flex}>
        <T variant="body" style={styles.rowLabel}>
          {label}
        </T>
        <T variant="caption">{hint}</T>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          tap();
          if (label !== 'Session reminders') playSound(next ? 'select' : 'deselect');
          onChange(next);
        }}
        trackColor={{ true: colors.green, false: colors.line }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 44, justifyContent: 'center' },
  title: { marginTop: 12, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink },
  sub: { marginTop: 4 },
  section: { marginTop: 28, marginBottom: 10 },
  group: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  groupNote: { marginTop: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 12, paddingHorizontal: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenTint },
  rowLabel: { fontFamily: fonts.medium },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingLeft: 58, paddingRight: 14 },
  // The label keeps its one line; the value takes the rest and shortens with "…" if it must.
  value: { flex: 1, textAlign: 'right' },
  hairline: { marginLeft: 58, height: 1, backgroundColor: tint(0.1) },
  pressed: { opacity: 0.7 },
  status: { marginTop: 20, flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  statusLoading: { height: 92 },
  statusWarn: { borderColor: colors.flameText },
  statusIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenTint },
  statusIconWarn: { backgroundColor: tint(0.06) },
  statusBody: { marginTop: 2 },
  statusAction: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 32 },
  test: { marginTop: 22 },
  note: { marginTop: 6, alignItems: 'center' },
  footer: { marginTop: 14, marginBottom: 24, paddingHorizontal: 12 },
});
