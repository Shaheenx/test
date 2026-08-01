// lib/logger.ts
//
// Part 17.3 release checklist: "No console.log in production code."
// Raw console calls were also a dead end in production — nothing captured
// them anywhere once shipped. Now that Sentry is actually initialized
// (app/_layout.tsx), route through here instead so prod errors are visible
// somewhere, and dev keeps full console output.
import * as Sentry from '@sentry/react-native';

type LogContext = Record<string, unknown> | undefined;

export const logger = {
  log(message: string, context?: LogContext) {
    if (__DEV__) {
      console.log(message, context ?? '');
    } else {
      Sentry.addBreadcrumb({ message, level: 'info', data: context });
    }
  },

  warn(message: string, context?: LogContext) {
    if (__DEV__) {
      console.warn(message, context ?? '');
    } else {
      Sentry.addBreadcrumb({ message, level: 'warning', data: context });
    }
  },

  error(message: string, error?: unknown, context?: LogContext) {
    if (__DEV__) {
      console.error(message, error ?? '', context ?? '');
    }
    // Always send errors to Sentry, dev or prod — dev builds benefit from
    // seeing whether an error would actually reach Sentry's dashboard.
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...context } });
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: { error, ...context } });
    }
  },
};
