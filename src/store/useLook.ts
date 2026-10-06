import { create } from 'zustand';

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
export function resolveLook(choice: LookChoice, now: Date): Look {
  if (choice !== 'auto') return choice;
  const h = now.getHours();
  if (h < 5 || h >= 20) return 'evening';
  if (h < 10) return 'dawn';
  return h < 17 ? 'vision' : 'dusk';
}
