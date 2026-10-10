import { PROGRAMMES, type Programme } from '@/data/content';
import type { AreaId } from '@/data/types';

/**
 * How well a programme fits your plan: the share of its areas you chose, plus one for its main (first) area.
 * "Lower back relief" (lower back, hips) fits a lower back and hips plan fully; "Runner's recovery" only touches it.
 */
export function programmeFit(programme: Programme, areas: AreaId[]): number {
  const shared = programme.areas.filter((a) => areas.includes(a)).length;
  return shared / programme.areas.length + (areas.includes(programme.areas[0]) ? 1 : 0);
}

/** "For your plan" only when every area the programme works is one of yours, so the tag picks a few, not all. */
export function isForYourPlan(programme: Programme, areas: AreaId[]): boolean {
  return programme.areas.every((a) => areas.includes(a));
}

export type ProgrammePick = { programme: Programme; done: number };

/**
 * The paid programmes in the order to offer them: ones under way first, then the best fit for your areas,
 * then the rest in their listed order. Finished ones go last.
 */
export function rankProgrammes(areas: AreaId[], programmeDays: Record<string, number>): ProgrammePick[] {
  const stage = ({ programme: p, done }: ProgrammePick) => (done > 0 && done < p.days ? 0 : done >= p.days ? 2 : 1);
  return PROGRAMMES.filter((p) => !p.free)
    .map((programme) => ({ programme, done: Math.min(programme.days, programmeDays[programme.id] ?? 0) }))
    .map((pick, order) => ({ pick, order, fit: programmeFit(pick.programme, areas) }))
    .sort((a, b) => stage(a.pick) - stage(b.pick) || b.fit - a.fit || a.order - b.order)
    .map(({ pick }) => pick);
}
