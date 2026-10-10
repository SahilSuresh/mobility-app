import { AREA_NAMES, areasLabel, FOCUS_TITLES, sortAreas } from '@/data/areas';
import type { Category } from '@/data/categories';
import { DAY_PATTERNS, type Programme } from '@/data/content';
import { EXERCISES, moveSeconds } from '@/data/exercises';
import { POSITION, type Position } from '@/data/poses';
import type { TimeStretch } from '@/data/timeOfDay';
import type { AreaId, DaysPerWeek, Exercise, Goal, Level, Minutes, Plan, PlannedSession, Routine, SessionKind } from '@/data/types';
import { weekdayIndex } from './dates';

export type AreaLevels = Partial<Record<AreaId, Level>>;

/** Seconds allowed between moves when filling a session. */
const TRANSITION = 10;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(seed: number, id: string): number {
  return (hash(`${seed}:${id}`) % 1000) / 1000;
}

type PickInput = {
  areas: AreaId[];
  levels: AreaLevels;
  fallbackLevel: Level;
  goal: Goal;
  minutes: Minutes;
  recovery: boolean;
  seed: number;
};

/** Areas that share muscles, used to add variety when an area has few moves at someone's level. */
const NEIGHBOURS: Record<AreaId, AreaId[]> = {
  neck: ['shoulders', 'upperBack'],
  shoulders: ['upperBack', 'neck', 'elbows'],
  elbows: ['wrists', 'shoulders'],
  wrists: ['elbows', 'shoulders'],
  upperBack: ['shoulders', 'lowerBack'],
  lowerBack: ['hips', 'upperBack'],
  hips: ['lowerBack', 'knees'],
  knees: ['hips', 'ankles'],
  ankles: ['knees', 'feet'],
  feet: ['ankles', 'knees'],
};

/** Moves for one area at or below a level: moves at the level first, then ones that suit the goal. */
function rankedMoves(area: AreaId, level: Level, goal: Goal, seed: number): Exercise[] {
  return EXERCISES.filter((e) => e.area === area && e.level <= level)
    .map((e) => ({ e, score: (e.level === level ? 2 : 0) + (e.goals.includes(goal) ? 1 : 0) + jitter(seed, e.id) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}

/** Takes one move from each list in turn, so every area gets time. */
function interleave(lists: Exercise[][]): Exercise[] {
  const out: Exercise[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (list[i]) out.push(list[i]);
    }
  }
  return out;
}

/** Spreads extra moves evenly between the main ones. */
function spread(main: Exercise[], extra: Exercise[]): Exercise[] {
  if (extra.length === 0) return main;
  const out: Exercise[] = [];
  const step = (main.length + 1) / (extra.length + 1);
  let j = 0;
  main.forEach((e, i) => {
    out.push(e);
    while (j < extra.length && (j + 1) * step <= i + 1) out.push(extra[j++]);
  });
  while (j < extra.length) out.push(extra[j++]);
  return out;
}

/**
 * Rule-based selection. Experience level decides which moves are allowed (it matters most);
 * the goal only nudges the order. Areas are interleaved so each gets time. When an area has
 * few moves at someone's level, related areas fill in, so a session is never two moves on a
 * loop. The list is then done in up to two rounds until the session length is filled, so no
 * move appears more than twice.
 */
export function pickExercises({ areas, levels, fallbackLevel, goal, minutes, recovery, seed }: PickInput): string[] {
  const budget = minutes * 60;
  const sorted = sortAreas(areas);
  const levelOf = (area: AreaId): Level => (recovery ? 1 : (levels[area] ?? fallbackLevel));

  const main = interleave(sorted.map((area) => rankedMoves(area, levelOf(area), goal, seed)));

  // Enough different moves to fill at least half the session (the rest is a second round), and at least five.
  const cost = (e: Exercise) => moveSeconds(e) + TRANSITION;
  const enough = (list: Exercise[]) => list.length >= 5 && list.reduce((t, e) => t + cost(e), 0) >= budget / 2;
  const borrowed: Exercise[] = [];
  const seen = new Set<AreaId>(sorted);
  let ring: AreaId[] = sorted;
  // Look one step further out each time: neighbours, then their neighbours.
  while (!enough([...main, ...borrowed])) {
    ring = [...new Set(ring.flatMap((a) => NEIGHBOURS[a]))].filter((a) => !seen.has(a));
    if (ring.length === 0) break;
    ring.forEach((a) => seen.add(a));
    for (const e of interleave(ring.map((area) => rankedMoves(area, levelOf(area), goal, seed)))) {
      if (enough([...main, ...borrowed])) break;
      borrowed.push(e);
    }
  }
  const order = spread(main, borrowed);
  if (order.length === 0) return [];

  const picked: string[] = [];
  let used = 0;
  // Up to 24 moves, or about one a minute for longer sessions, so a custom 30-minute session still fills.
  const maxMoves = Math.max(24, Math.ceil(budget / 60));
  for (let round = 0; round < 2 && used < budget - 20; round++) {
    for (const e of order) {
      if (picked.length >= maxMoves) break;
      // Never the same move twice in a row, and skip moves too long for the time left.
      if (picked[picked.length - 1] === e.id) continue;
      if (picked.length >= 3 && used + cost(e) > budget + 20) continue;
      picked.push(e.id);
      used += cost(e);
    }
  }
  return picked;
}

export function sessionTitle(kind: SessionKind, areas: AreaId[]): string {
  if (kind === 'recovery') return 'Recovery flow';
  const sorted = sortAreas(areas);
  if (sorted.length === 1) return kind === 'mixed' ? AREA_NAMES[sorted[0]] : FOCUS_TITLES[sorted[0]];
  if (sorted.length === 2) return sorted.map((a) => AREA_NAMES[a]).join(' + ');
  return 'Full-body flow';
}

type PlanInput = {
  areas: AreaId[];
  goal: Goal;
  level: Level;
  days: DaysPerWeek;
  minutes: Minutes;
  levels: AreaLevels;
  /** Weekday (0 = Monday) the plan starts on. The week's pattern is laid out from here, so the first session lands on it. */
  startDay?: number;
  /** Days picked by hand. When set, these replace the preset spread. */
  weekdays?: number[];
};

/** The weekday a plan started on. */
export function planStartDay(plan: Pick<Plan, 'createdAt'>): number {
  return weekdayIndex(new Date(plan.createdAt));
}

/**
 * Weekly template: alternate "all your areas" sessions with single-area focus sessions,
 * and finish weeks of 4+ sessions with a gentle recovery flow.
 */
export function generateSessions({ areas, goal, level, days, minutes, levels, startDay = 0, weekdays: picked }: PlanInput): PlannedSession[] {
  const sorted = sortAreas(areas);
  // Days picked by hand, or the preset's spacing shifted to begin on the start day (wrapping into the next week).
  // Either way they're taken in order from the start day, so the week's sequence begins with the first one coming up.
  const fromStart = (d: number) => (d - startDay + 7) % 7;
  const weekdays = (picked?.length ? [...new Set(picked)] : DAY_PATTERNS[days].map((offset) => (startDay + offset) % 7)).sort((a, b) => fromStart(a) - fromStart(b));
  const n = weekdays.length;
  let focus = 0;

  const sessions = weekdays.map((weekday, i) => {
    let kind: SessionKind;
    let sessionAreas: AreaId[];
    if (i === n - 1 && n >= 4) {
      kind = 'recovery';
      sessionAreas = sorted;
    } else if (sorted.length === 1) {
      kind = 'focus';
      sessionAreas = sorted;
    } else if (i % 2 === 0) {
      kind = 'mixed';
      sessionAreas = sorted;
    } else {
      kind = 'focus';
      sessionAreas = [sorted[sorted.length - 1 - (focus % sorted.length)]];
      focus += 1;
    }
    return {
      id: `s${i}`,
      weekday,
      title: sessionTitle(kind, sessionAreas),
      kind,
      areas: sessionAreas,
      exerciseIds: pickExercises({ areas: sessionAreas, levels, fallbackLevel: level, goal, minutes, recovery: kind === 'recovery', seed: i + 1 }),
      minutes,
    };
  });
  // Stored in weekday order (Monday first), which the week logic relies on.
  return sessions.sort((a, b) => a.weekday - b.weekday);
}

export function buildPlan(input: PlanInput): Plan {
  const now = new Date();
  return {
    areas: sortAreas(input.areas),
    goal: input.goal,
    level: input.level,
    days: input.weekdays?.length ?? input.days,
    weekdays: input.weekdays?.length ? input.weekdays : undefined,
    minutes: input.minutes,
    sessions: generateSessions({ ...input, startDay: input.startDay ?? weekdayIndex(now) }),
    createdAt: now.toISOString(),
  };
}

/** How long you can choose to train one body part for, in minutes. */
export const AREA_MINUTES = [2, 5, 10, 15] as const;

/**
 * The body parts you choose, for as long as you choose. Moves suit your level for each area, alternate between
 * the areas (like a planned session) and are trimmed to fit the time. The same moves come up all day, so what
 * the picker shows is exactly what starts.
 */
export function makeAreasSession(areas: AreaId[], minutes: number, plan: Plan, levels: AreaLevels): PlannedSession {
  const sorted = sortAreas(areas);
  const seed = Math.floor(Date.now() / 86_400_000) % 997;
  const picked = pickExercises({ areas: sorted, levels, fallbackLevel: plan.level, goal: plan.goal, minutes, recovery: false, seed });
  const name = sorted.length === 1 ? AREA_NAMES[sorted[0]] : areasLabel(sorted);
  return {
    id: `train-${sorted.join('-')}-${minutes}`,
    weekday: weekdayIndex(new Date()),
    title: `${name}, ${minutes} min`,
    kind: 'focus',
    areas: sorted,
    exerciseIds: fitToMinutes(picked, minutes),
    minutes,
  };
}

/** One body part, for as long as you choose. */
export function makeAreaSession(area: AreaId, minutes: number, plan: Plan, levels: AreaLevels): PlannedSession {
  return makeAreasSession([area], minutes, plan, levels);
}

/** How long a list of moves takes, rounded to whole minutes (at least one), counting the pause between moves. */
/** One of your routines as a session: its moves in your order, played through `rounds` times. */
/** A time-of-day stretch (morning, midday, evening, bedtime) as a session the player can run, moves in their set order. */
export function timeOfDaySession(stretch: TimeStretch): PlannedSession {
  return setSession(`time-${stretch.id}`, stretch.name, stretch.moves);
}

/** A category on Today (Runners, Posture and so on) as a session the player can run, moves in their set order. */
export function categorySession(category: Category): PlannedSession {
  return setSession(`category-${category.id}`, category.name, category.moves);
}

/** A ready-made list of moves as a session, played in the order given. */
function setSession(id: string, title: string, moves: string[]): PlannedSession {
  const exerciseIds = moves.filter((m) => EXERCISES.some((e) => e.id === m));
  const areas = sortAreas([...new Set(exerciseIds.map((m) => EXERCISES.find((e) => e.id === m)?.area).filter((a): a is AreaId => !!a))]);
  return {
    id,
    weekday: weekdayIndex(new Date()),
    title,
    kind: 'custom',
    areas,
    exerciseIds,
    minutes: minutesForMoves(exerciseIds),
  };
}

export function routineSession(routine: Routine): PlannedSession {
  const moves = routine.moves.filter((id) => EXERCISES.some((e) => e.id === id));
  const exerciseIds = Array.from({ length: Math.max(1, routine.rounds) }, () => moves).flat();
  const areas = sortAreas([...new Set(moves.map((id) => EXERCISES.find((e) => e.id === id)?.area).filter((a): a is AreaId => !!a))]);
  return {
    id: `routine-${routine.id}`,
    weekday: weekdayIndex(new Date()),
    title: routine.name,
    kind: 'custom',
    areas,
    exerciseIds,
    minutes: minutesForMoves(exerciseIds),
    routineId: routine.id,
  };
}

/**
 * Orders moves so you get down to the floor once: standing first, then kneeling, sitting and lying,
 * keeping your own order within each. The calmest moves end up last.
 */
export function fewerUpsAndDowns(ids: string[]): string[] {
  const rank: Record<Position, number> = { standing: 0, kneeling: 1, seated: 2, lying: 3 };
  const at = (id: string) => {
    const e = EXERCISES.find((x) => x.id === id);
    return e ? rank[POSITION[e.pose]] : 0;
  };
  return ids.map((id, i) => ({ id, i })).sort((a, b) => at(a.id) - at(b.id) || a.i - b.i).map((x) => x.id);
}

export function minutesForMoves(ids: string[]): number {
  const seconds = ids.reduce((t, id) => {
    const e = EXERCISES.find((x) => x.id === id);
    return e ? t + moveSeconds(e) + TRANSITION : t;
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}

/**
 * Just one area's moves from a session, in the same order, to train that area on its own. It doesn't stand in
 * for the planned session, so finishing it is recorded but doesn't tick the full session off.
 */
export function areaSession(base: PlannedSession, area: AreaId): PlannedSession {
  const exerciseIds = base.exerciseIds.filter((id) => EXERCISES.find((e) => e.id === id)?.area === area);
  return {
    id: `area-${area}`,
    weekday: base.weekday,
    title: `${AREA_NAMES[area]} only`,
    kind: 'focus',
    areas: [area],
    exerciseIds,
    minutes: minutesForMoves(exerciseIds),
  };
}

/**
 * Drops moves from the end until a session fits its minutes, keeping at least two. Normal sessions always
 * start with three moves, which would turn a 2-minute programme into nearly four.
 */
function fitToMinutes(ids: string[], minutes: number): string[] {
  const budget = minutes * 60 + 20;
  const out: string[] = [];
  let used = 0;
  for (const id of ids) {
    const e = EXERCISES.find((x) => x.id === id);
    if (!e) continue;
    const cost = moveSeconds(e) + TRANSITION;
    if (out.length >= 2 && used + cost > budget) break;
    out.push(id);
    used += cost;
  }
  return out;
}

/**
 * A programme's moves for one day, sized to its minutes. The first move (the gentle start) and the last (the calm finish)
 * always stay. From halfway through, the harder `later` moves come in near the end, once you're warm, and are kept first;
 * the main moves fill the time left, in order. A long day goes round the main moves again.
 */
export function programmeMoves(programme: Programme, day: number): string[] {
  const known = (ids: string[]) => ids.filter((id) => EXERCISES.some((e) => e.id === id));
  const [first, ...rest] = known(programme.moves);
  if (!first) return [];
  const finish = rest.length ? rest[rest.length - 1] : null;
  const main = rest.slice(0, -1);
  const later = programme.later && day > Math.ceil(programme.days / 2) ? known(programme.later) : [];

  const cost = (id: string) => {
    const e = EXERCISES.find((x) => x.id === id);
    return e ? moveSeconds(e) + TRANSITION : 0;
  };
  const budget = programme.minutes * 60 + 20;
  let used = cost(first) + (finish ? cost(finish) : 0) + later.reduce((t, id) => t + cost(id), 0);

  const middle: string[] = [];
  for (let round = 0; round < 3 && main.length; round++) {
    let added = false;
    for (const id of main) {
      if (middle[middle.length - 1] === id || used + cost(id) > budget) continue;
      middle.push(id);
      used += cost(id);
      added = true;
    }
    if (!added || used >= budget - 30) break;
  }
  return [first, ...middle, ...later, ...(finish ? [finish] : [])];
}

/** Today's session for a programme: its own sequence for this day. */
export function makeProgrammeSession(programme: Programme, day: number, plan: Plan, levels: AreaLevels): PlannedSession {
  // Every programme has its own moves; the area picker is only a fallback if none of them exist.
  const own = programmeMoves(programme, day);
  const picked = own.length
    ? own
    : pickExercises({
        areas: programme.areas,
        levels,
        fallbackLevel: plan.level,
        goal: plan.goal,
        minutes: programme.minutes,
        recovery: !!programme.easy,
        seed: day * 31,
      });
  return {
    id: `prog-${programme.id}`,
    weekday: weekdayIndex(new Date()),
    title: `${programme.title} · Day ${day}`,
    kind: 'programme',
    areas: programme.areas,
    exerciseIds: own.length ? own : fitToMinutes(picked, programme.minutes),
    minutes: programme.minutes,
    programmeId: programme.id,
  };
}
