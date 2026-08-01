import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { usePrefsStore } from '../stores/prefsStore';

export type ResolvedTheme = 'dark' | 'light';
export type ThemeColors = typeof Colors.dark;

/**
 * Resolves the user's theme preference ('dark' | 'light' | 'system') against
 * the device color scheme. Defaults to 'dark' when the system scheme is
 * unavailable, matching the app's dark-first design.
 */
export function useResolvedTheme(): ResolvedTheme {
  const themePref = usePrefsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  if (themePref === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return themePref;
}

/**
 * Returns the active color token map (Colors.dark or Colors.light).
 * This is the ONLY place screens/components should source colors from —
 * never inline hex values or local `const C = {...}` palettes.
 *
 * Usage:
 *   const colors = useThemeColors();
 *   <View style={{ backgroundColor: colors['bg-card'] }} />
 */
export function useThemeColors(): ThemeColors {
  const theme = useResolvedTheme();
  return Colors[theme];
}
