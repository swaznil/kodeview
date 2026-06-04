export type AccentColor = 'blue' | 'green' | 'purple' | 'amber';

export type Palette = {
  accent: string;
  accentSoft: string;
  background: string;
  border: string;
  danger: string;
  fill: string;
  muted: string;
  panel: string;
  primary: string;
  secondary: string;
  success: string;
  text: string;
};

const accentMap: Record<AccentColor, { dark: string; light: string }> = {
  blue: { light: '#0969da', dark: '#58a6ff' },
  green: { light: '#1a7f37', dark: '#3fb950' },
  purple: { light: '#8250df', dark: '#a371f7' },
  amber: { light: '#bf8700', dark: '#d29922' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export function createPalette(scheme: 'dark' | 'light', accentColor: AccentColor = 'blue'): Palette {
  const accent = accentMap[accentColor][scheme];

  if (scheme === 'dark') {
    return {
      accent,
      accentSoft: `${accent}22`,
      background: '#0d1117',
      border: '#30363d',
      danger: '#f85149',
      fill: '#161b22',
      muted: '#8b949e',
      panel: '#0d1117',
      primary: accentMap.green.dark,
      secondary: '#21262d',
      success: '#3fb950',
      text: '#f0f6fc',
    };
  }

  return {
    accent,
    accentSoft: `${accent}18`,
    background: '#f6f8fa',
    border: '#d0d7de',
    danger: '#cf222e',
    fill: '#ffffff',
    muted: '#57606a',
    panel: '#ffffff',
    primary: accentMap.green.light,
    secondary: '#f6f8fa',
    success: '#1a7f37',
    text: '#24292f',
  };
}
