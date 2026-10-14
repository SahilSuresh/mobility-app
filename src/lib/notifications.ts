import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import type { CompletedSession, Plan, PlannedSession, Reminder } from '@/data/types';

import { planReminders, type PlannedNotification } from './reminders';

const CHANNEL = 'reminders';
/** Android only: the same reminders without a sound. Android 8+ sets sound per channel, so "Sound off" uses this one. */
const QUIET_CHANNEL = 'reminders-quiet';

export type Permission = 'granted' | 'denied' | 'unsupported';

/** Whether the phone lets this app show notifications: yes, not asked yet, turned off, or no notifications here (web). */
export type NotificationStatus = 'granted' | 'undetermined' | 'denied' | 'unsupported';

/**
 * The phone's current answer, without asking. On iPhone it reads iOS's own status (as Expo advises), which also counts
 * quiet "provisional" delivery as allowed. After a "Don't Allow" an app can't ask again on iPhone: only Settings can turn
 * notifications back on, which is why the screen offers to open it.
 */
export async function notificationStatus(): Promise<NotificationStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const p = await Notifications.getPermissionsAsync();
    if (Platform.OS === 'ios' && p.ios) {
      const s = p.ios.status;
      if (s === Notifications.IosAuthorizationStatus.NOT_DETERMINED) return 'undetermined';
      if (s === Notifications.IosAuthorizationStatus.DENIED) return 'denied';
      return 'granted';
    }
    if (p.granted) return 'granted';
    return p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export function setupNotifications(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Session reminders',
      description: 'Your stretch reminders, and the occasional nudge to keep going.',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => undefined);
    Notifications.setNotificationChannelAsync(QUIET_CHANNEL, {
      name: 'Session reminders (silent)',
      description: 'The same reminders, without a sound. Used when Sound is off in Unknot’s notification settings.',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    }).catch(() => undefined);
  }
}

/** Asks for permission when it hasn't been decided yet; never asks again after a no. */
export async function askPermission(): Promise<Permission> {
  if (Platform.OS === 'web') return 'unsupported';
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted ? 'granted' : 'denied';
}

/** The phone's settings for this app, to turn notifications back on after a no. */
export function openNotificationSettings(): void {
  Linking.openSettings().catch(() => undefined);
}

type SyncInput = { plan: Plan | null; reminder: Reminder | null; history: CompletedSession[] };

let queue: Promise<void> = Promise.resolve();

/**
 * Rewrites every scheduled reminder from the current plan, settings and history. Runs when the app opens, after a session,
 * and when the plan or reminder settings change, so each reminder names what's actually planned that day and days already
 * done stay quiet. Calls are queued, so two at once can't double up. Never asks for permission itself.
 */
export function syncNotifications(input: SyncInput): Promise<void> {
  queue = queue.then(() => sync(input)).catch(() => undefined);
  return queue;
}

async function sync({ plan, reminder, history }: SyncInput): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!plan || !reminder) return;
  if ((await notificationStatus()) !== 'granted') return;
  const sound = reminder.sound !== false;
  for (const n of planReminders({ plan, reminder, history })) await schedule(n, sound);
}

function schedule(n: PlannedNotification, sound: boolean): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    // `false` is silent on iPhone; Android picks its sound from the channel.
    content: { title: n.title, body: n.body, data: { url: n.url }, sound: sound ? 'default' : false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: n.date,
      channelId: Platform.OS === 'android' ? (sound ? CHANNEL : QUIET_CHANNEL) : undefined,
    },
  });
}

/** A sample reminder a few seconds from now, so you can see how it looks (and sounds, with your sound setting). */
export async function sendTestReminder(session: PlannedSession | undefined, sound = true): Promise<Permission> {
  const permission = await askPermission();
  if (permission !== 'granted') return permission;
  await schedule(
    {
      date: new Date(Date.now() + 5000),
      title: session ? `Time for ${session.title}` : 'Time for your stretch',
      body: session ? `${session.minutes} min · ${session.exerciseIds.length} moves. This is how your reminders will look.` : 'This is how your reminders will look.',
      url: '/',
      kind: 'session',
    },
    sound,
  );
  return 'granted';
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
