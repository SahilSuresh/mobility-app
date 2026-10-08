import type { AreaId, Goal, Level, Minutes, DaysPerWeek, PoseKey } from './types';

export const GOALS: { id: Goal; label: string }[] = [
  { id: 'freely', label: 'Move freely' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'stiffness', label: 'Less stiffness' },
  { id: 'sport', label: 'Gym & sport' },
  { id: 'everyday', label: 'Everyday movement' },
];

export const GOAL_LABEL: Record<Goal, string> = Object.fromEntries(GOALS.map((g) => [g.id, g.label])) as Record<Goal, string>;

export const LEVELS: { id: Level; label: string; name: string }[] = [
  { id: 1, label: 'New to mobility', name: 'Beginner' },
  { id: 2, label: 'Some experience', name: 'Intermediate' },
  { id: 3, label: 'I train it regularly', name: 'Advanced' },
];

export const LEVEL_NAME: Record<Level, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

export const DAY_OPTIONS: DaysPerWeek[] = [2, 3, 4, 5, 7];
export const MINUTE_OPTIONS: Minutes[] = [5, 10, 15, 20];
/** Range for a custom session length. */
export const CUSTOM_MINUTES = { min: 3, max: 30, start: 25 } as const;

/** Which weekdays (0 = Monday) each weekly target uses. */
export const DAY_PATTERNS: Record<DaysPerWeek, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export type Programme = {
  id: string;
  title: string;
  meta: string;
  areas: AreaId[];
  days: number;
  minutes: Minutes;
  pose: PoseKey;
  color: string;
  /** Open to everyone, without Premium. */
  free?: boolean;
  /** Beginner moves only (level 1), whatever the user's level. */
  easy?: boolean;
  /** A shorter name for tight spaces, like the quick tiles on Today. */
  short?: string;
  /** What it's for, in a few words. Kept to one line on the programme row. */
  about: string;
  /**
   * The moves, in order: a gentle start, the main work, and a calm finish (the last move).
   * Short days drop moves from the middle; long days repeat the main work.
   */
  moves: string[];
  /** Harder moves that join from halfway through, once the body has had time to loosen. */
  later?: string[];
};

/** Ideas to build a routine from: each opens the builder with these moves already picked. */
export const ROUTINE_IDEAS: { id: string; name: string; line: string; moves: string[] }[] = [
  { id: 'desk', name: 'Desk break', line: 'Neck, chest and wrists', moves: ['neck-tuck', 'sh-doorway', 'neck-levator', 'wr-prayer', 'sh-reach'] },
  { id: 'run', name: 'Before a run', line: 'Hips, calves and quads', moves: ['hip-swing', 'an-calf', 'kn-quad', 'hip-lunge', 'hip-wgs'] },
  { id: 'bed', name: 'Bedtime', line: 'Slow and on the floor', moves: ['hip-butterfly', 'kn-lyingham', 'lb-twist', 'lb-hug', 'lb-child'] },
];

/**
 * Programmes. Each one has a purpose and a set sequence built for it, not just moves for its areas.
 * The quick ones are free; the rest are Premium.
 */
export const PROGRAMMES: Programme[] = [
  // Quick, easy and free: a ready-made session for however much time you have.
  {
    id: 'quick-2',
    title: '2-minute unwind',
    short: 'Unwind',
    meta: '2 min a day',
    areas: ['neck', 'shoulders'],
    days: 7,
    minutes: 2,
    pose: 'chinTuck',
    color: '#93A9BC',
    free: true,
    easy: true,
    about: 'Quick neck and shoulder release.',
    moves: ['neck-tuck', 'neck-tilt'],
  },
  {
    id: 'quick-5',
    title: '5-minute reset',
    short: 'Reset',
    meta: '5 min a day',
    areas: ['upperBack', 'lowerBack', 'hips'],
    days: 7,
    minutes: 5,
    pose: 'cat',
    color: '#9FBFA8',
    free: true,
    easy: true,
    about: 'Undo a long sit.',
    moves: ['ub-catcow', 'lb-twist', 'hip-lunge', 'lb-child'],
  },
  {
    id: 'quick-10',
    title: '10-minute flow',
    short: 'Flow',
    meta: '10 min a day',
    areas: ['shoulders', 'upperBack', 'lowerBack', 'hips', 'knees'],
    days: 7,
    minutes: 10,
    pose: 'twist',
    color: '#D9BE93',
    free: true,
    easy: true,
    about: 'A full-body flow, neck to ankles.',
    moves: ['ub-catcow', 'sh-reach', 'ub-thread', 'hip-lunge', 'lb-twist', 'hip-fig4', 'kn-lyingham', 'an-calf', 'lb-child'],
  },
  {
    id: 'back-relief',
    title: 'Lower back relief',
    meta: '14 days',
    areas: ['lowerBack', 'hips'],
    days: 14,
    minutes: 10,
    pose: 'hug',
    color: '#9FBFA8',
    about: 'Ease a stiff, achy lower back.',
    moves: ['lb-hug', 'lb-twist', 'ub-catcow', 'lb-sphinx', 'hip-fig4', 'kn-lyingham', 'lb-child'],
    later: ['lb-birddog', 'lb-bridge'],
  },
  {
    id: 'desk',
    title: 'Desk reset',
    meta: '5 min a day',
    areas: ['neck', 'shoulders', 'upperBack'],
    days: 7,
    minutes: 5,
    pose: 'reach',
    color: '#93A9BC',
    about: 'Undo screen time. No mat needed.',
    moves: ['neck-tuck', 'sh-doorway', 'neck-levator', 'ub-hug', 'sh-reach'],
  },
  {
    id: 'posture',
    title: 'Posture reset',
    meta: '14 days',
    areas: ['neck', 'shoulders', 'upperBack'],
    days: 14,
    minutes: 10,
    pose: 'goalpost',
    color: '#93A9BC',
    about: 'Open your chest and stand taller.',
    moves: ['neck-tuck', 'ub-catcow', 'sh-doorway', 'ub-thread', 'ub-puppy', 'ub-wall', 'hip-lunge', 'lb-child'],
    later: ['lb-birddog', 'sh-goalpost'],
  },
  {
    id: 'hips-14',
    title: '14-day hips',
    meta: '14 days',
    areas: ['hips'],
    days: 14,
    minutes: 10,
    pose: 'lunge',
    color: '#9FBFA8',
    about: 'Freer hips, building over two weeks.',
    moves: ['hip-swing', 'hip-lunge', 'hip-butterfly', 'hip-fig4', 'hip-sidelunge', 'lb-bridge', 'lb-twist'],
    later: ['hip-wgs', 'hip-squat', 'hip-pigeon'],
  },
  {
    id: 'morning',
    title: 'Morning flow',
    meta: '7 days',
    areas: ['upperBack', 'lowerBack', 'hips'],
    days: 7,
    minutes: 10,
    pose: 'cat',
    color: '#D9BE93',
    about: 'Shake off overnight stiffness.',
    moves: ['ub-catcow', 'lb-sphinx', 'ub-thread', 'hip-lunge', 'sh-reach', 'an-calf', 'ft-raise'],
    later: ['hip-wgs', 'an-dog'],
  },
  {
    id: 'sleep',
    title: 'Wind down',
    meta: '7 days',
    areas: ['lowerBack', 'hips', 'neck'],
    days: 7,
    minutes: 10,
    pose: 'child',
    color: '#93A9BC',
    easy: true,
    about: 'Slow floor stretches before bed.',
    moves: ['neck-tilt', 'hip-butterfly', 'kn-lyingham', 'hip-fig4', 'lb-twist', 'lb-hug', 'lb-child'],
  },
  {
    id: 'runner',
    title: "Runner's recovery",
    meta: '7 days',
    areas: ['hips', 'knees', 'ankles', 'feet'],
    days: 7,
    minutes: 10,
    pose: 'calf',
    color: '#D49A7C',
    about: 'Calves, hips and feet after a run.',
    moves: ['an-calf', 'kn-quad', 'hip-lunge', 'kn-lyingham', 'hip-fig4', 'hip-sidelunge', 'an-rock', 'ft-plantar'],
  },
  {
    id: 'post-gym',
    title: 'Post-gym',
    meta: '7 days',
    areas: ['hips', 'knees', 'ankles'],
    days: 7,
    minutes: 10,
    pose: 'squat',
    color: '#D49A7C',
    about: 'Cool down the legs and hips you worked.',
    moves: ['hip-lunge', 'kn-quad', 'kn-lyingham', 'hip-fig4', 'an-calf', 'hip-sidelunge', 'lb-child'],
    later: ['hip-pigeon', 'kn-couch'],
  },
  {
    id: 'hands',
    title: 'Hands & wrists',
    meta: '5 min a day',
    areas: ['wrists', 'elbows'],
    days: 7,
    minutes: 5,
    pose: 'prayer',
    color: '#D9BE93',
    about: 'For wrists tired from typing and phones.',
    moves: ['wr-circles', 'wr-pull', 'el-extensor', 'el-turn', 'wr-prayer'],
  },
];
