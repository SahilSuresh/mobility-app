import { reloadAppAsync } from 'expo';
import Storage from 'expo-sqlite/kv-store';
import { DevSettings } from 'react-native';

/** Dark green (the default) or the light cream look. */
export type Appearance = 'dark' | 'light';

const KEY = 'appearance';

/**
 * The saved choice, read synchronously: the palette in `theme.ts` is picked from this
 * when the app starts, before any screen builds its styles.
 */
export function readAppearance(): Appearance {
  try {
    return Storage.getItemSync(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveAppearance(appearance: Appearance): void {
  try {
    Storage.setItemSync(KEY, appearance);
  } catch {
    // Not saved: the app keeps its current look.
  }
}

/**
 * Reload so every screen is drawn in the new palette. `reloadAppAsync` from `expo` reloads in store builds
 * (TestFlight, the App Store, Google Play) as well as development ones; before it, store builds couldn't
 * reload, so the switch only took effect after closing and reopening the app. If the reload fails, `onFail`
 * lets the caller ask for a restart instead.
 */
export function reloadApp(onFail?: () => void): boolean {
  reloadAppAsync('Appearance changed').catch(() => {
    if (__DEV__) DevSettings.reload();
    else onFail?.();
  });
  return true;
}
