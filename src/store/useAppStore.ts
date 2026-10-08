import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { sortAreas } from '@/data/areas';
import { PROGRAMMES } from '@/data/content';
import { getExercise } from '@/data/exercises';
import type {
  AreaId,
  CompletedSession,
  DaysPerWeek,
  Feedback,
  Goal,
  Level,
  Minutes,
  Plan,
  PlannedSession,
  Reminder,
  Routine,
} from '@/data/types';
import { syncNotifications } from '@/lib/notifications';
import { READY_SECONDS, type Holds } from '@/lib/holds';
import { buildPlan, generateSessions, makeProgrammeSession, planStartDay, type AreaLevels } from '@/lib/plan';

/** Device storage that never blocks the app: if saving or loading fails, it carries on without it. */
const safeStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key).catch(() => null),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value).catch(() => undefined),
  removeItem: (key: string) => AsyncStorage.removeItem(key).catch(() => undefined),
};

type Draft = { areas: AreaId[]; goal: Goal; level: Level; days: DaysPerWeek; weekdays?: number[]; minutes: Minutes };
export type SoundSettings = { moveEnd: boolean; readyEnd: boolean; voice: boolean };
type Flags = { seenPaywall: boolean; seenReminder: boolean };

type Data = {
  draft: Draft;
  plan: Plan | null;
  areaLevels: AreaLevels;
  history: CompletedSession[];
  /** The current one-off session (stiff-today or programme day). */
  extra: PlannedSession | null;
  isPremium: boolean;
  reminder: Reminder | null;
  flags: Flags;
  programmeDays: Record<string, number>;
  /** Your own hold times per move, set on the session preview. */
  holds: Holds;
  /** Session sounds, set in Sound & timer: chimes when each move ends and when the get-ready pause ends, and the move's name said aloud. */
  sounds: SoundSettings;
  /** Seconds of get-ready before each move (0 = none). */
  readySeconds: number;
  /** How long to train one body part from Today's "Explore by body part", remembered between visits. */
  areaMinutes: number;
  /** Your own routines, built on the Routines tab, newest first. */
  routines: Routine[];
};

type Actions = {
  setDraft: (patch: Partial<Draft>) => void;
  createPlan: () => void;
  updatePlan: (patch: Partial<Pick<Plan, 'areas' | 'days' | 'weekdays' | 'minutes'>>) => void;
  recordSession: (session: PlannedSession, seconds: number, moves: number) => string;
  setFeedback: (recordId: string, feedback: Feedback) => void;
  /** Keep a one-off session (such as an adjusted version of today's) so the player can open it. */
  startCustom: (session: PlannedSession) => void;
  startProgramme: (programmeId: string) => PlannedSession | null;
  setPremium: (value: boolean) => void;
  setReminder: (reminder: Reminder | null) => void;
  setFlag: (flag: keyof Flags) => void;
  /** Set your own hold for a move (seconds per side), or null to go back to its default. */
  setHold: (exerciseId: string, seconds: number | null) => void;
  setSound: (key: keyof SoundSettings, on: boolean) => void;
  setReadySeconds: (seconds: number) => void;
  setAreaMinutes: (minutes: number) => void;
  /** Save a routine: a new one (no id) goes to the top; an existing one is updated in place. Returns its id. */
  saveRoutine: (routine: Pick<Routine, 'name' | 'moves' | 'rounds'> & { id?: string }) => string;
  deleteRoutine: (id: string) => void;
  reset: () => void;
};

export type AppState = Data & Actions;

const initialData: Data = {
  draft: { areas: ['lowerBack', 'hips'], goal: 'freely', level: 1, days: 4, minutes: 10 },
  plan: null,
  areaLevels: {},
  history: [],
  extra: null,
  isPremium: false,
  reminder: null,
  flags: { seenPaywall: false, seenReminder: false },
  programmeDays: {},
  holds: {},
  sounds: { moveEnd: true, readyEnd: true, voice: true },
  readySeconds: READY_SECONDS,
  areaMinutes: 5,
  routines: [],
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function clampLevel(n: number): Level {
  return Math.min(3, Math.max(1, n)) as Level;
}

function levelsFor(areas: AreaId[], existing: AreaLevels, fallback: Level): AreaLevels {
  const out: AreaLevels = {};
  for (const a of areas) out[a] = existing[a] ?? fallback;
  return out;
}

/** How much each answer moves the level: easy up, hard down, just right nowhere. */
const FEEDBACK_STEP: Record<Feedback, number> = { easy: 1, right: 0, hard: -1 };

/** Rewrites reminders after anything they depend on changes: the plan, the reminder settings, or a finished session. */
function syncReminders(): void {
  const { plan, reminder, history } = useAppStore.getState();
  syncNotifications({ plan, reminder, history }).catch(() => undefined);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      createPlan: () => {
        const { draft } = get();
        const levels = levelsFor(draft.areas, {}, draft.level);
        set({ plan: buildPlan({ ...draft, levels }), areaLevels: levels });
      },

      updatePlan: (patch) => {
        const { plan, areaLevels } = get();
        if (!plan) return;
        const next = { ...plan, ...patch, areas: sortAreas(patch.areas ?? plan.areas) };
        const levels = levelsFor(next.areas, areaLevels, plan.level);
        const updated = { ...next, sessions: generateSessions({ ...next, levels, startDay: planStartDay(plan) }) };
        set({
          plan: updated,
          areaLevels: { ...areaLevels, ...levels },
          draft: { ...get().draft, areas: next.areas, days: next.days, weekdays: next.weekdays, minutes: next.minutes },
        });
        syncReminders();
      },

      recordSession: (session, seconds, moves) => {
        const id = newId();
        const first = getExercise(session.exerciseIds[0]);
        const record: CompletedSession = {
          id,
          sessionId: session.replaces ?? session.id,
          title: session.title,
          areas: session.areas,
          firstPose: first?.pose ?? 'child',
          date: new Date().toISOString(),
          seconds,
          moves,
        };
        set((s) => ({
          history: [record, ...s.history],
          routines: session.routineId ? s.routines.map((r) => (r.id === session.routineId ? { ...r, lastDone: record.date } : r)) : s.routines,
          programmeDays: session.programmeId
            ? { ...s.programmeDays, [session.programmeId]: (s.programmeDays[session.programmeId] ?? 0) + 1 }
            : s.programmeDays,
        }));
        // Today's remaining reminders go quiet now you've trained.
        syncReminders();
        return id;
      },

      setFeedback: (recordId, feedback) => {
        const { history, isPremium, plan, areaLevels } = get();
        const record = history.find((h) => h.id === recordId);
        if (!record || record.feedback === feedback) return;
        set({ history: history.map((h) => (h.id === recordId ? { ...h, feedback } : h)) });
        // Adaptive difficulty is a Premium feature: free users' feedback is stored only.
        if (!isPremium || !plan) return;
        // Changing an answer undoes the previous one first, so tapping around never stacks up.
        const step = FEEDBACK_STEP[feedback] - (record.feedback ? FEEDBACK_STEP[record.feedback] : 0);
        if (step === 0) return;
        const levels: AreaLevels = { ...areaLevels };
        for (const a of record.areas) levels[a] = clampLevel((levels[a] ?? plan.level) + step);
        set({ areaLevels: levels, plan: { ...plan, sessions: generateSessions({ ...plan, levels, startDay: planStartDay(plan) }) } });
        syncReminders();
      },

      startCustom: (session) => set({ extra: session }),

      startProgramme: (programmeId) => {
        const { plan, areaLevels, programmeDays } = get();
        const programme = PROGRAMMES.find((p) => p.id === programmeId);
        if (!plan || !programme) return null;
        const day = Math.min(programme.days, (programmeDays[programmeId] ?? 0) + 1);
        const session = makeProgrammeSession(programme, day, plan, areaLevels);
        set({ extra: session });
        return session;
      },

      setPremium: (value) => set({ isPremium: value }),
      setReminder: (reminder) => {
        set({ reminder });
        syncReminders();
      },
      setFlag: (flag) => set((s) => ({ flags: { ...s.flags, [flag]: true } })),
      setSound: (key, on) => set((s) => ({ sounds: { ...s.sounds, [key]: on } })),
      setReadySeconds: (seconds) => set({ readySeconds: seconds }),
      setAreaMinutes: (minutes) => set({ areaMinutes: minutes }),
      saveRoutine: ({ id, name, moves, rounds }) => {
        if (id && get().routines.some((r) => r.id === id)) {
          set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, name, moves, rounds } : r)) }));
          return id;
        }
        const routine: Routine = { id: newId(), name, moves, rounds, createdAt: new Date().toISOString() };
        set((s) => ({ routines: [routine, ...s.routines] }));
        return routine.id;
      },
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      setHold: (exerciseId, seconds) =>
        set((s) => {
          const holds = { ...s.holds };
          if (seconds === null) delete holds[exerciseId];
          else holds[exerciseId] = seconds;
          return { holds };
        }),
      reset: () => set({ ...initialData }),
    }),
    {
      name: 'mobility-app',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): Data => ({
        draft: s.draft,
        plan: s.plan,
        areaLevels: s.areaLevels,
        history: s.history,
        extra: s.extra,
        isPremium: s.isPremium,
        reminder: s.reminder,
        flags: s.flags,
        programmeDays: s.programmeDays,
        holds: s.holds,
        sounds: s.sounds,
        readySeconds: s.readySeconds,
        areaMinutes: s.areaMinutes,
        routines: s.routines,
      }),
    },
  ),
);

/** Find a planned or one-off session by id. */
export function findSession(state: Pick<AppState, 'plan' | 'extra'>, id: string | undefined): PlannedSession | undefined {
  if (!id) return undefined;
  return state.plan?.sessions.find((s) => s.id === id) ?? (state.extra?.id === id ? state.extra : undefined);
}

/** True once saved data has loaded from the device. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, hasHydrated, () => false);
}

function subscribeHydration(onChange: () => void): () => void {
  return useAppStore.persist.onFinishHydration(() => onChange());
}

function hasHydrated(): boolean {
  return useAppStore.persist.hasHydrated();
}
