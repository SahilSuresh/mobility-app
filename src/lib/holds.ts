import type { Exercise } from '@/data/types';

/** The rest before each stretch, to recover, hear what's next and get into position. The length is a setting; this is the default. */
export const READY_SECONDS = 5;
/** Rest lengths you can pick in Sound & timer. There's always a rest between stretches. */
export const READY_OPTIONS = [5, 10, 15] as const;

/** The rest length to use: the saved choice, or the default if it isn't one of the options (such as an old "Off"). */
export function restSeconds(saved: number): number {
  return (READY_OPTIONS as readonly number[]).includes(saved) ? saved : READY_SECONDS;
}

/** A length of time as said aloud: "45 seconds", "1 minute", "1 minute 30 seconds". */
export function spokenTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mins = m ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : '';
  const secs = s ? `${s} seconds` : '';
  return [mins, secs].filter(Boolean).join(' ');
}

/** Limits and step for adjusting a move's hold on the session preview. */
export const HOLD = { min: 10, max: 120, step: 5 } as const;

/** Your own hold times, in seconds per side, by exercise id. Moves without one use their default. */
export type Holds = Record<string, number>;

/** Seconds per side for a move, using your own time if you've set one. */
export function holdFor(e: Exercise, holds: Holds): number {
  return holds[e.id] ?? e.seconds;
}

/** Total seconds a move takes (both sides when needed), using your own time if you've set one. */
export function moveTime(e: Exercise, holds: Holds): number {
  return holdFor(e, holds) * (e.eachSide ? 2 : 1);
}
