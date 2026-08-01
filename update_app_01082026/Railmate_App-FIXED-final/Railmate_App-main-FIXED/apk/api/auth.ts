/**
 * Auth API functions
 * Most auth logic is in hooks/useAuth.ts, but these are exported for direct use
 */

export { useAuth } from '../hooks/useAuth';

// Re-export for convenience
export {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../lib/notifications';
