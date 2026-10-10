export type DayPart = 'morning' | 'midday' | 'evening' | 'night';

/** A short session built for one part of the day. The moves are in order: gentle start, main work, calm finish. */
export type TimeStretch = {
  id: DayPart;
  name: string;
  /** What it's for, in a few words. */
  line: string;
  moves: string[];
};

/**
 * Stretches for the time of day, in the order the day runs.
 * Morning wakes the body up standing and on all fours; midday needs no mat, for a desk or a break;
 * evening and bedtime are slow and on the floor, ending in child's pose.
 */
export const TIME_STRETCHES: TimeStretch[] = [
  {
    id: 'morning',
    name: 'Morning wake-up',
    line: 'Shake off the stiffness from sleep',
    moves: ['neck-roll', 'sh-rolls', 'ub-catcow', 'sh-reach', 'hip-lunge', 'an-calf'],
  },
  {
    id: 'midday',
    name: 'Desk break',
    line: 'Undo sitting, no mat needed',
    moves: ['neck-tuck', 'sh-doorway', 'ub-twist', 'wr-prayer', 'sh-cross', 'kn-quad'],
  },
  {
    id: 'evening',
    name: 'Evening unwind',
    line: 'Let go of the day',
    moves: ['ub-thread', 'hip-fig4', 'lb-twist', 'kn-lyingham', 'lb-child'],
  },
  {
    id: 'night',
    name: 'Before bed',
    line: 'Slow and on the floor, to settle for sleep',
    moves: ['neck-tilt', 'hip-butterfly', 'lb-hug', 'lb-twist', 'lb-child'],
  },
];

/** Which part of the day it is: morning 5 to 11, midday 11 to 5, evening 5 to 9, then night. */
export function dayPartAt(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
