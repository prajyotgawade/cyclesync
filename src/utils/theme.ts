export const COLORS = {
  // Brand Colors
  primary: '#B388FF', // Soft Lavender/Violet
  primaryDark: '#7C4DFF',
  primaryLight: '#E8DEF8',
  accent: '#F2B8B5', // Soft Rose Pink
  accentDark: '#E07A5F',
  teal: '#A8DADC',
  tealDark: '#457B9D',

  // Phase Colors
  menstrual: '#F2B8B5',  // Rose pink
  follicular: '#DDBDF6', // Soft purple/lavender
  ovulation: '#A8DADC',   // Soft mint teal
  luteal: '#F2CC8F',      // Soft warm sandy-yellow

  // Core Neutrals - Light Mode
  light: {
    background: '#FAF8FC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3EDFA',
    text: '#1C1B1F',
    textSecondary: '#625B71',
    border: '#E5E0EC',
    shadow: '#000000',
    card: '#FFFFFF',
    tint: '#7C4DFF',
  },

  // Core Neutrals - Dark Mode
  dark: {
    background: '#121218',
    surface: '#1E1E28',
    surfaceSecondary: '#2C2B38',
    text: '#E6E1E9',
    textSecondary: '#AEAAAE',
    border: '#363445',
    shadow: '#000000',
    card: '#1E1E28',
    tint: '#B388FF',
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.dark.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};
