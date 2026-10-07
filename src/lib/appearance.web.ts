/** Web: the choice lives in localStorage, which is synchronous, and the page simply reloads. */
export type Appearance = 'dark' | 'light';

const KEY = 'appearance';

export function readAppearance(): Appearance {
  try {
    return globalThis.localStorage?.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveAppearance(appearance: Appearance): void {
  try {
    globalThis.localStorage?.setItem(KEY, appearance);
  } catch {
    // Not saved: the app keeps its current look.
  }
}

export function reloadApp(): boolean {
  globalThis.location?.reload();
  return true;
}
