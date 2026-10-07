import type { AreaId, BodyView } from './types';

/**
 * Anatomy-chart look for the figure, on the same 220 × 440 grid as the outline.
 * The body is split into one zone per area, with crisp seams between zones and faint muscle lines inside them.
 * Shapes are drawn for the left half and mirrored, unless `mid` is set (they sit on the centre line).
 * Everything is clipped to the outline, so shapes run past the edge of the body where that keeps them simple.
 */
export type Shape = { d: string; mid?: boolean };

/** The head, drawn in a lighter tone than the muscles. */
export const HEAD = 'M110 4 C126 4 136 18 136 36 C136 52 126 64 110 64 C94 64 84 52 84 36 C84 18 94 4 110 4 Z';

/** A gently curved cut across a limb or the torso, from x1 to x2 at height y. */
type Cut = { x1: number; x2: number; y: number; dip: number };
const cut = (x1: number, x2: number, y: number, dip = 3): Cut => ({ x1, x2, y, dip });
const line = (c: Cut) => `M${c.x1} ${c.y} Q${(c.x1 + c.x2) / 2} ${c.y + c.dip} ${c.x2} ${c.y}`;
/** The zone between two cuts. Its sides sit outside the body and are clipped away. */
const band = (a: Cut, b: Cut) =>
  `M${a.x1} ${a.y} Q${(a.x1 + a.x2) / 2} ${a.y + a.dip} ${a.x2} ${a.y} L${b.x2} ${b.y} Q${(b.x1 + b.x2) / 2} ${b.y + b.dip} ${b.x1} ${b.y} Z`;

// Arms: the cuts stay in the gap between arm and torso.
const ELBOW_TOP = cut(15, 64, 162);
const ELBOW_BOTTOM = cut(15, 60, 206);
const WRIST_TOP = cut(15, 56, 228, 2);
const HAND_END = cut(10, 56, 292, 0);
// Legs: the cuts stop at the centre line.
const THIGH_TOP = cut(50, 109, 266, 4);
const KNEE_TOP = cut(56, 109, 312);
const KNEE_BOTTOM = cut(60, 109, 350);
const ANKLE_TOP = cut(62, 109, 390, 2);
const ANKLE_BOTTOM = cut(62, 109, 414, 2);
const FOOT_END = cut(50, 112, 450, 0);
// Back of the torso.
const MID_BACK = cut(60, 110, 172, 4);
const GLUTE_FOLD = cut(58, 110, 262, 6);

/** The cap of the shoulder: from the base of the neck, round the deltoid and back up under the arm. */
const DELTOID = 'M72 96 C68 106 66 114 64 122 C58 130 50 136 41 140';
/** Base of the neck, across to the top of the shoulder. */
const NECK_BASE_FRONT = 'M110 92 C100 91 84 93 72 96';
const NECK_BASE_BACK = 'M110 98 C100 96 84 95 72 96';
/** Top of the pelvis, front (a V down to the centre) and back (the top of the glutes). */
const HIP_FRONT = 'M58 204 C76 214 96 222 110 226';
const HIP_BACK = 'M60 216 Q85 212 110 218';

/** Seams between the zones, shared by the arms on both sides. */
const ARM_SEAMS: Shape[] = [{ d: DELTOID }, { d: line(ELBOW_TOP) }, { d: line(ELBOW_BOTTOM) }, { d: line(WRIST_TOP) }];

/** Crisp lines where one zone meets the next. */
export const SEAMS: Record<BodyView, Shape[]> = {
  front: [
    { d: 'M94 56 C100 64 120 64 126 56', mid: true },
    { d: NECK_BASE_FRONT },
    ...ARM_SEAMS,
    { d: HIP_FRONT },
    { d: line(THIGH_TOP) },
    { d: line(KNEE_TOP) },
    { d: line(KNEE_BOTTOM) },
    { d: line(ANKLE_TOP) },
    { d: line(ANKLE_BOTTOM) },
  ],
  back: [
    { d: 'M94 60 C100 66 120 66 126 60', mid: true },
    { d: NECK_BASE_BACK },
    ...ARM_SEAMS,
    { d: line(MID_BACK) },
    { d: HIP_BACK },
    { d: line(GLUTE_FOLD) },
  ],
};

/** Faint muscle lines inside the zones, for texture. */
export const DETAILS: Record<BodyView, Shape[]> = {
  front: [
    { d: 'M99 66 C102 75 105 82 107 88' },
    { d: 'M51 140 C49 150 47 156 46 160' },
    { d: 'M45 210 C44 216 43 222 42 226' },
    { d: 'M66 127 C76 138 92 142 108 138' },
    { d: 'M110 98 V222', mid: true },
    { d: 'M93 143 C92 170 92 196 95 216' },
    { d: 'M94 160 H110' },
    { d: 'M94 182 H110' },
    { d: 'M94 204 H108' },
    { d: 'M69 160 C77 162 85 164 92 166' },
    { d: 'M70 272 C73 286 75 298 77 308' },
    { d: 'M88 272 C91 286 92 298 92 308' },
    { d: 'M77 331 C77 325 80 322 84 322 C88 322 91 325 91 331 C91 337 88 340 84 340 C80 340 77 337 77 331 Z' },
    { d: 'M84 356 C82 368 82 378 83 386' },
  ],
  back: [
    { d: 'M100 76 C94 84 86 90 76 95' },
    { d: 'M51 140 C49 150 47 156 46 160' },
    { d: 'M45 210 C44 216 43 222 42 226' },
    { d: 'M70 104 C80 108 90 116 97 128 C102 140 106 150 110 162' },
    { d: 'M68 146 C78 146 88 140 96 130' },
    { d: 'M110 100 V256', mid: true },
    { d: 'M102 176 C100 190 101 202 104 212' },
    { d: 'M84 270 C84 288 84 304 85 322' },
    { d: 'M69 328 C79 333 91 333 100 328' },
    { d: 'M86 340 C84 352 84 366 86 382' },
    { d: 'M72 370 C78 382 83 388 86 388 C90 388 94 384 98 372' },
    { d: 'M73 410 C82 413 94 413 103 410' },
  ],
};

/** Shoulders, elbows and wrists are the same zones from either side. */
const ARM_REGIONS: Partial<Record<AreaId, Shape[]>> = {
  shoulders: [{ d: `M0 60 H72 V96 ${DELTOID.replace('M72 96 ', '')} L0 150 Z` }],
  elbows: [{ d: band(ELBOW_TOP, ELBOW_BOTTOM) }],
  wrists: [{ d: band(WRIST_TOP, HAND_END) }],
};

/** The zone that fills in when an area is selected. */
export const REGIONS: Record<BodyView, Partial<Record<AreaId, Shape[]>>> = {
  front: {
    ...ARM_REGIONS,
    neck: [{ d: `M80 62 H110 V92 C100 91 84 93 72 96 L74 80 Z` }],
    hips: [{ d: `M50 266 L${HIP_FRONT.slice(1)} L110 266 L109 266 Q79.5 270 50 266 Z` }],
    knees: [{ d: band(KNEE_TOP, KNEE_BOTTOM) }],
    ankles: [{ d: band(ANKLE_TOP, ANKLE_BOTTOM) }],
    feet: [{ d: band(ANKLE_BOTTOM, FOOT_END) }],
  },
  back: {
    ...ARM_REGIONS,
    neck: [{ d: `M80 62 H110 V98 C100 96 84 95 72 96 L74 80 Z` }],
    upperBack: [{ d: `M72 96 C68 106 66 114 64 122 L60 172 Q85 176 110 172 V98 C100 96 84 95 72 96 Z` }],
    lowerBack: [{ d: `M60 172 Q85 176 110 172 V218 Q85 212 60 216 Z` }],
    hips: [{ d: `M60 216 Q85 212 110 218 V262 Q84 268 58 262 Z` }],
  },
};
