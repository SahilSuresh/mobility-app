import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { BodyFigure } from '@/components/BodyFigure';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { colors, fonts, glass, shade, shadows, tint } from '@/constants/theme';
import type { Reminder, ReminderSlot } from '@/data/types';
import { DAY_LETTER, DAY_LONG, timeLabel } from '@/lib/dates';
import { continueFirstRun, goBack } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { askPermission, cancelReminders, openNotificationSettings, sendTestReminder } from '@/lib/notifications';
import { nextSession } from '@/lib/progress';
import { COMEBACK_DAYS, daysLabel, reminderDays, sessionMessage, STREAK_HOUR } from '@/lib/reminders';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

const SLOTS: { id: ReminderSlot; label: string; icon: IconName; hour: number; minute: number }[] = [
  { id: 'morning', label: 'Morning', icon: 'sunrise', hour: 8, minute: 0 },
  { id: 'afternoon', label: 'Lunchtime', icon: 'sun', hour: 12, minute: 30 },
  { id: 'evening', label: 'Evening', icon: 'moon', hour: 19, minute: 0 },
  { id: 'custom', label: 'Your time', icon: 'clock', hour: 7, minute: 30 },
];

type DayMode = 'plan' | 'all' | 'pick';
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/**
 * Reminders: when, which days, and the extra nudges. Shown once after the first session (short: time and days),
 * and from Settings (everything, plus a test). The preview at the top is the real message for your next session.
 */
export default function ReminderScreen() {
  const { flow, edit } = useLocalSearchParams<{ flow?: string; edit?: string }>();
  const editing = edit === '1';
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const saved = useAppStore((s) => s.reminder);
  const setReminder = useAppStore((s) => s.setReminder);
  const setFlag = useAppStore((s) => s.setFlag);

  const [slot, setSlot] = useState<ReminderSlot>(saved?.slot ?? 'evening');
  const [custom, setCustom] = useState({ hour: saved?.slot === 'custom' ? saved.hour : 7, minute: saved?.slot === 'custom' ? saved.minute : 30 });
  const [dayMode, setDayMode] = useState<DayMode>(!saved?.days ? 'plan' : saved.days.length === 7 ? 'all' : 'pick');
  const [picked, setPicked] = useState<number[]>(saved?.days ?? (plan ? reminderDays(plan, { slot: 'evening', hour: 19, minute: 0 }) : EVERY_DAY));
  const [streak, setStreak] = useState(saved?.streak !== false);
  const [comeback, setComeback] = useState(saved?.comeback !== false);
  const [weekly, setWeekly] = useState(saved?.weekly === true);
  const [note, setNote] = useState<{ text: string; settings?: boolean } | null>(null);

  useEffect(() => {
    if (flow === '1') setFlag('seenReminder');
  }, [flow, setFlag]);

  const next = () => (editing ? goBack() : continueFirstRun('reminder'));
  const upcoming = plan ? nextSession(plan, history, new Date())?.session : undefined;
  const base = SLOTS.find((s) => s.id === slot) ?? SLOTS[2];
  const time = slot === 'custom' ? custom : { hour: base.hour, minute: base.minute };
  const days = dayMode === 'plan' ? undefined : dayMode === 'all' ? EVERY_DAY : picked;
  const planDays = plan ? reminderDays(plan, { slot, ...time }) : [];
  const preview = sessionMessage(upcoming, time.hour, new Date().getDate());

  const reminder: Reminder = { slot, ...time, days, streak, comeback, weekly };

  const save = async () => {
    tap();
    if (!plan) return next();
    const permission = await askPermission();
    if (permission === 'denied') {
      setNote({ text: 'Notifications are off for this app. Turn them on in your phone’s settings, then save again.', settings: true });
      return;
    }
    // On the web preview there's nothing to schedule; the settings still save and work on your phone.
    playSound('next');
    setReminder(reminder);
    next();
  };

  const turnOff = async () => {
    tap();
    await cancelReminders();
    setReminder(null);
    next();
  };

  const test = async () => {
    tap();
    playSound('select');
    const result = await sendTestReminder(upcoming);
    setNote(
      result === 'granted'
        ? { text: 'A test reminder is on its way. Lock your phone to see it.' }
        : result === 'denied'
          ? { text: 'Notifications are off for this app. Turn them on in your phone’s settings.', settings: true }
          : { text: 'Test reminders work on your phone, not in the browser preview.' },
    );
  };

  const choose = (fn: () => void) => {
    tap();
    playSound('select');
    fn();
  };
  const togglePicked = (d: number) => {
    const on = picked.includes(d);
    if (on && picked.length === 1) return;
    tap();
    playSound(on ? 'deselect' : 'select');
    setPicked(on ? picked.filter((x) => x !== d) : [...picked, d].sort((a, b) => a - b));
  };
  const stepHour = (d: number) => setCustom((c) => ({ ...c, hour: (c.hour + d + 24) % 24 }));
  const stepMinute = (d: number) => setCustom((c) => ({ ...c, minute: (c.minute + d + 60) % 60 }));

  return (
    <Screen>
      {editing ? <IconButton icon="back" label="Back" onPress={() => goBack()} /> : <View style={styles.headerSpace} />}

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* What the reminder will actually say, updating as you choose. */}
        <Appear kind="pop">
          <View style={styles.preview} accessibilityLabel={`Preview: ${preview.title}. ${preview.body}`}>
            <View style={styles.appIcon}>
              <BodyFigure height={30} fill={colors.cream} />
            </View>
            <View style={styles.flex}>
              <View style={styles.previewTop}>
                <T variant="bodyStrong" style={styles.previewTitle} numberOfLines={1}>
                  {preview.title}
                </T>
                <T variant="caption" style={styles.previewTime}>
                  {timeLabel(time.hour, time.minute)}
                </T>
              </View>
              <T variant="small" numberOfLines={2}>
                {preview.body}
              </T>
            </View>
          </View>
        </Appear>

        <Appear delay={80}>
          <T variant="title" center style={styles.title}>
            {editing ? 'Reminders' : 'Want a reminder?'}
          </T>
          <T variant="body" color={colors.muted} center style={styles.sub}>
            A nudge on the days you choose, never once you’ve trained.
          </T>
        </Appear>

        <Appear delay={150}>
          <T variant="kicker" style={styles.label}>
            Time
          </T>
          <View style={styles.grid}>
            {SLOTS.map((s) => {
              const on = slot === s.id;
              const label = s.id === 'custom' ? (on ? timeLabel(custom.hour, custom.minute) : 'Pick a time') : timeLabel(s.hour, s.minute);
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${s.label}, ${label}`}
                  onPress={() => (on ? undefined : choose(() => setSlot(s.id)))}
                  style={[styles.tile, on && styles.tileOn]}
                >
                  <Icon name={s.icon} size={20} color={colors.greenText} />
                  <View>
                    <T variant="bodyStrong">{s.label}</T>
                    <T variant="caption">{label}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {slot === 'custom' ? (
            <View style={styles.stepper}>
              <Stepper label="Hour" onMinus={() => stepHour(-1)} onPlus={() => stepHour(1)} />
              <T variant="h2">{timeLabel(custom.hour, custom.minute)}</T>
              <Stepper label="Minutes" onMinus={() => stepMinute(-15)} onPlus={() => stepMinute(15)} />
            </View>
          ) : null}
        </Appear>

        <Appear delay={220}>
          <T variant="kicker" style={styles.label}>
            Days
          </T>
          <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Days">
            {(
              [
                ['plan', 'Plan days'],
                ['all', 'Every day'],
                ['pick', 'Pick days'],
              ] as [DayMode, string][]
            ).map(([mode, label]) => {
              const on = dayMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => (on ? undefined : choose(() => setDayMode(mode)))}
                  style={[styles.segment, on && styles.segmentOn]}
                >
                  <T style={[styles.segmentText, on && styles.segmentTextOn]}>{label}</T>
                </Pressable>
              );
            })}
          </View>
          {dayMode === 'pick' ? (
            <View style={styles.dayRow} accessibilityLabel="Reminder days">
              {DAY_LETTER.map((letter, d) => {
                const on = picked.includes(d);
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={DAY_LONG[d]}
                    onPress={() => togglePicked(d)}
                    style={[styles.day, on && styles.dayOn]}
                  >
                    <T style={[styles.dayText, on && styles.dayTextOn]}>{letter}</T>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <T variant="caption" style={styles.dayNote}>
              {dayMode === 'plan' ? `${daysLabel(planDays)}, the days your plan has a session. They move with your plan.` : 'Every day, even rest days.'}
            </T>
          )}
        </Appear>

        {/* The extra nudges: in Settings only, so the first-time question stays short. They start on (all but the week ahead). */}
        {editing ? (
          <Appear delay={290}>
            <T variant="kicker" style={styles.label}>
              Extra nudges
            </T>
            <View style={styles.group}>
              <Nudge
                icon="flame"
                label="Streak saver"
                hint={`${timeLabel(STREAK_HOUR, 0)} on plan days, only if you haven't trained yet`}
                on={streak}
                onChange={setStreak}
              />
              <View style={styles.hairline} />
              <Nudge icon="sprout" label="Welcome back" hint={`After ${COMEBACK_DAYS}+ days away, your next reminder gently welcomes you back`} on={comeback} onChange={setComeback} />
              <View style={styles.hairline} />
              <Nudge icon="calendar" label="Week ahead" hint="Sunday at 6:00 pm: what next week holds" on={weekly} onChange={setWeekly} />
            </View>
            <TextButton label="Send a test reminder" color={colors.greenText} onPress={test} style={styles.test} />
          </Appear>
        ) : null}
      </ScrollView>

      {note ? (
        <View style={styles.note}>
          <T variant="caption" center>
            {note.text}
          </T>
          {note.settings ? <TextButton label="Open settings" color={colors.greenText} onPress={openNotificationSettings} /> : null}
        </View>
      ) : null}
      <PrimaryButton label={editing ? 'Save' : 'Remind me'} icon={editing ? 'check' : undefined} onPress={save} />
      <TextButton label={editing && saved ? 'Turn off reminders' : 'Not now'} onPress={turnOff} style={styles.off} />
    </Screen>
  );
}

/** One extra nudge: icon, name, when it comes, and its switch. */
function Nudge({ icon, label, hint, on, onChange }: { icon: IconName; label: string; hint: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <View style={styles.nudge}>
      <View style={styles.nudgeIcon}>
        <Icon name={icon} size={16} color={colors.greenText} strokeWidth={2.2} />
      </View>
      <View style={styles.flex}>
        <T variant="body" style={styles.nudgeLabel}>
          {label}
        </T>
        <T variant="caption">{hint}</T>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={on}
        onValueChange={(next) => {
          tap();
          playSound(next ? 'select' : 'deselect');
          onChange(next);
        }}
        trackColor={{ true: colors.green, false: colors.line }}
      />
    </View>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepGroup}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} earlier`}
        onPress={() => {
          tap();
          onMinus();
        }}
        style={styles.stepButton}
      >
        <Icon name="minus" size={16} color={colors.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} later`}
        onPress={() => {
          tap();
          onPlus();
        }}
        style={styles.stepButton}
      >
        <Icon name="plus" size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerSpace: { height: 44 },
  content: { paddingBottom: 16 },
  preview: {
    marginTop: 12,
    padding: 14,
    paddingRight: 16,
    borderRadius: 24,
    backgroundColor: glass,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: `0px 18px 34px -18px ${shade(0.4)}`,
  },
  appIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  previewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  previewTitle: { flex: 1, fontSize: 15, fontFamily: fonts.bold },
  previewTime: { fontSize: 12 },
  title: { marginTop: 26, fontSize: 32, lineHeight: 36 },
  sub: { marginTop: 6 },
  label: { marginTop: 24, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47.5%', flexGrow: 1, height: 86, borderRadius: 20, padding: 14, justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1, borderColor: tint(0.14) },
  tileOn: { borderWidth: 2, borderColor: colors.green, boxShadow: shadows.small },
  stepper: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepGroup: { flexDirection: 'row', gap: 8 },
  stepButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: tint(0.16), alignItems: 'center', justifyContent: 'center' },

  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: tint(0.08) },
  segment: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.green },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  segmentTextOn: { color: colors.onGreen },
  dayRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayOn: { backgroundColor: colors.green, borderColor: colors.green },
  dayText: { fontFamily: fonts.bold, fontSize: 14, color: colors.muted },
  dayTextOn: { color: colors.onGreen },
  dayNote: { marginTop: 10, paddingHorizontal: 4 },

  group: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 12, paddingHorizontal: 14 },
  nudgeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenTint },
  nudgeLabel: { fontFamily: fonts.medium },
  hairline: { marginLeft: 58, height: 1, backgroundColor: tint(0.1) },
  test: { marginTop: 10 },

  note: { marginBottom: 10, gap: 2 },
  off: { marginTop: 6 },
});
