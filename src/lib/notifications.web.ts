import type { CompletedSession, Plan, PlannedSession, Reminder } from '@/data/types';

// The browser preview can't schedule notifications: settings save, and the reminder screen says they work on your phone.
export type Permission = 'granted' | 'denied' | 'unsupported';

export function setupNotifications(): void {}

export async function askPermission(): Promise<Permission> {
  return 'unsupported';
}

export function openNotificationSettings(): void {}

export async function syncNotifications(_input: { plan: Plan | null; reminder: Reminder | null; history: CompletedSession[] }): Promise<void> {}

export async function sendTestReminder(_session: PlannedSession | undefined): Promise<Permission> {
  return 'unsupported';
}

export async function cancelReminders(): Promise<void> {}
