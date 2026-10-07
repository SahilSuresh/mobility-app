import { router } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';


/**
 * Go to the Today tab with a clean history (no swiping back into onboarding).
 * After the first run the stack starts at Welcome, which is swapped for the tabs;
 * otherwise the tabs are already at the bottom and are simply shown again.
 */
export function goHome(): void {
  if (router.canDismiss()) router.dismissAll();
  router.dismissTo('/');
}

/**
 * After the first session: save progress → Premium offer → reminder → home.
 * Each step is shown once; anything already done or seen is skipped.
 */
export function continueFirstRun(from: 'complete' | 'save' | 'premium' | 'reminder'): void {
  const s = useAppStore.getState();
  if (from === 'complete' && !s.flags.seenSave && !s.account) {
    router.replace('/save');
    return;
  }
  if ((from === 'complete' || from === 'save') && !s.flags.seenPaywall && !s.isPremium) {
    router.replace({ pathname: '/premium', params: { flow: '1' } });
    return;
  }
  if (from !== 'reminder' && !s.flags.seenReminder) {
    router.replace({ pathname: '/reminder', params: { flow: '1' } });
    return;
  }
  goHome();
}

/**
 * Start a session: its preview, then the player. Every session needs Premium (or its free trial),
 * so without it the paywall opens first and goes on to this session once bought.
 */
export function startSession(sessionId: string): void {
  if (!useAppStore.getState().isPremium) {
    router.push({ pathname: '/premium', params: { then: sessionId } });
    return;
  }
  router.push({ pathname: '/preview', params: { id: sessionId } });
}
