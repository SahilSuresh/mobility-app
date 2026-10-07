import { Platform } from 'react-native';

import type { AreaId } from '@/data/types';
import { readAppearance } from '@/lib/appearance';

/** Animations run on the native thread on phones; the browser has no such thread. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

/** Dark green (default) or the light cream look, as saved in Settings. Fixed for the whole run of the app. */
export const isDark = readAppearance() === 'dark';

/**
 * The dark green look from Today: cream text, mint accents and selected states with dark text on them (`onGreen`).
 */
const DARK = {
  bgTop: '#15241D',
  bgMid: '#11201A',
  bgBottom: '#0C1611',
  /** Cards and sheets: a step lighter than the background. */
  card: '#1B2D24',
  cardEnd: '#16271F',
  ink: '#F4EEE3',
  muted: '#ADADA4',
  faint: '#8D948A',
  chevron: '#6E7A70',
  border: 'rgba(244,238,227,0.10)',
  line: 'rgba(244,238,227,0.10)',
  track: 'rgba(244,238,227,0.12)',
  /** Accent fills, selected states, progress and glows. */
  green: '#A6F2C8',
  /** Accent text and icons. */
  greenText: '#A6F2C8',
  /** Text on the faint accent tint. */
  greenDeep: '#C9F7DC',
  greenTint: 'rgba(166,242,200,0.12)',
  /** Text and icons on an accent fill (buttons, selected chips, ticks). */
  onGreen: '#10201A',
  mint: '#A6F2C8',
  cream: '#FFF8EC',
  sandTop: '#BDF5D6',
  sandBottom: '#8FE0B5',
  figure: '#3B6351',
  flame: '#F08A45',
  flameText: '#F4A56B',
  sheet: '#1A2B22',
  scrim: 'rgba(0,0,0,0.55)',
  white: '#FFFFFF',
};

/**
 * The light look, matching Today's day look: a fresh sage-white background, white cards, ink text,
 * deep green buttons and selected states with cream text on them (`onGreen`).
 */
const LIGHT: typeof DARK = {
  bgTop: '#F7F9F4',
  bgMid: '#F2F6EF',
  bgBottom: '#EDF2EA',
  card: '#FFFFFF',
  cardEnd: '#FAFCF8',
  ink: '#1A1915',
  muted: '#5E574B',
  faint: '#746C61',
  chevron: '#91897D',
  border: 'rgba(26,25,21,0.08)',
  line: 'rgba(31,90,62,0.10)',
  track: 'rgba(31,90,62,0.10)',
  green: '#1F5A3E',
  greenText: '#1F5A3E',
  greenDeep: '#1F5A3E',
  greenTint: 'rgba(31,90,62,0.08)',
  onGreen: '#FBF8F3',
  mint: '#A6F2C8',
  cream: '#FFF8EC',
  sandTop: '#2A6E4D',
  sandBottom: '#1F5A3E',
  figure: '#E3D6C0',
  flame: '#E8772A',
  flameText: '#A44E12',
  sheet: '#FFFFFF',
  scrim: 'rgba(26,25,21,0.4)',
  white: '#FFFFFF',
};

export const colors = isDark ? DARK : LIGHT;

/** Lines and soft fills in the text colour, at some opacity: cream on dark, a soft green-grey on light. */
export const tint = (opacity: number) => (isDark ? `rgba(244,238,227,${opacity})` : `rgba(31,60,45,${opacity})`);
/** The accent colour at some opacity, for halos, tints and selected backgrounds. */
export const accent = (opacity: number) => (isDark ? `rgba(166,242,200,${opacity})` : `rgba(31,90,62,${opacity})`);
/** A frosted surface over the background (chips, pills, glassy cards). */
export const glass = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
/** A fainter frosted surface (card footers). */
export const glassSoft = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(237,242,234,0.6)';
/** Shadow colour at some opacity. */
export const shade = (opacity: number) => (isDark ? `rgba(0,0,0,${opacity})` : `rgba(20,40,30,${opacity})`);

/** Large text settings still scale the app, but only so far, so rows and buttons keep their shape. */
export const MAX_FONT_SCALE = 1.3;

export const fonts = {
  /** Headings and big numbers: the Lora serif from Today, across the whole app. */
  display: 'Lora_600SemiBold',
  serif: 'Lora_600SemiBold',
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export const shadows = isDark
  ? {
      card: '0px 1px 2px rgba(0,0,0,0.25), 0px 14px 30px -12px rgba(0,0,0,0.55)',
      small: '0px 6px 14px -6px rgba(0,0,0,0.45)',
      button: '0px 12px 24px -12px rgba(0,0,0,0.6)',
      green: '0px 8px 18px -10px rgba(166,242,200,0.45)',
      bubble: '0px 8px 18px -8px rgba(0,0,0,0.55)',
    }
  : {
      card: '0px 1px 2px rgba(20,40,30,0.05), 0px 14px 30px -12px rgba(20,40,30,0.16)',
      small: '0px 6px 14px -6px rgba(20,40,30,0.14)',
      button: '0px 12px 24px -12px rgba(31,90,62,0.55)',
      green: '0px 8px 16px -10px rgba(31,90,62,0.6)',
      bubble: '0px 8px 18px -8px rgba(20,40,30,0.3)',
    };

/** Bubble colours for the pose drawings, used in rotation. */
export const POSE_COLORS = ['#9FBFA8', '#D9BE93', '#D49A7C', '#93A9BC', '#B4B98A'] as const;

/** Move bubbles are coloured by the body region a move works, so the colour carries meaning. */
export const REGION_COLORS: Record<AreaId, string> = {
  neck: '#93A9BC',
  shoulders: '#93A9BC',
  elbows: '#B4B98A',
  wrists: '#B4B98A',
  upperBack: '#9FBFA8',
  lowerBack: '#9FBFA8',
  hips: '#D9BE93',
  knees: '#D49A7C',
  ankles: '#D49A7C',
  feet: '#D49A7C',
};

export const SCREEN_PADDING = 24;
/** Space to leave under scrolling tab screens so content clears the floating tab bar. */
export const TAB_BAR_SPACE = 110;
