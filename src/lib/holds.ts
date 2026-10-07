import type { Exercise } from '@/data/types';

/** A short pause before each move, to read it and get into position. */
export const READY_SECONDS = 5;

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
