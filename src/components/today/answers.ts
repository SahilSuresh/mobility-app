import type { IconName } from '@/components/Icon';

export type Answer = 'good' | 'stiff' | 'sore' | 'short';

/** The check-in answers for "How's your body today?". */
export const ANSWERS: { key: Answer; label: string; icon: IconName }[] = [
  { key: 'good', label: 'Feeling good', icon: 'sun' },
  { key: 'stiff', label: 'Stiff somewhere', icon: 'target' },
  { key: 'sore', label: 'A bit sore', icon: 'feather' },
  { key: 'short', label: 'Short on time', icon: 'clock' },
];
