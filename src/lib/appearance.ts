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
 * Reload so every screen is drawn in the new palette. Returns false where the app can't
 * reload itself (store builds without expo-updates), so the caller can ask for a restart.
 */
export function reloadApp(): boolean {
  if (__DEV__) {
    DevSettings.reload();
    return true;
  }
  return false;
}
