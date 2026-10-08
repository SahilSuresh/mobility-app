export type AreaId = 'neck' | 'shoulders' | 'elbows' | 'wrists' | 'upperBack' | 'lowerBack' | 'hips' | 'knees' | 'ankles' | 'feet';
export type BodyView = 'front' | 'back';

export type Goal = 'freely' | 'flexibility' | 'stiffness' | 'sport' | 'everyday';
/** 1 = new to mobility, 2 = some experience, 3 = trains it regularly. */
export type Level = 1 | 2 | 3;
/** Sessions a week: one of the presets (2, 3, 4, 5, 7), or 1 to 7 when the days are picked by hand. */
export type DaysPerWeek = number;
/** Session length in whole minutes: one of the presets, or a custom length in the custom range. */
export type Minutes = number;
export type Feedback = 'easy' | 'right' | 'hard';
export type Equipment = 'none' | 'mat' | 'wall';

export type PoseKey =
  | 'reach'
  | 'fold'
  | 'child'
  | 'cat'
  | 'lunge'
  | 'butterfly'
  | 'cobra'
  | 'hug'
  | 'seated'
  | 'neck'
  | 'chinTuck'
  | 'armCross'
  | 'goalpost'
  | 'sideBend'
  | 'thread'
  | 'twist'
  | 'bridge'
  | 'pigeon'
  | 'legSwing'
  | 'squat'
  | 'quad'
  | 'couch'
  | 'heelSit'
  | 'ankleRock'
  | 'downDog'
  | 'calf'
  | 'armsOut'
  | 'wristCircle'
  | 'prayer'
  | 'reversePrayer'
  | 'fingerPull'
  | 'forearmTurn'
  | 'wallArm'
  | 'tabletop'
  | 'footFlex'
  | 'calfRaise'
  | 'doorway'
  | 'sphinx'
  | 'supineTwist'
  | 'legRaise'
  | 'birdDog'
  | 'puppy'
  | 'sideLunge'
  | 'triceps'
  | 'lungeReach';

export type Exercise = {
  id: string;
  name: string;
  area: AreaId;
  level: Level;
  pose: PoseKey;
  /** Hold time. Doubled when `eachSide` is true. */
  seconds: number;
  eachSide: boolean;
  equipment: Equipment;
  goals: Goal[];
  /** One line shown in the session player. */
  tip: string;
  /** Why this move is worth doing: what it does for you, in plain words. Shown on the exercise screen. */
  why: string;
  /** When to ease off or skip it, for moves that need care. */
  careful?: string;
  /** Short numbered steps shown on the exercise screen. */
  steps: string[];
};

export type SessionKind = 'mixed' | 'focus' | 'recovery' | 'quick' | 'programme' | 'custom';

export type PlannedSession = {
  id: string;
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  title: string;
  kind: SessionKind;
  areas: AreaId[];
  exerciseIds: string[];
  minutes: Minutes;
  programmeId?: string;
  /** For one of your own routines: which one, so finishing it is remembered on its card. */
  routineId?: string;
  /** For an adjusted version of a planned session: the planned session it stands in for, so finishing it counts. */
  replaces?: string;
};

/** A routine you built yourself from any stretches, in your own order, saved to do again. */
export type Routine = {
  id: string;
  name: string;
  /** Exercise ids, in the order they play. */
  moves: string[];
  /** How many times the whole list plays through: 1, 2 or 3. */
  rounds: number;
  createdAt: string;
  /** When you last finished it. */
  lastDone?: string;
};

export type Plan = {
  areas: AreaId[];
  goal: Goal;
  level: Level;
  days: DaysPerWeek;
  /** Days picked by hand (0 = Monday). When set, sessions go on exactly these days instead of the preset spread. */
  weekdays?: number[];
  minutes: Minutes;
  sessions: PlannedSession[];
  createdAt: string;
};

export type CompletedSession = {
  id: string;
  sessionId: string;
  title: string;
  areas: AreaId[];
  firstPose: PoseKey;
  date: string;
  seconds: number;
  moves: number;
  feedback?: Feedback;
};

export type ReminderSlot = 'morning' | 'afternoon' | 'evening' | 'custom';
export type Reminder = {
  slot: ReminderSlot;
  hour: number;
  minute: number;
  /** The days to remind on (0 = Monday), or undefined for your plan's days. */
  days?: number[];
  /** Streak saver: an 8 pm nudge on plan days you haven't trained yet. On unless turned off. */
  streak?: boolean;
  /** Come-back nudge: after a few days without a session. On unless turned off. */
  comeback?: boolean;
  /** Week ahead: Sunday evening, what next week holds. Off unless turned on. */
  weekly?: boolean;
};
