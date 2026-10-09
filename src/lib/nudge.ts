import type { Plan } from '@/data/types';
import type { NudgeState } from '@/store/useAppStore';

/**
 * The Premium pop-up on Today: a friendly reminder of what Premium unlocks, shown as you open (or come back to)
 * the app, like Bend does. It's kept from getting annoying:
 *
 * - never for anyone with Premium, including a free trial;
 * - never right after onboarding (the paywall has just been seen there);
 * - at most once every `GAPS_HOURS[0]` hours, and each "Not now" makes it wait longer, up to once a week;
 * - seeing the full paywall any other way restarts the wait too.
 */

/** Hours to wait before showing it again, by how many times in a row it's been dismissed. The last value repeats. */
export const GAPS_HOURS = [12, 24, 72, 168] as const;

/** No pop-up in the first this-many minutes after making a plan: they've just seen the paywall. */
const SETTLE_MINUTES = 30;

const HOUR = 60 * 60 * 1000;

export function nudgeGapHours(dismissals: number): number {
  return GAPS_HOURS[Math.min(dismissals, GAPS_HOURS.length - 1)];
}

/** Whether the pop-up may show now. */
export function shouldNudge({ isPremium, plan, nudge }: { isPremium: boolean; plan: Plan | null; nudge: NudgeState }, now: Date): boolean {
  if (isPremium || !plan) return false;
  if (now.getTime() - new Date(plan.createdAt).getTime() < SETTLE_MINUTES * 60 * 1000) return false;
  if (!nudge.lastShown) return true;
  return now.getTime() - new Date(nudge.lastShown).getTime() >= nudgeGapHours(nudge.dismissals) * HOUR;
}
