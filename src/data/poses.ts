import type { PoseKey } from './types';

/**
 * Each move is drawn as a simple figure inside a 100 × 100 box (the bubble shows 6–94).
 * torso: thick stroke · back: the limbs further from you (lighter) · limbs: nearer limbs
 * h: head centre · d: green dot on the area being stretched. The floor sits at y ≈ 82.
 */
/** Standing, kneeling (or on all fours), sitting or lying: the position each move is done in. */
export type Position = 'standing' | 'kneeling' | 'seated' | 'lying';

export const POSITION: Record<PoseKey, Position> = {
  reach: 'standing', fold: 'standing', neck: 'standing', chinTuck: 'standing', armCross: 'standing', goalpost: 'standing',
  sideBend: 'standing', legSwing: 'standing', squat: 'standing', quad: 'standing', calf: 'standing', armsOut: 'standing',
  wristCircle: 'standing', prayer: 'standing', reversePrayer: 'standing', fingerPull: 'standing', forearmTurn: 'standing',
  wallArm: 'standing', calfRaise: 'standing', doorway: 'standing', sideLunge: 'standing', triceps: 'standing',
  cat: 'kneeling', thread: 'kneeling', lunge: 'kneeling', couch: 'kneeling', heelSit: 'kneeling', ankleRock: 'kneeling',
  downDog: 'kneeling', tabletop: 'kneeling', child: 'kneeling', birdDog: 'kneeling', puppy: 'kneeling', lungeReach: 'kneeling',
  pigeon: 'kneeling',
  butterfly: 'seated', seated: 'seated', twist: 'seated', footFlex: 'seated',
  cobra: 'lying', sphinx: 'lying', hug: 'lying', bridge: 'lying', supineTwist: 'lying', legRaise: 'lying',
};

export type Pose = {
  torso: string;
  back: string;
  limbs: string;
  h: [number, number];
  d: [number, number];
};

export const POSES: Record<PoseKey, Pose> = {
  reach: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M49 38 L45 27 L44 17', limbs: 'M47 57 L47 70 L47 82 M51 38 L56 27 L57 17', h: [50, 29], d: [51, 39] },
  fold: { torso: 'M46 52 L57 70', back: 'M49 52 L49 67 L49 82', limbs: 'M45 52 L45 67 L45 82 M57 70 L56 76 L55 82', h: [61, 77], d: [46, 63] },
  child: { torso: 'M31 72 Q43 62 55 72', back: 'M55 72 L69 78 L84 79', limbs: 'M31 73 L46 81 L25 82 M55 74 L68 81 L83 82', h: [61, 75], d: [41, 66] },
  cat: { torso: 'M34 55 Q48 41 62 55', back: 'M37 56 L37 82 L22 82 M59 56 L59 82', limbs: 'M33 56 L33 82 L17 82 M63 56 L63 82', h: [71, 50], d: [48, 47] },
  lunge: { torso: 'M46 60 L47 37', back: 'M46 60 L36 80 L18 82', limbs: 'M46 60 L64 62 L66 82 M47 39 L56 51 L62 58', h: [48, 27], d: [45, 60] },
  butterfly: { torso: 'M45 76 L46 52', back: 'M45 77 L33 70 L46 81', limbs: 'M45 77 L61 70 L50 81 M46 54 L50 66 L50 77', h: [47, 42], d: [55, 73] },
  cobra: { torso: 'M46 80 Q58 76 63 62', back: 'M46 80 L30 80 L14 80', limbs: 'M46 81 L30 82 L14 82 M63 63 L65 72 L66 82', h: [68, 53], d: [54, 77] },
  hug: { torso: 'M48 80 L25 80', back: 'M48 79 L40 63 L54 60', limbs: 'M48 80 L36 63 L50 59 M29 79 L32 69 L38 63', h: [16, 77], d: [45, 79] },
  seated: { torso: 'M36 79 L53 62', back: 'M36 79 L57 80 L79 81', limbs: 'M36 80 L57 81 L80 82 M53 63 L65 70 L76 77', h: [60, 56], d: [57, 81] },
  neck: { torso: 'M50 58 L50 36', back: '', limbs: 'M46 58 L45 70 L45 82 M54 58 L55 70 L55 82 M44 37 L40 50 L40 62 M56 37 L58 24 L49 17', h: [44, 25], d: [50, 32] },
  chinTuck: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M48 39 L46 50 L46 60', limbs: 'M47 57 L47 70 L47 82 M52 39 L54 50 L54 60', h: [48, 29], d: [50, 34] },
  armCross: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M49 40 L42 47 L36 42', limbs: 'M47 57 L47 70 L47 82 M52 40 L41 42 L30 41', h: [50, 29], d: [54, 39] },
  goalpost: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M48 40 L38 41 L37 30', limbs: 'M47 57 L47 70 L47 82 M52 40 L62 41 L63 30', h: [50, 29], d: [50, 45] },
  sideBend: { torso: 'M50 57 Q52 47 46 39', back: 'M53 57 L53 70 L53 82 M45 41 L40 50 L39 58', limbs: 'M47 57 L47 70 L47 82 M47 40 L42 28 L34 22', h: [42, 31], d: [52, 47] },
  thread: { torso: 'M34 53 Q47 52 58 68', back: 'M38 55 L38 82 L24 82 M56 66 L63 82', limbs: 'M34 55 L34 82 L20 82 M58 70 L44 79 L28 81', h: [65, 75], d: [48, 58] },
  twist: { torso: 'M44 77 L46 54', back: 'M44 78 L60 77 L74 79 M45 56 L36 66 L33 77', limbs: 'M44 78 L56 68 L52 80 M47 56 L57 63 L59 70', h: [47, 45], d: [45, 68] },
  bridge: { torso: 'M48 66 L26 79', back: 'M50 67 L62 60 L67 82 M27 79 L41 82', limbs: 'M48 66 L60 58 L64 82 M30 80 L44 83', h: [17, 77], d: [48, 67] },
  pigeon: { torso: 'M46 72 L50 50', back: 'M46 74 L30 79 L12 82', limbs: 'M46 74 L61 77 L50 82 M50 52 L56 66 L58 80', h: [52, 41], d: [47, 73] },
  legSwing: { torso: 'M48 57 L48 38', back: 'M50 57 L50 70 L50 82 M46 40 L38 47 L32 50', limbs: 'M47 58 L58 67 L68 74 M50 40 L58 46 L64 48', h: [48, 29], d: [49, 59] },
  squat: { torso: 'M44 70 L50 48', back: 'M46 71 L60 64 L57 82 M49 50 L57 60 L63 59', limbs: 'M43 71 L56 66 L52 82 M50 50 L58 58 L65 55', h: [52, 39], d: [44, 71] },
  quad: { torso: 'M50 57 L50 38', back: 'M51 40 L57 50 L58 59', limbs: 'M50 57 L50 70 L50 82 M48 58 L45 71 L37 61 M49 40 L43 51 L38 60', h: [50, 29], d: [46, 66] },
  couch: { torso: 'M46 62 L48 40', back: 'M46 63 L34 82 L28 64', limbs: 'M46 62 L62 62 L64 82 M47 42 L38 52 L30 62', h: [49, 31], d: [40, 73] },
  heelSit: { torso: 'M40 72 L42 50', back: 'M39 74 L57 80 L37 82 M41 52 L48 64 L53 74', limbs: 'M41 75 L60 81 L40 83 M42 52 L50 64 L56 74', h: [43, 41], d: [58, 80] },
  ankleRock: { torso: 'M46 62 L48 40', back: 'M46 62 L34 81 L18 82', limbs: 'M46 62 L62 61 L55 82 M48 42 L56 52 L61 58', h: [49, 31], d: [56, 79] },
  downDog: { torso: 'M52 46 L36 63', back: 'M53 47 L70 82 M37 64 L30 82', limbs: 'M51 47 L74 82 M35 64 L24 82', h: [31, 70], d: [66, 72] },
  calf: { torso: 'M46 56 L55 37', back: 'M46 57 L37.5 69.5 L29 82 M54 39 L63 41 L71 36', limbs: 'M46 57 L56 68 L55 82 M55 39 L64 45 L72 42', h: [59, 28], d: [34, 75] },
  armsOut: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L31 41 L15 41 M52 40 L69 41 L85 41', h: [50, 29], d: [31, 41] },
  wristCircle: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L31 41 L15 41 M52 40 L69 41 L85 41', h: [50, 29], d: [83, 41] },
  prayer: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M47 40 L39 48 L50 51 M53 40 L61 48 L50 51', h: [50, 29], d: [50, 51] },
  reversePrayer: { torso: 'M50 57 L50 38', back: 'M48 40 L41 52 L50 58 M52 40 L59 52 L50 58', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82', h: [50, 29], d: [50, 58] },
  fingerPull: { torso: 'M50 57 L50 38', back: 'M48 40 L58 50 L80 45', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M52 40 L68 41 L84 41', h: [50, 29], d: [82, 41] },
  forearmTurn: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L45 53 L31 53 M52 40 L55 53 L69 53', h: [50, 29], d: [45, 53] },
  wallArm: { torso: 'M48 58 L52 38', back: 'M51 40 L38 44 L24 38', limbs: 'M46 58 L45 70 L44 82 M50 58 L53 70 L55 82 M52 40 L60 50 L64 60', h: [53, 29], d: [38, 44] },
  tabletop: { torso: 'M34 54 L62 54', back: 'M37 55 L37 82 L22 82 M59 55 L59 82', limbs: 'M33 55 L33 82 L17 82 M63 55 L63 82', h: [71, 49], d: [20, 81] },
  footFlex: { torso: 'M36 79 L45 60', back: 'M36 79 L57 80 L79 81', limbs: 'M36 80 L57 81 L79 80 L80 74 M45 62 L55 72 L62 78', h: [49, 52], d: [79, 78] },
  calfRaise: { torso: 'M50 54 L50 35', back: '', limbs: 'M46 54 L45 67 L44 77 L49 82 M54 54 L55 67 L56 77 L61 82 M48 37 L43 50 L41 60 M52 37 L57 50 L59 60', h: [50, 26], d: [52, 80] },
  // Stepping through a doorway, forearm on the frame behind you at shoulder height.
  doorway: { torso: 'M49 57 L54 38', back: 'M49 57 L42 70 L38 82 M53 40 L38 41 L37 27', limbs: 'M49 57 L57 70 L61 82 M54 40 L57 49 L58 58', h: [56, 29], d: [57, 43] },
  // Lying on your front, propped on your forearms.
  sphinx: { torso: 'M46 80 Q58 78 62 68', back: 'M46 80 L30 80 L14 80', limbs: 'M46 81 L30 82 L14 82 M62 69 L63 81 L77 81', h: [68, 61], d: [53, 79] },
  // On your back, knees bent and dropped to one side.
  supineTwist: { torso: 'M46 79 L26 79', back: 'M48 79 L62 71 L69 78 M27 79 L41 82', limbs: 'M46 79 L60 73 L67 81 M30 80 L44 83', h: [17, 77], d: [40, 79] },
  // On your back, one leg straight up, hands behind the thigh.
  legRaise: { torso: 'M46 79 L26 79', back: 'M48 79 L58 64 L67 82 M27 79 L41 82', limbs: 'M46 79 L48 62 L50 45 M30 80 L39 72 L47 66', h: [17, 77], d: [48, 66] },
  // Hands and knees, opposite arm and leg reaching long.
  birdDog: { torso: 'M34 55 Q48 55 62 55', back: 'M37 56 L37 82 L22 82 M59 56 L85 51', limbs: 'M33 56 L20 55 L7 54 M63 56 L63 82', h: [70, 49], d: [48, 55] },
  // Knees under hips, chest sinking to the floor, arms long in front.
  puppy: { torso: 'M40 58 Q52 64 64 73', back: 'M42 59 L41 82 L26 82 M63 74 L76 79 L89 81', limbs: 'M39 59 L38 82 L23 82 M65 74 L78 80 L91 82', h: [68, 79], d: [55, 66] },
  // Feet wide, sitting into one hip, the other leg long.
  sideLunge: { torso: 'M42 64 L43 45', back: '', limbs: 'M40 64 L32 72 L30 82 M44 64 L58 73 L72 82 M41 47 L35 56 L33 65 M45 47 L42 57 L36 65', h: [43, 36], d: [55, 71] },
  // One arm overhead, elbow bent, the other hand easing the elbow back.
  triceps: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L42 32 L54 23 M52 40 L56 24 L48 33', h: [50, 29], d: [56, 31] },
  // Long lunge, hands down inside the front foot, one arm reaching to the ceiling.
  lungeReach: { torso: 'M44 62 L58 47', back: 'M44 62 L30 78 L12 81 M57 48 L60 64 L62 81', limbs: 'M44 62 L62 63 L65 82 M58 47 L60 33 L62 19', h: [64, 41], d: [46, 62] },
};

/**
 * Where each move starts from: a normal standing, kneeling, sitting or lying position. The figure moves from here
 * into the move in POSES, holds it, and comes back. Every frame has the same path commands as its pose in POSES,
 * so the two blend smoothly.
 */
export const START: Record<PoseKey, Pose> = {
  // Standing, arms by your sides.
  reach: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M49 38 L47 48 L46 57', limbs: 'M47 57 L47 70 L47 82 M51 38 L53 48 L54 57', h: [50, 29], d: [51, 39] },
  // Standing tall before folding.
  fold: { torso: 'M46 52 L46 33', back: 'M49 52 L49 67 L49 82', limbs: 'M45 52 L45 67 L45 82 M46 34 L47 44 L48 53', h: [46, 24], d: [46, 63] },
  // Kneeling upright on your heels.
  child: { torso: 'M33 70 Q34 60 35 50', back: 'M35 50 L37 60 L38 69', limbs: 'M33 71 L46 81 L25 82 M35 52 L37 62 L38 71', h: [36, 41], d: [41, 66] },
  // A flat back on hands and knees.
  cat: { torso: 'M34 55 Q48 55 62 55', back: 'M37 56 L37 82 L22 82 M59 56 L59 82', limbs: 'M33 56 L33 82 L17 82 M63 56 L63 82', h: [70, 49], d: [48, 52] },
  // Half kneeling, hips back over the back knee.
  lunge: { torso: 'M40 64 L41 41', back: 'M40 64 L35 80 L18 82', limbs: 'M40 64 L58 63 L62 82 M41 43 L48 54 L54 60', h: [42, 31], d: [40, 64] },
  // Sitting with the knees up.
  butterfly: { torso: 'M45 76 L46 52', back: 'M45 77 L38 64 L46 81', limbs: 'M45 77 L56 64 L50 81 M46 54 L50 66 L50 77', h: [47, 42], d: [52, 68] },
  // Lying flat on your front, hands under your shoulders.
  cobra: { torso: 'M46 80 Q58 80 68 79', back: 'M46 80 L30 80 L14 80', limbs: 'M46 81 L30 82 L14 82 M68 79 L62 75 L66 82', h: [76, 77], d: [54, 79] },
  // Lying on your back, legs long.
  hug: { torso: 'M48 80 L25 80', back: 'M48 79 L62 80 L76 80', limbs: 'M48 80 L62 81 L76 81 M29 79 L34 79 L40 80', h: [16, 77], d: [45, 79] },
  // Sitting up tall, legs long.
  seated: { torso: 'M36 79 L38 58', back: 'M36 79 L57 80 L79 81', limbs: 'M36 80 L57 81 L80 82 M38 59 L42 69 L44 78', h: [39, 49], d: [50, 80] },
  // Standing tall, head level.
  neck: { torso: 'M50 58 L50 36', back: '', limbs: 'M46 58 L45 70 L45 82 M54 58 L55 70 L55 82 M44 37 L40 50 L40 62 M56 37 L59 48 L60 58', h: [50, 27], d: [50, 32] },
  // Chin poking forward.
  chinTuck: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M48 39 L46 50 L46 60', limbs: 'M47 57 L47 70 L47 82 M52 39 L54 50 L54 60', h: [53, 28], d: [50, 34] },
  // Standing, arms by your sides.
  armCross: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M49 40 L47 49 L46 58', limbs: 'M47 57 L47 70 L47 82 M52 40 L54 49 L55 58', h: [50, 29], d: [54, 39] },
  goalpost: { torso: 'M50 57 L50 38', back: 'M53 57 L53 70 L53 82 M48 40 L46 49 L45 58', limbs: 'M47 57 L47 70 L47 82 M52 40 L54 49 L55 58', h: [50, 29], d: [50, 45] },
  // Standing tall, one arm up.
  sideBend: { torso: 'M50 57 Q50 47 50 38', back: 'M53 57 L53 70 L53 82 M49 40 L47 49 L46 58', limbs: 'M47 57 L47 70 L47 82 M51 39 L52 28 L52 17', h: [50, 29], d: [52, 47] },
  // On hands and knees.
  thread: { torso: 'M34 54 Q48 54 62 54', back: 'M38 55 L38 82 L24 82 M60 55 L60 82', limbs: 'M34 55 L34 82 L20 82 M62 55 L62 68 L63 82', h: [71, 49], d: [48, 54] },
  // Sitting, facing forward.
  twist: { torso: 'M44 77 L46 54', back: 'M44 78 L60 77 L74 79 M45 56 L42 66 L40 76', limbs: 'M44 78 L56 68 L52 80 M47 56 L50 66 L52 75', h: [49, 45], d: [45, 68] },
  // Lying on your back, knees bent, hips down.
  bridge: { torso: 'M46 79 L26 79', back: 'M48 79 L58 64 L67 82 M27 79 L41 82', limbs: 'M46 79 L56 63 L64 82 M30 80 L44 83', h: [17, 77], d: [46, 79] },
  // Setting up: hips lifted before sinking into pigeon.
  pigeon: { torso: 'M46 66 L50 46', back: 'M46 68 L30 77 L12 82', limbs: 'M46 68 L60 74 L52 82 M50 48 L57 62 L59 78', h: [52, 37], d: [47, 67] },
  // Standing on both feet.
  legSwing: { torso: 'M48 57 L48 38', back: 'M50 57 L50 70 L50 82 M46 40 L44 49 L43 58', limbs: 'M47 58 L47 70 L47 82 M50 40 L52 49 L53 58', h: [48, 29], d: [49, 59] },
  // Standing, feet apart.
  squat: { torso: 'M48 57 L49 38', back: 'M50 58 L51 70 L52 82 M48 40 L48 49 L48 58', limbs: 'M47 58 L47 70 L47 82 M50 40 L51 49 L52 58', h: [50, 29], d: [48, 58] },
  // Standing on both feet.
  quad: { torso: 'M50 57 L50 38', back: 'M51 40 L57 50 L58 59', limbs: 'M50 57 L50 70 L50 82 M48 58 L47 70 L46 82 M49 40 L47 49 L46 58', h: [50, 29], d: [47, 64] },
  // Kneeling lunge, back foot on the floor.
  couch: { torso: 'M48 64 L53 43', back: 'M46 63 L34 82 L18 82', limbs: 'M48 63 L63 63 L64 82 M53 45 L58 55 L62 62', h: [55, 34], d: [40, 73] },
  // Kneeling up tall.
  heelSit: { torso: 'M44 60 L45 38', back: 'M44 62 L57 80 L37 82 M44 40 L46 50 L47 60', limbs: 'M45 63 L60 81 L40 83 M45 40 L48 50 L49 60', h: [46, 29], d: [58, 80] },
  // Half kneeling, weight back.
  ankleRock: { torso: 'M42 63 L43 41', back: 'M42 63 L33 81 L18 82', limbs: 'M42 63 L58 63 L57 82 M43 43 L51 53 L57 59', h: [44, 32], d: [56, 79] },
  // On hands and knees, hips low.
  downDog: { torso: 'M56 60 L36 60', back: 'M57 61 L66 82 M37 61 L31 82', limbs: 'M55 61 L70 82 M35 61 L24 82', h: [29, 58], d: [62, 70] },
  // Standing upright, hands on the wall.
  calf: { torso: 'M44 57 L46 38', back: 'M44 58 L41 70 L39 82 M45 40 L58 40 L71 36', limbs: 'M44 58 L49 70 L50 82 M46 40 L59 44 L72 42', h: [47, 29], d: [40, 76] },
  // Standing, arms by your sides.
  armsOut: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', h: [50, 29], d: [46, 49] },
  wristCircle: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', h: [50, 29], d: [55, 58] },
  prayer: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M47 40 L45 49 L44 58 M53 40 L55 49 L56 58', h: [50, 29], d: [50, 51] },
  reversePrayer: { torso: 'M50 57 L50 38', back: 'M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82', h: [50, 29], d: [50, 50] },
  fingerPull: { torso: 'M50 57 L50 38', back: 'M48 40 L46 49 L45 58', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M52 40 L54 49 L55 58', h: [50, 29], d: [55, 58] },
  forearmTurn: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', h: [50, 29], d: [46, 50] },
  // Standing by the wall, arm down.
  wallArm: { torso: 'M48 58 L52 38', back: 'M51 40 L49 49 L48 58', limbs: 'M46 58 L45 70 L44 82 M50 58 L53 70 L55 82 M52 40 L60 50 L64 60', h: [53, 29], d: [49, 48] },
  // On hands and knees, rocked back.
  tabletop: { torso: 'M30 55 L58 55', back: 'M33 56 L37 82 L22 82 M55 56 L59 82', limbs: 'M29 56 L33 82 L17 82 M59 56 L63 82', h: [67, 50], d: [20, 81] },
  // Sitting, toes pointed.
  footFlex: { torso: 'M36 79 L45 60', back: 'M36 79 L57 80 L79 81', limbs: 'M36 80 L57 81 L79 80 L86 82 M45 62 L55 72 L62 78', h: [49, 52], d: [80, 80] },
  // Standing, feet flat.
  calfRaise: { torso: 'M50 57 L50 38', back: '', limbs: 'M46 57 L45 70 L45 80 L50 82 M54 57 L55 70 L55 80 L60 82 M48 40 L43 53 L41 63 M52 40 L57 53 L59 63', h: [50, 29], d: [52, 80] },
  // Standing in the doorway, forearm already on the frame.
  doorway: { torso: 'M48 57 L48 38', back: 'M48 57 L48 70 L48 82 M48 40 L34 41 L33 27', limbs: 'M48 57 L48 70 L48 82 M48 40 L50 49 L51 58', h: [48, 29], d: [52, 43] },
  // Lying flat on your front, forearms down.
  sphinx: { torso: 'M46 80 Q58 80 68 79', back: 'M46 80 L30 80 L14 80', limbs: 'M46 81 L30 82 L14 82 M67 79 L66 81 L78 81', h: [76, 77], d: [53, 79] },
  // On your back, knees bent and upright.
  supineTwist: { torso: 'M46 79 L26 79', back: 'M48 79 L58 64 L67 82 M27 79 L41 82', limbs: 'M46 79 L56 63 L64 82 M30 80 L44 83', h: [17, 77], d: [40, 79] },
  // On your back, both knees bent.
  legRaise: { torso: 'M46 79 L26 79', back: 'M48 79 L58 64 L67 82 M27 79 L41 82', limbs: 'M46 79 L56 63 L64 82 M30 80 L37 82 L44 83', h: [17, 77], d: [48, 66] },
  // On hands and knees.
  birdDog: { torso: 'M34 55 Q48 55 62 55', back: 'M37 56 L37 82 L22 82 M59 56 L59 82', limbs: 'M33 56 L33 82 L17 82 M63 56 L63 82', h: [70, 49], d: [48, 55] },
  // On hands and knees.
  puppy: { torso: 'M40 55 Q52 55 64 55', back: 'M42 56 L41 82 L26 82 M63 56 L63 69 L63 82', limbs: 'M39 56 L38 82 L23 82 M65 56 L65 69 L65 82', h: [72, 49], d: [55, 55] },
  // Standing with feet wide.
  sideLunge: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L40 70 L33 82 M53 57 L60 70 L67 82 M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', h: [50, 29], d: [55, 71] },
  // Standing, arms by your sides.
  triceps: { torso: 'M50 57 L50 38', back: '', limbs: 'M47 57 L47 70 L47 82 M53 57 L53 70 L53 82 M48 40 L46 49 L45 58 M52 40 L54 49 L55 58', h: [50, 29], d: [56, 31] },
  // Long lunge, both hands down inside the front foot.
  lungeReach: { torso: 'M44 62 L58 47', back: 'M44 62 L30 78 L12 81 M57 48 L59 64 L60 81', limbs: 'M44 62 L62 63 L65 82 M58 47 L61 64 L63 81', h: [64, 43], d: [46, 62] },
};
