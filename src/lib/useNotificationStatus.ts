import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { notificationStatus, type NotificationStatus } from './notifications';

/**
 * The phone's notification permission for this app, kept current: checked when the screen comes into view and again
 * whenever the app comes back to the front (such as after turning notifications on in the iPhone's Settings).
 * Null until the first check has finished. `refresh` checks again straight away, such as after asking.
 */
export function useNotificationStatus(): { status: NotificationStatus | null; refresh: () => void } {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const refresh = useCallback(() => {
    notificationStatus()
      .then(setStatus)
      .catch(() => setStatus('unsupported'));
  }, []);
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );
  return { status, refresh };
}
