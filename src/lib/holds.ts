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

/** The short break in the middle of a two-sided move, to change to the other side. */
export const SWITCH_SECONDS = 3;

/** The voice counts down the last this-many seconds of every hold: "5, 4, 3, 2, 1". */
export const COUNTDOWN = 5;

/** Total seconds a move takes (both sides and the switch between them when needed), using your own time if you've set one. */
export function moveTime(e: Exercise, holds: Holds): number {
  const hold = holdFor(e, holds);
  return e.eachSide ? hold * 2 + SWITCH_SECONDS : hold;
}

/** Whole minutes for a list of moves with your own holds and rest, the same sum the session preview shows. */
export function sessionMinutes(moves: Exercise[], holds: Holds, readySeconds: number): number {
  const seconds = moves.reduce((t, e) => t + moveTime(e, holds) + readySeconds, 0);
  return Math.max(1, Math.round(seconds / 60));
}
