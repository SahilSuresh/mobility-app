import type { DayPart } from './timeOfDay';

/**
 * The sky for each part of the day, shared by the Quick routines cards and the body card on Today, so the page
 * reads as one world. `sky` runs top to horizon; `angle` is where the sun (or moon) sits on its arc, in degrees
 * (180 the left horizon, 270 straight up, 360 the right horizon); `glow` is the light it casts low on the horizon.
 */
export const SKIES: Record<DayPart, { sky: [string, string]; angle: number; glow: string; moon?: boolean }> = {
  morning: { sky: ['#3A4868', '#E59E7C'], angle: 202, glow: '#FFD3A8' },
  midday: { sky: ['#3E7799', '#B9D6E2'], angle: 270, glow: '#FFFFFF' },
  evening: { sky: ['#3B2D4E', '#D9895E'], angle: 334, glow: '#FFB27A' },
  night: { sky: ['#0D1828', '#24395A'], angle: 238, glow: '#BFD3FF', moon: true },
};

/** A few fixed stars for the night sky, as (x, y, radius) in parts of the card's width. */
export const STARS: [number, number, number][] = [
  [0.62, 0.14, 0.006], [0.78, 0.22, 0.004], [0.9, 0.12, 0.005], [0.55, 0.3, 0.004], [0.86, 0.36, 0.006], [0.7, 0.42, 0.003],
];

/** A crescent moon as an SVG path, centred on (cx, cy) with radius r, lit on the left. */
export function crescent(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy + r} A${r * 0.62} ${r} 0 1 1 ${cx} ${cy - r} Z`;
}
