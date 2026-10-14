import type { CompletedSession, Plan, PlannedSession, Reminder } from '@/data/types';

// The browser preview can't schedule notifications: settings save, and the reminder screen says they work on your phone.
export type Permission = 'granted' | 'denied' | 'unsupported';
export type NotificationStatus = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export async function notificationStatus(): Promise<NotificationStatus> {
  return 'unsupported';
}

export function setupNotifications(): void {}

export async function askPermission(): Promise<Permission> {
  return 'unsupported';
}

export function openNotificationSettings(): void {}

export async function syncNotifications(_input: { plan: Plan | null; reminder: Reminder | null; history: CompletedSession[] }): Promise<void> {}

export async function sendTestReminder(_session: PlannedSession | undefined, _sound = true): Promise<Permission> {
  return 'unsupported';
}

export async function cancelReminders(): Promise<void> {}
