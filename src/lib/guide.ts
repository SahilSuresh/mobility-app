import { GUIDES, type MoveGuide } from '@/data/guide';
import type { Exercise } from '@/data/types';

import { COUNTDOWN, spokenTime } from './holds';

/**
 * The voice guide's words for a session: what to say in the rest, as each move starts, through it, and at the switch.
 * Every line here is also shown on screen under the picture, so the guidance is there with the voice off too.
 */

/** A move's script, or one made from its written steps for any move without its own. */
export function guideFor(e: Exercise): MoveGuide {
  return GUIDES[e.id] ?? { kind: 'hold', setup: e.steps[0] ?? e.tip, go: e.steps[1] ?? e.tip, cues: e.steps.slice(2) };
}

/** Roughly how long a line takes to say, in seconds, at the guide's calm speaking rate. */
export function speechSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return 0.6 + words / 2.4;
}

/** Said in the rest before a move: what's next and how to get into position. */
export function restLine(e: Exercise, first: boolean): string {
  const g = guideFor(e);
  return first ? `Get ready. First up: ${e.name}. ${g.setup}` : `And relax. Next up: ${e.name}. ${g.setup}`;
}

/** How long the move lasts, said the right way for its kind: you hold a stretch, but keep a movement going. */
function timeLine(g: MoveGuide, seconds: number): string {
  return g.kind === 'hold' ? `Hold for ${spokenTime(seconds)}.` : `Keep going for ${spokenTime(seconds)}.`;
}

/**
 * Said as a move's timer starts. The first side gets the movement and the time; with no rest before it (skipped),
 * it starts with the name and the setup too. The second side only needs the time: the switch break said what to change.
 */
export function startLine(e: Exercise, seconds: number, opts: { side: 1 | 2; withSetup: boolean }): string {
  const g = guideFor(e);
  if (opts.side === 2) return `Second side. ${timeLine(g, seconds)}`;
  const intro = opts.withSetup ? `${e.name}. ${g.setup} ` : '';
  return `${intro}${g.go} ${timeLine(g, seconds)}`;
}

/** Said in the short break between the two sides of a move. */
export function switchLine(e: Exercise): string {
  const other = guideFor(e).other;
  return other ? `And relax. Switch sides. ${other}` : 'And relax. Switch sides.';
}

/** Lines that fill a long move once its own cues are used up, so a minute-long hold isn't silent. */
const FILL: Record<MoveGuide['kind'], string[]> = {
  hold: ['Breathe in slowly, and let it go.', 'Stay soft. Let the stretch come to you.'],
  flow: ['Keep it slow and steady.', 'Breathe with the movement.'],
};

/** The quietest a move gets between two lines, in seconds: a cue, then time to just breathe. */
const GAP = 9;

/**
 * The cues to say through one hold, keyed by seconds left on the timer. They start once the opening line is done
 * (`busy` seconds, including anything still being said from the rest), finish before the last-seconds countdown,
 * and are spread evenly with at least `GAP` seconds between them. A `half` line lands nearest the middle.
 */
export function cueSchedule(e: Exercise, seconds: number, busy: number): Record<number, string> {
  const g = guideFor(e);
  // The first cue can start once the opening has been said, with a short pause after it.
  const earliest = Math.floor(seconds - busy - 2);
  // The countdown starts at COUNTDOWN seconds left; leave room to finish a typical cue before it.
  const latest = COUNTDOWN + 5;
  if (earliest < latest) return {};

  const slots = Math.floor((earliest - latest) / GAP) + 1;
  const lines = [...g.cues, ...FILL[g.kind]];
  const count = Math.min(slots, lines.length + (g.half ? 1 : 0));
  if (count <= 0) return {};
  // Evenly spaced from the earliest slot down to the latest; one cue sits in the middle of the window.
  const at = count === 1 ? [Math.round((earliest + latest) / 2)] : Array.from({ length: count }, (_, i) => Math.round(earliest - (i * (earliest - latest)) / (count - 1)));

  const out: Record<number, string> = {};
  let halfAt = -1;
  if (g.half) {
    // The slot closest to halfway through the hold.
    halfAt = at.reduce((best, s) => (Math.abs(s - seconds / 2) < Math.abs(best - seconds / 2) ? s : best), at[0]);
    out[halfAt] = g.half;
  }
  const unused = [...lines];
  for (const s of at) {
    if (s === halfAt) continue;
    // In order, but a line too long to finish before the countdown gives way to the next one that fits.
    const i = unused.findIndex((line) => s - speechSeconds(line) >= COUNTDOWN + 0.5);
    if (i < 0) continue;
    out[s] = unused[i];
    unused.splice(i, 1);
  }
  return out;
}
