import { Platform } from 'react-native';

/**
 * Shadow tokens for RailMate design system
 * iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android: elevation
 */
export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
  }),
  glowGreen: Platform.select({
    ios: {
      shadowColor: '#00A859',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 0 }, // No glow on Android
  }),
} as const;
