import { AREA_NAMES } from '@/data/areas';
import type { CompletedSession, Plan, PlannedSession, Reminder } from '@/data/types';

import { addDays, DAY_LONG, isSameDay, startOfDay, timeLabel, weekdayIndex } from './dates';

/** How far ahead reminders are written out. They're rewritten often, and iOS only keeps the next 64. */
const DAYS_AHEAD = 14;
/** The streak saver: an evening nudge on plan days you haven't trained, only when your reminder is earlier than this. */
export const STREAK_HOUR = 20;
/** The week ahead: Sunday at 6 pm. */
const WEEK_AHEAD = { weekday: 6, hour: 18 };
/** Come-back: the welcome-back reminder comes at least this many days after your last session. */
export const COMEBACK_DAYS = 3;

export type PlannedNotification = {
  date: Date;
  title: string;
  body: string;
  /** Where tapping it opens. */
  url: string;
  kind: 'session' | 'streak' | 'comeback' | 'week';
};

/** The days a reminder covers: the ones you picked, or else your plan's days. */
export function reminderDays(plan: Plan, reminder: Reminder): number[] {
  return reminder.days ?? [...new Set(plan.sessions.map((s) => s.weekday))].sort((a, b) => a - b);
}

/** "Mon, Wed, Fri", "Weekdays", "Weekends", "Every day". */
export function daysLabel(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Every day';
  if (sorted.join() === '0,1,2,3,4') return 'Weekdays';
  if (sorted.join() === '5,6') return 'Weekends';
  return sorted.map((d) => DAY_LONG[d].slice(0, 3)).join(', ');
}

/** The short summary for the Settings row: "7:00 pm · Plan days", or "Off". */
export function reminderSummary(reminder: Reminder | null): string {
  if (!reminder) return 'Off';
  return `${timeLabel(reminder.hour, reminder.minute)} · ${reminder.days ? daysLabel(reminder.days) : 'Plan days'}`;
}

function at(day: Date, hour: number, minute: number): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** A line for the time of day, so a morning reminder doesn't talk about bedtime. */
function moment(hour: number): string {
  if (hour < 11) return 'A good way to start the day.';
  if (hour < 17) return 'A good break from sitting.';
  return 'A calm way to end the day.';
}

/** The reminder for one day: what's planned, worded a little differently each day so it never reads like spam. */
export function sessionMessage(session: PlannedSession | undefined, hour: number, n: number): { title: string; body: string } {
  if (!session) {
    const titles = ['Time for a stretch', 'A few minutes for you', 'Ready when you are'];
    return { title: titles[n % titles.length], body: `Pick a quick session or one of your routines. ${moment(hour)}` };
  }
  const area = AREA_NAMES[session.areas[0]];
  const titles = [`Time for ${session.title}`, `Your ${session.minutes} minutes are ready`, `${area} feeling stiff?`, 'Ready when you are'];
  return {
    title: titles[n % titles.length],
    body: `${session.title} · ${session.minutes} min · ${session.exerciseIds.length} moves. ${moment(hour)}`,
  };
}

/**
 * Every reminder for the next two weeks, worked out from your plan, your reminder settings and what you've done.
 * - On each reminder day, at your time: what's planned that day (skipped today if you've already trained).
 * - Streak saver (on by default): 8 pm on plan days you get reminders on, if your reminder is earlier and you haven't trained yet.
 * - Come-back (on by default): after a few days away with a reminder missed, the next reminder becomes a welcome back.
 * - Week ahead (off by default): Sunday 6 pm, what next week holds.
 */
export function planReminders({ plan, reminder, history }: { plan: Plan; reminder: Reminder; history: CompletedSession[] }, now = new Date()): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const today = startOfDay(now);
  const trainedToday = history.some((h) => isSameDay(new Date(h.date), now));
  const days = reminderDays(plan, reminder);
  const planDays = new Set(plan.sessions.map((s) => s.weekday));
  const { hour, minute } = reminder;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const weekday = weekdayIndex(day);
    const done = i === 0 && trainedToday;
    const session = plan.sessions.find((s) => s.weekday === weekday);

    if (days.includes(weekday) && !done) {
      const time = at(day, hour, minute);
      if (time > now) {
        out.push({ date: time, ...sessionMessage(session, hour, day.getDate()), url: '/', kind: 'session' });
      }
    }
    if (reminder.streak !== false && planDays.has(weekday) && days.includes(weekday) && !done && hour < STREAK_HOUR - 1) {
      const time = at(day, STREAK_HOUR, 0);
      if (time > now) {
        out.push({
          date: time,
          title: 'Still time today',
          body: session ? `${session.title} is waiting: ${session.minutes} min. Even a few minutes keeps you on track.` : 'Even a few minutes keeps you on track.',
          url: '/',
          kind: 'streak',
        });
      }
    }
    if (reminder.weekly === true && weekday === WEEK_AHEAD.weekday) {
      const time = at(day, WEEK_AHEAD.hour, 0);
      if (time > now) {
        const count = plan.sessions.length;
        out.push({
          date: time,
          title: 'Your week ahead',
          body: `${count} ${count === 1 ? 'session' : 'sessions'} planned, ${plan.minutes} min each. Small and steady is how it sticks.`,
          url: '/plan',
          kind: 'week',
        });
      }
    }
  }

  // Come back: the first reminder at least a few days after your last session (or after starting), once a reminder day has
  // gone by without a session, says welcome back instead. Worked out ahead, as if nothing happens in between; finishing a
  // session rewrites everything, so it only shows if you really have been away. No extra notification, and only on your days.
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  if (reminder.comeback !== false) {
    const lastDay = startOfDay(history[0] ? new Date(history[0].date) : new Date(plan.createdAt));
    const earliest = addDays(lastDay, COMEBACK_DAYS);
    const target = out.find((n) => {
      if (n.kind !== 'session' || n.date < earliest) return false;
      const between = Math.round((startOfDay(n.date).getTime() - lastDay.getTime()) / 86400000);
      return Array.from({ length: Math.max(0, between - 1) }, (_, k) => addDays(lastDay, k + 1)).some((d) => days.includes(weekdayIndex(d)));
    });
    if (target) {
      const session = plan.sessions.find((s) => s.weekday === weekdayIndex(target.date));
      target.title = "It's been a few days";
      target.body = session
        ? `${session.title} · ${session.minutes} min is ready when you are. A few minutes is enough to get going again.`
        : 'A few minutes is enough to get going again. Your body will thank you.';
      target.kind = 'comeback';
    }
  }

  return out;
}
