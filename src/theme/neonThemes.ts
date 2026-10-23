/**
 * Neon Studio Theme Engine for Keys by Ru
 * British English conventions used throughout (e.g. colour, customise, programme).
 */

export type NeonThemeId =
  | 'signature-pink'
  | 'neon-green'
  | 'cyber-yellow'
  | 'electric-blue'
  | 'deep-purple'
  | 'chrome-silver'
  | 'crimson-red';

export interface NeonTheme {
  id: NeonThemeId;
  name: string;
  description: string;
  primary: string; // Hex code for primary neon accent
  primaryRgb: string; // r, g, b components
  secondary: string; // Companion gradient/secondary neon accent
  secondaryRgb: string; // r, g, b components
  glow: string; // Box shadow / filter glow value
  surface: string; // Harmonised elevated surface tint
  previewGrad: string;
}

export const NEON_THEMES: Record<NeonThemeId, NeonTheme> = {
  'signature-pink': {
    id: 'signature-pink',
    name: 'Signature Pink',
    description: 'The iconic Keys by Ru studio neon glow',
    primary: '#FF1E8E',
    primaryRgb: '255, 30, 142',
    secondary: '#B829FF',
    secondaryRgb: '184, 41, 255',
    glow: '0 0 16px rgba(255, 30, 142, 0.45)',
    surface: '#161021',
    previewGrad: 'linear-gradient(135deg, #FF1E8E 0%, #B829FF 100%)',
  },
  'neon-green': {
    id: 'neon-green',
    name: 'Neon Green',
    description: 'Emerald phosphor frequency matrix',
    primary: '#00FF87',
    primaryRgb: '0, 255, 135',
    secondary: '#00B862',
    secondaryRgb: '0, 184, 98',
    glow: '0 0 16px rgba(0, 255, 135, 0.45)',
    surface: '#0D1D17',
    previewGrad: 'linear-gradient(135deg, #00FF87 0%, #00B862 100%)',
  },
  'cyber-yellow': {
    id: 'cyber-yellow',
    name: 'Cyber Yellow',
    description: 'High-voltage synth wave radiation',
    primary: '#FFE600',
    primaryRgb: '255, 230, 0',
    secondary: '#FF9900',
    secondaryRgb: '255, 153, 0',
    glow: '0 0 16px rgba(255, 230, 0, 0.45)',
    surface: '#1F1B0D',
    previewGrad: 'linear-gradient(135deg, #FFE600 0%, #FF9900 100%)',
  },
  'electric-blue': {
    id: 'electric-blue',
    name: 'Electric Blue',
    description: 'Deep cobalt & plasma laser beam',
    primary: '#00F0FF',
    primaryRgb: '0, 240, 255',
    secondary: '#2563EB',
    secondaryRgb: '37, 99, 235',
    glow: '0 0 16px rgba(0, 240, 255, 0.45)',
    surface: '#0D1924',
    previewGrad: 'linear-gradient(135deg, #00F0FF 0%, #2563EB 100%)',
  },
  'deep-purple': {
    id: 'deep-purple',
    name: 'Deep Purple',
    description: 'Ultraviolet club velvet resonance',
    primary: '#B829FF',
    primaryRgb: '184, 41, 255',
    secondary: '#7C3AED',
    secondaryRgb: '124, 58, 237',
    glow: '0 0 16px rgba(184, 41, 255, 0.45)',
    surface: '#180F26',
    previewGrad: 'linear-gradient(135deg, #B829FF 0%, #7C3AED 100%)',
  },
  'chrome-silver': {
    id: 'chrome-silver',
    name: 'Chrome Silver',
    description: 'Polished titanium studio hardware',
    primary: '#F1F5F9',
    primaryRgb: '241, 245, 249',
    secondary: '#94A3B8',
    secondaryRgb: '148, 163, 184',
    glow: '0 0 16px rgba(241, 245, 249, 0.45)',
    surface: '#161920',
    previewGrad: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
  },
  'crimson-red': {
    id: 'crimson-red',
    name: 'Crimson Red',
    description: 'Sub-bass warmth & analog valve glow',
    primary: '#FF1E42',
    primaryRgb: '255, 30, 66',
    secondary: '#FF5E00',
    secondaryRgb: '255, 94, 0',
    glow: '0 0 16px rgba(255, 30, 66, 0.45)',
    surface: '#210E12',
    previewGrad: 'linear-gradient(135deg, #FF1E42 0%, #FF5E00 100%)',
  },
};

export const NEON_THEME_LIST: NeonTheme[] = Object.values(NEON_THEMES);

export const DEFAULT_NEON_THEME_ID: NeonThemeId = 'signature-pink';

const STORAGE_KEY = 'kbr_neon_theme';

export function getSavedNeonThemeId(): NeonThemeId {
  if (typeof window === 'undefined') return DEFAULT_NEON_THEME_ID;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as NeonThemeId;
    if (saved && NEON_THEMES[saved]) {
      return saved;
    }
  } catch {}
  return DEFAULT_NEON_THEME_ID;
}

export function applyNeonTheme(themeId: NeonThemeId): NeonTheme {
  const theme = NEON_THEMES[themeId] || NEON_THEMES[DEFAULT_NEON_THEME_ID];
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.style.setProperty('--brand-primary', theme.primary);
    root.style.setProperty('--brand-primary-rgb', theme.primaryRgb);
    root.style.setProperty('--brand-secondary', theme.secondary);
    root.style.setProperty('--brand-secondary-rgb', theme.secondaryRgb);
    root.style.setProperty('--brand-glow', theme.glow);
    root.style.setProperty('--surface-elevated', theme.surface);

    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch {}
  }
  return theme;
}
