import { vars } from 'nativewind';
import { Colors } from '../constants/colors';
import { ResolvedTheme } from '../hooks/useThemeColors';

/**
 * Converts a resolved theme ('dark' | 'light') into a NativeWind CSS
 * variable map (`--color-bg-base`, `--color-primary`, etc.) consumed by
 * tailwind.config.js. Apply the result to the root View's `style` prop
 * so every NativeWind className (`bg-bg-card`, `text-text-primary`, ...)
 * resolves to the correct palette without per-component changes.
 *
 * Usage (app/_layout.tsx):
 *   const theme = useResolvedTheme();
 *   <View style={[{ flex: 1 }, getThemeVars(theme)]}>...</View>
 */
export function getThemeVars(theme: ResolvedTheme) {
  const palette = Colors[theme];
  const cssVars: Record<string, string> = {};

  for (const [token, value] of Object.entries(palette)) {
    cssVars[`--color-${token}`] = value;
  }

  return vars(cssVars);
}
