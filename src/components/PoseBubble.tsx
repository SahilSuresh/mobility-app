import { useEffect, useId, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, LinearGradient, Mask, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors, NATIVE_DRIVER, shade, shadows } from '@/constants/theme';
import { POSES, START, type Pose } from '@/data/poses';
import { mix } from '@/lib/color';
import type { PoseKey } from '@/data/types';

type Props = {
  pose: PoseKey;
  size: number;
  color: string;
  /** Green glow on the area being stretched. */
  dot?: boolean;
  /** Thin cream outline, for overlapping stacks. */
  outline?: boolean;
  shadow?: boolean;
  /** Play the move: switch between the normal starting position and the exercise. */
  breathe?: boolean;
  /** A curved arrow showing which way to move. On by default for large drawings (120 and up). */
  arrow?: boolean;
  /** Where in the cycle this one starts (0–1), to stagger a list of moving drawings. */
  phase?: number;
  style?: StyleProp<ViewStyle>;
};

/** One full breath (in and out) per movement cycle. */
const BREATH_MS = 8000;

const NUMBER = /-?\d+(?:\.\d+)?/g;

/** Moves every number in path `a` towards the matching number in `b` (both share the same commands). */
function blendPath(a: string, b: string, t: number): string {
  if (t === 0 || a === b) return a;
  const target = b.match(NUMBER) ?? [];
  let i = 0;
  return a.replace(NUMBER, (n) => {
    const from = Number(n);
    return (from + (Number(target[i++]) - from) * t).toFixed(2);
  });
}

function blend(a: Pose, b: Pose | undefined, t: number): Pose {
  if (!b || t === 0) return a;
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    torso: blendPath(a.torso, b.torso, t),
    back: blendPath(a.back, b.back, t),
    limbs: blendPath(a.limbs, b.limbs, t),
    h: [mix(a.h[0], b.h[0]), mix(a.h[1], b.h[1])],
    d: [mix(a.d[0], b.d[0]), mix(a.d[1], b.d[1])],
  };
}

/** The pose to draw right now: moves with a second keyframe blend between the two while playing. */
/**
 * How far into the move the figure is (0 = the starting position, 1 = the move) at a point in its cycle:
 * a moment at the start, ease into the move, hold it, then ease back.
 */
function cycle(u: number): number {
  const ease = (x: number) => (1 - Math.cos(x * Math.PI)) / 2;
  if (u < 0.12) return 0;
  if (u < 0.4) return ease((u - 0.12) / 0.28);
  if (u < 0.75) return 1;
  return 1 - ease((u - 0.75) / 0.25);
}

/**
 * The pose to draw right now. While playing, the figure starts in a normal position (standing, kneeling, sitting
 * or lying), moves into the exercise, holds it and comes back. `phase` (0–1) shifts where in the cycle it starts,
 * so a list of moves doesn't move in step, and `fps` caps how often it redraws. Paused, or with reduced motion
 * turned on, it shows the exercise itself.
 */
export function usePoseMotion(pose: PoseKey, playing: boolean, phase = 0, fps = 30): Pose {
  const reduceMotion = useReducedMotion();
  const live = playing && !reduceMotion;
  const [t, setT] = useState(1);

  useEffect(() => {
    if (!live) return;
    let frame = 0;
    let last = 0;
    const start = Date.now() - phase * BREATH_MS;
    const gap = 1000 / fps;
    const step = () => {
      const now = Date.now();
      if (now - last > gap) {
        last = now;
        setT(cycle((((now - start) / BREATH_MS) % 1 + 1) % 1));
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [live, phase, fps]);

  return blend(START[pose], POSES[pose], live ? t : 1);
}

type Pt = [number, number];

/** Same skin as the body map: light on the left, shade on the right. */
const SKIN = ['#EDE3CF', '#E2D5BC', '#D1C0A0'];
const SKIN_FAR = '#D3C3A4';
const EDGE = 'rgba(140,114,78,0.55)';
/** The character's clothes and hair, in the app's colours: a deep green top and dark leggings. */
const TOP = '#2F5B47';
const LEGGINGS = '#2A302C';
const LEGGINGS_FAR = '#3B433E';
const HAIR = '#4A3426';
const CLOTH_EDGE = 'rgba(16,24,20,0.55)';
/** The direction arrow: deep green with a soft light edge, so it reads on every bubble colour. */
const ARROW = '#1F5A3E';

/** Radii from the body outwards: upper leg, lower leg, foot… and the same for arms. */
const LEG = [5, 3.9, 3.2, 2.8];
const ARM = [4, 3.2, 2.7, 2.4];
/** The torso widens from hips to chest. */
const HIP = 6.3;
const CHEST = 7.9;

const fmt = (n: number) => n.toFixed(2);

/** The strokes in a pose path as lists of points; curves are sampled into short straight runs. */
function strokes(d: string): Pt[][] {
  const tokens = d.match(/[MLQ]|-?\d+(?:\.\d+)?/g) ?? [];
  const out: Pt[][] = [];
  let line: Pt[] = [];
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      line = [[num(), num()]];
      out.push(line);
    } else if (cmd === 'L') {
      line.push([num(), num()]);
    } else if (cmd === 'Q') {
      const [sx, sy] = line[line.length - 1];
      const [cx, cy, ex, ey] = [num(), num(), num(), num()];
      for (let k = 1; k <= 6; k++) {
        const u = k / 6;
        line.push([(1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex, (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey]);
      }
    }
  }
  return out;
}

const circle = (x: number, y: number, r: number) => `M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0Z`;

/**
 * A tapered limb: a circle at every joint, joined by the band between neighbouring circles.
 * Every piece winds the same way, so they fill as one smooth shape.
 */
function chain(points: Pt[], radii: number[], grow: number): string {
  let d = '';
  points.forEach(([x, y], i) => (d += circle(x, y, radii[i] + grow)));
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const ra = radii[i] + grow;
    const rb = radii[i + 1] + grow;
    d += `M${fmt(ax + nx * ra)} ${fmt(ay + ny * ra)}L${fmt(bx + nx * rb)} ${fmt(by + ny * rb)}L${fmt(bx - nx * rb)} ${fmt(by - ny * rb)}L${fmt(ax - nx * ra)} ${fmt(ay - ny * ra)}Z`;
  }
  return d;
}

type Body = { farLegs: string; farArms: string; torso: string; neck: string; legs: string; arms: string; head: string; face: string; bun: string };

/** Turns a pose into filled body shapes, `grow` units larger all round (for outlines). */
function body(p: Pose, grow: number): Body {
  const [torso] = strokes(p.torso);
  const hip = torso[0];
  const chest = torso[torso.length - 1];
  // Limbs start at the hip (legs) or at the chest (arms).
  const isLeg = (pts: Pt[]) => Math.hypot(pts[0][0] - hip[0], pts[0][1] - hip[1]) < Math.hypot(pts[0][0] - chest[0], pts[0][1] - chest[1]);
  const legs = (d: string) => strokes(d).filter(isLeg).map((pts) => chain(pts, LEG, grow)).join('');
  const arms = (d: string) => strokes(d).filter((pts) => !isLeg(pts)).map((pts) => chain(pts, ARM, grow)).join('');
  const torsoRadii = torso.map((_, i) => HIP + (CHEST - HIP) * (i / Math.max(1, torso.length - 1)));

  // The head is an oval along the line of the neck, so it tilts with the body.
  const [hx, hy] = p.h;
  const len = Math.hypot(hx - chest[0], hy - chest[1]) || 1;
  const vx = (hx - chest[0]) / len;
  const vy = (hy - chest[1]) / len;
  const rx = 6.5 + grow;
  const ry = 7.6 + grow;
  const angle = (Math.atan2(vx, -vy) * 180) / Math.PI;
  const [sx, sy] = [hx + vy * rx, hy - vx * rx];
  const [ex, ey] = [hx - vy * rx, hy + vx * rx];
  const head = `M${fmt(sx)} ${fmt(sy)}A${fmt(rx)} ${fmt(ry)} ${fmt(angle)} 1 0 ${fmt(ex)} ${fmt(ey)}A${fmt(rx)} ${fmt(ry)} ${fmt(angle)} 1 0 ${fmt(sx)} ${fmt(sy)}Z`;

  // Hair covers the head; the face is a slightly smaller oval nudged down the neck, leaving a hairline.
  // A bun sits on top, along the line of the neck, so it reads whichever way the figure faces.
  const fx = hx - vx * 1.3;
  const fy = hy - vy * 1.3;
  const frx = rx - 0.9;
  const fry = ry - 1.6;
  const [fsx, fsy] = [fx + vy * frx, fy - vx * frx];
  const [fex, fey] = [fx - vy * frx, fy + vx * frx];
  const face = `M${fmt(fsx)} ${fmt(fsy)}A${fmt(frx)} ${fmt(fry)} ${fmt(angle)} 1 0 ${fmt(fex)} ${fmt(fey)}A${fmt(frx)} ${fmt(fry)} ${fmt(angle)} 1 0 ${fmt(fsx)} ${fmt(fsy)}Z`;
  const bun = circle(hx + vx * (ry - 0.6), hy + vy * (ry - 0.6), 3.3 + grow);

  return {
    farLegs: legs(p.back),
    farArms: arms(p.back),
    torso: chain(torso, torsoRadii, grow),
    neck: chain([chest, p.h], [3.4, 3], grow),
    legs: legs(p.limbs),
    arms: arms(p.limbs),
    head,
    face,
    bun,
  };
}

/** The whole figure in one colour: for the drop shadow and the glow mask. */
function Silhouette({ b, color }: { b: Body; color: string }) {
  return (
    <>
      {[b.farLegs, b.farArms, b.neck, b.torso, b.legs, b.arms, b.bun, b.head].map((d, i) => (d ? <Path key={i} d={d} fill={color} /> : null))}
    </>
  );
}

/** Far limbs first, then the near body, each with a fine outline: dressed in a green top and leggings, with hair. */
function Figure({ b, edge, skin }: { b: Body; edge: Body; skin: string }) {
  return (
    <>
      {edge.farLegs ? <Path d={edge.farLegs} fill={CLOTH_EDGE} /> : null}
      {b.farLegs ? <Path d={b.farLegs} fill={LEGGINGS_FAR} /> : null}
      {edge.farArms ? <Path d={edge.farArms} fill={EDGE} /> : null}
      {b.farArms ? <Path d={b.farArms} fill={SKIN_FAR} /> : null}
      <Path d={edge.neck} fill={EDGE} />
      <Path d={b.neck} fill={skin} />
      <Path d={edge.legs} fill={CLOTH_EDGE} />
      <Path d={edge.torso} fill={CLOTH_EDGE} />
      <Path d={b.legs} fill={LEGGINGS} />
      <Path d={b.torso} fill={TOP} />
      {edge.arms ? <Path d={edge.arms} fill={EDGE} /> : null}
      {b.arms ? <Path d={b.arms} fill={skin} /> : null}
      <Path d={edge.bun} fill={CLOTH_EDGE} />
      <Path d={b.bun} fill={HAIR} />
      <Path d={edge.head} fill={CLOTH_EDGE} />
      <Path d={b.head} fill={HAIR} />
      <Path d={b.face} fill={skin} />
    </>
  );
}

/** Every point in a pose, in order, so two frames can be compared joint by joint. */
function points(p: Pose): Pt[] {
  const nums = [p.torso, p.back, p.limbs].join(' ').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const out: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  out.push(p.h);
  return out;
}

/**
 * A curved arrow for the main movement: from where the joint that moves most is in the starting position to where it ends up in the move,
 * bowed out away from the body. Null when nothing moves far enough to be worth an arrow.
 */
function arrowFor(pose: PoseKey): { path: string; head: string } | null {
  const a = points(START[pose]);
  const b = points(POSES[pose]);
  let best = -1;
  let dist = 0;
  a.forEach(([x, y], i) => {
    const d = Math.hypot(b[i][0] - x, b[i][1] - y);
    if (d > dist) [best, dist] = [i, d];
  });
  if (best < 0 || dist < 2.5) return null;
  const [s, e] = [a[best], b[best]];
  // Push the arrow out from the middle of the figure so it sits beside the limb, not on it;
  // if that would leave the bubble, put it on the inner side instead.
  const [cx, cy] = [50, 58];
  const mx = (s[0] + e[0]) / 2;
  const my = (s[1] + e[1]) / 2;
  const ol = Math.hypot(mx - cx, my - cy) || 1;
  const inside = (x: number, y: number) => Math.hypot(x - 50, y - 54) < 37;
  const push = inside(mx + ((mx - cx) / ol) * 11, my + ((my - cy) / ol) * 11) ? 7 : -7;
  const [ox, oy] = [((mx - cx) / ol) * push, ((my - cy) / ol) * push];
  const [sx, sy, ex, ey] = [s[0] + ox, s[1] + oy, e[0] + ox, e[1] + oy];
  // Between 9 and 18 units long, centred on the movement: short moves still get a readable arrow,
  // big ones don't sprawl across the drawing.
  const len = Math.hypot(ex - sx, ey - sy);
  const want = Math.min(18, Math.max(9, len));
  const [ux, uy] = [(ex - sx) / (len || 1), (ey - sy) / (len || 1)];
  const [cmx, cmy] = [(sx + ex) / 2, (sy + ey) / 2];
  let [ax, ay, bx, by] = [cmx - (ux * want) / 2, cmy - (uy * want) / 2, cmx + (ux * want) / 2, cmy + (uy * want) / 2];
  // Keep both ends well inside the bubble.
  const fit = (x: number, y: number): Pt => {
    const r = Math.hypot(x - 50, y - 54);
    return r <= 33 ? [x, y] : [50 + ((x - 50) / r) * 33, 54 + ((y - 54) / r) * 33];
  };
  [ax, ay] = fit(ax, ay);
  [bx, by] = fit(bx, by);
  // Bow the curve outwards.
  const nx = -uy;
  const ny = ux;
  const side = (nx * (mx - cx) + ny * (my - cy) >= 0 ? 1 : -1) * Math.sign(push);
  const bow = want * 0.3 * side;
  const [qx, qy] = [(ax + bx) / 2 + nx * bow, (ay + by) / 2 + ny * bow];
  // The head points along the curve's last stretch.
  const tl = Math.hypot(bx - qx, by - qy) || 1;
  const [tx, ty] = [(bx - qx) / tl, (by - qy) / tl];
  const size = 4;
  const head = `M${fmt(bx + tx * size * 0.9)} ${fmt(by + ty * size * 0.9)}L${fmt(bx - ty * size)} ${fmt(by + tx * size)}L${fmt(bx + ty * size)} ${fmt(by - tx * size)}Z`;
  return { path: `M${fmt(ax)} ${fmt(ay)}Q${fmt(qx)} ${fmt(qy)} ${fmt(bx)} ${fmt(by)}`, head };
}

/** Timings of the two-picture switch, in ms: the starting position, the change, the move held, the change back. */
const SWITCH = { start: 1100, fade: 420, hold: 2600 } as const;
const SWITCH_CYCLE = SWITCH.start + SWITCH.fade + SWITCH.hold + SWITCH.fade;

/** The figure in one position, with its floor shadow and (optionally) the glow on the area being stretched. */
function Drawing({ p, id, dot }: { p: Pose; id: string; dot: boolean }) {
  const shape = body(p, 0);
  const edge = body(p, 0.85);
  return (
    <Svg width="100%" height="100%" viewBox="6 10 88 88">
      <Defs>
        <LinearGradient id={`skin${id}`} x1={20} y1={15} x2={85} y2={90} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={SKIN[0]} />
          <Stop offset="0.55" stopColor={SKIN[1]} />
          <Stop offset="1" stopColor={SKIN[2]} />
        </LinearGradient>
        <RadialGradient id={`floor${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#3C2814" stopOpacity={0.24} />
          <Stop offset="1" stopColor="#3C2814" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.mint} stopOpacity={0.75} />
          <Stop offset="0.35" stopColor={colors.mint} stopOpacity={0.4} />
          <Stop offset="0.7" stopColor={colors.mint} stopOpacity={0.12} />
          <Stop offset="1" stopColor={colors.mint} stopOpacity={0} />
        </RadialGradient>
        {dot ? (
          <Mask id={`mask${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={100}>
            <Silhouette b={shape} color="#FFFFFF" />
          </Mask>
        ) : null}
      </Defs>

      <Ellipse cx={50} cy={86} rx={34} ry={4.5} fill={`url(#floor${id})`} />
      <G transform="translate(0.6 1.4)" opacity={0.14}>
        <Silhouette b={edge} color="#3C2814" />
      </G>
      <Figure b={shape} edge={edge} skin={`url(#skin${id})`} />
      {dot ? <Ellipse cx={p.d[0]} cy={p.d[1]} rx={12} ry={12} fill={`url(#glow${id})`} mask={`url(#mask${id})`} /> : null}
    </Svg>
  );
}

/**
 * One move drawn with the app's character inside a round bubble, tinted by the body region it works.
 * Playing, it switches between two pictures: the normal starting position and the exercise, with a short crossfade
 * and a hold on each. Paused, or with reduced motion turned on, it shows the exercise.
 */
export function PoseBubble({ pose, size, color, dot = true, outline, shadow, breathe, arrow, phase = 0, style }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduceMotion = useReducedMotion();
  const playing = !!breathe && !reduceMotion;
  const direction = (arrow ?? size >= 120) ? arrowFor(pose) : null;
  // 1 shows the exercise, 0 the starting position.
  const [show] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!playing) {
      show.setValue(1);
      return;
    }
    show.setValue(0);
    const change = (to: number) => Animated.timing(show, { toValue: to, duration: SWITCH.fade, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER });
    const loop = Animated.sequence([
      // Stagger: start part-way through the cycle, so a list of moves doesn't switch in step.
      Animated.delay((phase % 1) * SWITCH_CYCLE),
      Animated.loop(Animated.sequence([Animated.delay(SWITCH.start), change(1), Animated.delay(SWITCH.hold), change(0)])),
    ]);
    loop.start();
    return () => loop.stop();
  }, [playing, phase, show]);

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        shadow && { boxShadow: size > 120 ? `0px 18px 34px -16px ${shade(0.5)}` : shadows.bubble },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          // Softened towards cream, so the skin-toned figure stands out against it.
          backgroundColor: mix(color, colors.cream, 0.55),
          overflow: 'hidden',
          borderWidth: outline ? 2 : 0,
          borderColor: colors.card,
        }}
      >
        {playing ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: show.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <Drawing p={START[pose]} id={`${uid}s`} dot={false} />
          </Animated.View>
        ) : null}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: show }]}>
          <Drawing p={POSES[pose]} id={`${uid}p`} dot={dot} />
        </Animated.View>
        {direction ? (
          <Svg width="100%" height="100%" viewBox="6 10 88 88" style={StyleSheet.absoluteFill}>
            <Path d={direction.path} fill="none" stroke="rgba(255,253,249,0.9)" strokeWidth={4.6} strokeLinecap="round" />
            <Path d={direction.head} fill="rgba(255,253,249,0.9)" stroke="rgba(255,253,249,0.9)" strokeWidth={2.4} strokeLinejoin="round" />
            <Path d={direction.path} fill="none" stroke={ARROW} strokeWidth={2.2} strokeLinecap="round" />
            <Path d={direction.head} fill={ARROW} stroke={ARROW} strokeWidth={0.6} strokeLinejoin="round" />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}
