import { colors } from './theme';

/** Colours and accents for each Today screen look. */
export type LookTokens = {
  dark: boolean;
  /** Page background, top to bottom. Null keeps the standard cream-to-sand backdrop. */
  background: [string, string] | null;
  ink: string;
  muted: string;
  faint: string;
  /** Structure: kickers, links, selected states. */
  accent: string;
  /** Used only for progress and glow. */
  bright: string;
  /** Text on the bright colour. */
  onBright: string;
  rule: string;
  chip: { bg: string; border: string; text: string; icon: string; onBg: string; onText: string };
  /** 'region': the hero takes the colour of today's focus area. */
  hero: 'card' | 'region';
  /** The hero's base colour, blended with the region colour at the top. */
  heroBase: string;
  /** How much region colour the top of the hero gets. */
  heroTint: number;
  heroBorder: string;
  /** 'hold': press and hold to start, with a breathing halo. */
  start: 'tap' | 'hold';
  button: { bg: string; text: string; halo: string };
  figureFill: string;
  glow: string;
  weekGlow: boolean;
  /** The garden at the top of Today: sky (top to bottom), soil, the sun (or moon) and plant stems. */
  garden: { sky: [string, string]; soil: string; sun: string; stem: string };
};

export const LOOKS: Record<'current' | 'dawn' | 'vision' | 'dusk' | 'evening', LookTokens> = {
  current: {
    dark: false,
    background: null,
    ink: colors.ink,
    muted: colors.muted,
    faint: colors.faint,
    accent: colors.greenText,
    bright: colors.green,
    onBright: colors.white,
    rule: colors.line,
    chip: { bg: 'rgba(255,253,249,0.82)', border: 'rgba(90,70,40,0.16)', text: colors.ink, icon: colors.green, onBg: colors.green, onText: colors.white },
    hero: 'card',
    heroBase: colors.card,
    heroTint: 0,
    heroBorder: colors.border,
    start: 'tap',
    button: { bg: colors.ink, text: colors.cream, halo: 'transparent' },
    figureFill: colors.figure,
    glow: colors.green,
    weekGlow: false,
    garden: { sky: ['#EAF2EA', colors.card], soil: colors.figure, sun: '#F2C14E', stem: '#4F7A5E' },
  },
  // Light that follows the sun: dawn → day → dusk → night (evening).
  dawn: {
    dark: false,
    background: ['#FCF3EA', '#F6EBDD'],
    ink: '#1E1A16',
    muted: '#5E5246',
    faint: '#8C7F70',
    accent: '#1F5A3E',
    bright: '#A6F2C8',
    onBright: '#1F5A3E',
    rule: 'rgba(120,80,40,0.12)',
    chip: { bg: '#FFFFFF', border: 'rgba(30,26,22,0.08)', text: '#1E1A16', icon: '#1F5A3E', onBg: '#1F5A3E', onText: '#FBF8F3' },
    hero: 'region',
    heroBase: '#FFFFFF',
    heroTint: 0.42,
    heroBorder: 'rgba(255,255,255,0.9)',
    start: 'hold',
    button: { bg: '#1F5A3E', text: '#FBF8F3', halo: '#F4B98A' },
    figureFill: colors.figure,
    glow: colors.green,
    weekGlow: true,
    garden: { sky: ['#FCDDC6', '#FFF6EC'], soil: '#E6D3BC', sun: '#F09A5E', stem: '#4F7A5E' },
  },
  vision: {
    dark: false,
    // A fresh sage-white rather than cream: daytime in the garden.
    background: ['#F7F9F4', '#EDF2EA'],
    ink: '#1A1915',
    muted: '#5E574B',
    faint: '#746C61',
    accent: '#1F5A3E',
    bright: '#A6F2C8',
    onBright: '#1F5A3E',
    rule: 'rgba(31,90,62,0.10)',
    chip: { bg: '#FFFFFF', border: 'rgba(26,25,21,0.08)', text: '#1A1915', icon: '#1F5A3E', onBg: '#1F5A3E', onText: '#FBF8F3' },
    hero: 'region',
    heroBase: '#FFFFFF',
    heroTint: 0.42,
    heroBorder: 'rgba(255,255,255,0.9)',
    start: 'hold',
    button: { bg: '#1F5A3E', text: '#FBF8F3', halo: '#A6F2C8' },
    figureFill: colors.figure,
    glow: colors.green,
    weekGlow: true,
    garden: { sky: ['#DCEEE1', '#FBFDF9'], soil: '#E3D6C0', sun: '#F2C14E', stem: '#4F7A5E' },
  },
  dusk: {
    dark: false,
    background: ['#F9EBDD', '#F0DCC6'],
    ink: '#1F1812',
    muted: '#5C4A3B',
    faint: '#8A7562',
    accent: '#1F5A3E',
    bright: '#A6F2C8',
    onBright: '#1F5A3E',
    rule: 'rgba(120,70,30,0.14)',
    chip: { bg: '#FFFBF6', border: 'rgba(31,24,18,0.09)', text: '#1F1812', icon: '#1F5A3E', onBg: '#1F5A3E', onText: '#FBF8F3' },
    hero: 'region',
    heroBase: '#FFFBF6',
    heroTint: 0.4,
    heroBorder: 'rgba(255,255,255,0.8)',
    start: 'hold',
    button: { bg: '#1F5A3E', text: '#FBF8F3', halo: '#F2B36B' },
    figureFill: colors.figure,
    glow: colors.green,
    weekGlow: true,
    garden: { sky: ['#F4C9A0', '#FDF0E2'], soil: '#DCC2A2', sun: '#E2793A', stem: '#4F7A5E' },
  },
  evening: {
    dark: true,
    background: ['#15241D', '#0C1611'],
    ink: '#F4EEE3',
    muted: 'rgba(244,238,227,0.68)',
    faint: 'rgba(244,238,227,0.55)',
    accent: '#A6F2C8',
    bright: '#A6F2C8',
    onBright: '#10201A',
    rule: 'rgba(244,238,227,0.10)',
    chip: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#F4EEE3', icon: '#A6F2C8', onBg: '#A6F2C8', onText: '#10201A' },
    hero: 'region',
    heroBase: '#17271F',
    heroTint: 0.3,
    heroBorder: 'rgba(255,255,255,0.08)',
    start: 'hold',
    button: { bg: '#A6F2C8', text: '#10201A', halo: '#A6F2C8' },
    figureFill: '#3B6351',
    glow: '#A6F2C8',
    weekGlow: true,
    garden: { sky: ['#1E3A2E', '#17271F'], soil: '#2C4237', sun: '#EDE6D2', stem: '#8FCFA9' },
  },
};
