import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import type { CompletedSession, Plan, PlannedSession, Reminder } from '@/data/types';

import { planReminders, type PlannedNotification } from './reminders';

const CHANNEL = 'reminders';

export type Permission = 'granted' | 'denied' | 'unsupported';

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
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  for (const n of planReminders({ plan, reminder, history })) await schedule(n);
}

function schedule(n: PlannedNotification): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: n.title, body: n.body, data: { url: n.url }, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date, channelId: Platform.OS === 'android' ? CHANNEL : undefined },
  });
}

/** A sample reminder a few seconds from now, so you can see how it looks. */
export async function sendTestReminder(session: PlannedSession | undefined): Promise<Permission> {
  const permission = await askPermission();
  if (permission !== 'granted') return permission;
  await schedule({
    date: new Date(Date.now() + 5000),
    title: session ? `Time for ${session.title}` : 'Time for your stretch',
    body: session ? `${session.minutes} min · ${session.exerciseIds.length} moves. This is how your reminders will look.` : 'This is how your reminders will look.',
    url: '/',
    kind: 'session',
  });
  return 'granted';
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
