/** A ready-made session for something you're doing or after, rather than a body part or a time of day. */
export type Category = {
  id: string;
  name: string;
  /** What it's for, in a few words. */
  line: string;
  /** The move whose picture stands for the category on its tile. */
  cover: string;
  /** The moves, in order: a gentle start, the main work, and a calm finish. */
  moves: string[];
};

/**
 * Training by category on Today. Each is one session, free for everyone, built for its purpose:
 * warm-ups move rather than hold, cool-downs and back relief end on the floor, posture opens the chest
 * and wakes the upper back. None repeats a Quick routine, so the two rows offer different things.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'warm-up',
    name: 'Warm-up',
    line: 'Before a workout: get moving, not cold-stretching',
    cover: 'hip-swing',
    moves: ['sh-rolls', 'el-circles', 'hip-swing', 'hip-sidelunge', 'hip-wgs', 'an-rock'],
  },
  {
    id: 'cool-down',
    name: 'Cool-down',
    line: 'After a workout: ease tight legs and hips',
    cover: 'kn-lyingham',
    moves: ['kn-quad', 'sh-cross', 'an-calf', 'hip-fig4', 'kn-lyingham', 'lb-child'],
  },
  {
    id: 'runners',
    name: 'Runners',
    line: 'Calves, quads and hips',
    cover: 'an-calf',
    moves: ['an-rock', 'an-calf', 'kn-quad', 'hip-lunge', 'ft-plantar', 'hip-fig4'],
  },
  {
    id: 'back',
    name: 'Back relief',
    line: 'Ease a stiff, achy back',
    cover: 'lb-sphinx',
    moves: ['ub-catcow', 'lb-sphinx', 'lb-hug', 'lb-twist', 'hip-fig4', 'lb-child'],
  },
  {
    id: 'posture',
    name: 'Posture',
    line: 'Open the chest, lift the upper back',
    cover: 'sh-doorway',
    moves: ['neck-tuck', 'sh-doorway', 'sh-goalpost', 'ub-wall', 'ub-thread', 'ub-puppy'],
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    line: 'Hips, hamstrings and spine',
    cover: 'hip-butterfly',
    moves: ['ub-catcow', 'lb-fold', 'hip-butterfly', 'hip-squat', 'kn-lyingham', 'hip-pigeon'],
  },
];
