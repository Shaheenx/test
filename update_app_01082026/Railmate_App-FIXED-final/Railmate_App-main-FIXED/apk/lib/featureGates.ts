import { useAuth } from '../hooks/useAuth';

/**
 * Feature gates for free vs. premium tiers
 * Free users have limited access; Premium users get unlimited
 */
export const LIMITS = {
  savedRoutes: { free: 3, pro: Infinity },
  dailyAlerts: { free: 1, pro: Infinity },
  offlineAccess: { free: false, pro: true },
  widgets: { free: false, pro: true },
  adsShown: { free: true, pro: false },
  delayNotifications: { free: false, pro: true },
} as const;

export type FeatureName = keyof typeof LIMITS;

/**
 * Check if a feature is allowed for the current user tier
 * @param feature - Feature name from LIMITS
 * @param isPremium - Whether user has premium status
 * @returns boolean (for feature flags) or number (for numeric limits)
 */
export function canUseFeature(
  feature: FeatureName,
  isPremium: boolean
): boolean | number {
  return isPremium ? LIMITS[feature].pro : LIMITS[feature].free;
}

/**
 * Hook to check feature gate access
 * Returns whether the feature is allowed and the user's premium status
 */
export function useFeatureGate(feature: FeatureName) {
  const { isPremium } = useAuth();
  const allowed = canUseFeature(feature, isPremium);

  return {
    allowed,
    isPremium,
    limit: typeof allowed === 'number' ? allowed : undefined,
    isBoolean: typeof allowed === 'boolean',
  };
}

/**
 * Check if user can perform an action that has a numeric limit
 * @param feature - Feature with numeric limit (e.g., savedRoutes)
 * @param currentCount - Current count of items
 * @param isPremium - Whether user has premium
 * @returns true if under limit, false if at/over limit
 */
export function canPerformAction(
  feature: FeatureName,
  currentCount: number,
  isPremium: boolean
): boolean {
  const limit = canUseFeature(feature, isPremium);
  if (typeof limit === 'boolean') return limit;
  return currentCount < limit;
}
