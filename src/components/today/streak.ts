import type { IconName } from '@/components/Icon';

/** The streak grows from a seed to a sprout to a plant. */
export function streakIcon(days: number): IconName {
  if (days < 2) return 'seed';
  return days < 5 ? 'sprout' : 'plant';
}

export function streakHint(days: number): string {
  if (days < 2) return `${2 - days} more ${2 - days === 1 ? 'day' : 'days'} until it sprouts`;
  if (days < 5) return `${5 - days} more ${5 - days === 1 ? 'day' : 'days'} until it's grown`;
  return 'Fully grown. Keep it going.';
}
