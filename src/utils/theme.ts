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

  // Core Neutrals & Context-Aware Brands - Light Mode
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
    // Light mode brand variants
    primary: '#B388FF',
    primaryDark: '#7C4DFF',
    primaryLight: '#E8DEF8', // Very light pastel
    accent: '#F2B8B5',
    accentDark: '#E07A5F',
    accentLight: '#FCECEC',
  },

  // Core Neutrals & Context-Aware Brands - Dark Mode
  dark: {
    background: '#000000', // Premium OLED Black
    surface: '#15141A',    // Deep obsidian/purple for cards
    surfaceSecondary: '#212029',
    text: '#FFFFFF',
    textSecondary: '#A09FA6',
    border: '#2B2A36',
    shadow: '#000000',
    card: '#15141A',
    tint: '#B388FF',
    // Dark mode brand variants (muted/adapted for dark backgrounds)
    primary: '#B388FF',
    primaryDark: '#D0B3FF', // Lighter for contrast on dark
    primaryLight: '#2A1F40', // Deep purple instead of blinding white/pastel
    accent: '#F2B8B5',
    accentDark: '#F8D8D6', // Lighter for contrast
    accentLight: '#3D2423', // Deep rose instead of blinding pastel
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
