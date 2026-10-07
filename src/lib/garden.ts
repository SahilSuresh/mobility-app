import { AREA_NAMES } from '@/data/areas';
import type { AreaId, CompletedSession } from '@/data/types';

import { daysBetween } from './dates';

/** How big an area's plant has grown, from how often it was trained in the last four weeks. */
export type PlantStage = 'seed' | 'sprout' | 'grown' | 'bloom';
/** How the plant is doing, from how long since its area was last trained. */
export type PlantHealth = 'fresh' | 'thirsty' | 'wilting';

export type Plant = {
  area: AreaId;
  stage: PlantStage;
  health: PlantHealth;
  /** Days since the area was last trained; null when it never has been. */
  days: number | null;
};

const GROWTH_WINDOW_DAYS = 28;

const STAGE_LABEL: Record<PlantStage, string> = { seed: 'Seed', sprout: 'Sprouting', grown: 'Growing', bloom: 'In bloom' };

export function plantFor(area: AreaId, history: CompletedSession[], now: Date): Plant {
  let sessions = 0;
  let days: number | null = null;
  for (const h of history) {
    if (!h.areas.includes(area)) continue;
    const d = daysBetween(new Date(h.date), now);
    if (d <= GROWTH_WINDOW_DAYS) sessions += 1;
    if (days === null || d < days) days = d;
  }
  const stage: PlantStage = sessions === 0 ? 'seed' : sessions <= 2 ? 'sprout' : sessions <= 5 ? 'grown' : 'bloom';
  // A seed has nothing to droop; anything grown starts to flag after a few days without a stretch.
  const health: PlantHealth = stage === 'seed' || days === null || days <= 3 ? 'fresh' : days <= 7 ? 'thirsty' : 'wilting';
  return { area, stage, health, days };
}

/** "Hips, in bloom" or "Hips, growing, thirsty", for screen readers. */
export function plantLabel(p: Plant): string {
  const health = p.health === 'fresh' ? '' : `, ${p.health}`;
  return `${AREA_NAMES[p.area]}, ${STAGE_LABEL[p.stage].toLowerCase()}${health}`;
}

/** One line under the garden: what needs attention, or that all is well. */
export function gardenLine(plants: Plant[]): string {
  if (plants.every((p) => p.stage === 'seed')) return 'Each session helps your areas grow.';
  const dry = plants.filter((p) => p.health !== 'fresh').map((p) => AREA_NAMES[p.area]);
  if (dry.length === 0) return 'Everything is growing nicely.';
  if (dry.length === 1) return `${dry[0]} could use a stretch.`;
  if (dry.length === 2) return `${dry[0]} and ${dry[1].toLowerCase()} could use a stretch.`;
  return `${dry.length} areas could use a stretch.`;
}
