import { useColorScheme } from 'react-native';
import { useCycleStore } from '../store/useCycleStore';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../utils/theme';

export function useTheme() {
  const storeTheme = useCycleStore(state => state.theme);
  const systemScheme = useColorScheme();

  // Resolve current active theme mode
  const mode = storeTheme === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : storeTheme;

  const isDark = mode === 'dark';
  const themeColors = isDark ? COLORS.dark : COLORS.light;
  const shadow = isDark ? SHADOWS.dark : SHADOWS.light;

  return {
    isDark,
    mode,
    colors: themeColors,
    brandColors: { ...COLORS, ...themeColors } as any,
    typography: TYPOGRAPHY,
    shadow,
  };
}
