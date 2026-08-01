// lib/sentry.ts
//
// Crash reporting is a real, separate service from Supabase/PostHog — it
// exists specifically to catch what those two can't: JS exceptions and
// native crashes that happen before or outside normal app flow. Part 15.1
// targets <0.5% crash-free-session rate; this is how that number gets
// measured at all, not just felt anecdotally from beta reports.
//
// The package (@sentry/react-native) was already a dependency — it was
// never actually initialized anywhere, so it's been silently doing nothing.

import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry() {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // Don't throw — a missing DSN in local dev shouldn't block the app,
    // it should just mean nothing gets reported. Loud enough to notice,
    // not loud enough to crash a dev build over.
    if (__DEV__) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN is not set — crash reporting is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    debug: __DEV__,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Session Replay isn't enabled — Part 14 §14.3: no analytics system
    // receives PII, and replay sessions can capture form input by default.
    // Revisit deliberately later with explicit PII-masking config if wanted.
    enabled: !__DEV__ || !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  });

  initialized = true;
}

/**
 * Attaches non-PII user context so a crash report can be filtered/searched
 * by account without storing anything identifying in Sentry itself.
 * Call after auth resolves; call with null on logout.
 */
export function setSentryUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
