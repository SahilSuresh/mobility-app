import { create } from 'zustand';

import { isDark } from '@/constants/theme';

/** Which look the Today screen uses. 'auto' follows the sun through the day. Not saved between launches. */
export type LookChoice = 'current' | 'dawn' | 'vision' | 'dusk' | 'evening' | 'auto';
export type Look = Exclude<LookChoice, 'auto'>;

type State = {
  choice: LookChoice;
  setChoice: (c: LookChoice) => void;
};

export const useLook = create<State>((set) => ({
  choice: 'auto',
  setChoice: (choice) => set({ choice }),
}));

/** Auto follows the sun: dawn from 5 am, day from 10 am, dusk from 5 pm, night from 8 pm. */
export function resolveLook(_choice: LookChoice, _now: Date): Look {
  // One look for the whole app: dark green in dark mode, the light day look otherwise (Settings → Appearance).
  return isDark ? 'evening' : 'vision';
}
