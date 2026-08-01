// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show the notification in the foreground
    shouldPlaySound: true, // Play a sound
    shouldSetBadge: true,  // Update the app icon badge number
    shouldShowBanner: true, // (iOS) Show banner
    shouldShowList: true,   // (iOS) Show in notification center
  }),
});

/**
 * Ensure the Android notification channel exists.
 *
 * MUST run before any push token is requested and before any notification
 * can reach this app. On Android, the first notification delivered to an
 * unconfigured channel silently auto-creates it at default importance, and
 * importance cannot be changed programmatically after that point — only the
 * user can fix it, manually, in system settings. Safe to call repeatedly.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00A859',
  });
}

/**
 * Current OS-level notification permission status, with no side effects.
 *
 * Use this from any Settings/toggle UI to decide what to do next:
 *   - granted            → nothing to do
 *   - !granted && canAskAgain  → call Notifications.requestPermissionsAsync()
 *   - !granted && !canAskAgain → THIS is the only case that should route to
 *                                Linking.openSettings(). Never default to
 *                                Settings — only reach for it here.
 */
export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted: status === 'granted', canAskAgain };
}

export type RegisterPushReason =
  | 'NOT_A_DEVICE'
  | 'PERMISSION_DENIED'
  | 'TOKEN_ERROR'
  | 'SAVE_ERROR';

export type RegisterPushResult = {
  token: string | null;
  reason?: RegisterPushReason;
};

/**
 * Register for push notifications and save token to database.
 * Call this after successful authentication, not on app launch.
 *
 * @param userId - Authenticated user's ID
 * @returns token, plus a reason code whenever token is null. Callers must
 *          branch on `reason` — do not treat every null token as "permission
 *          denied." A SAVE_ERROR or TOKEN_ERROR means the OS permission is
 *          fine and the user should NOT be sent to system Settings.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<RegisterPushResult> {
  if (!Device.isDevice) {
    logger.warn('Push notifications only work on physical devices');
    return { token: null, reason: 'NOT_A_DEVICE' };
  }

  // Channel must exist before anything else touches notifications on this device.
  try {
    await ensureAndroidChannel();
  } catch (error) {
    logger.error('Failed to configure Android notification channel', error);
    // Non-fatal — continue. Worth surfacing in Sentry once Part 17.3's
    // EAS env vars are registered; this failure mode is otherwise invisible.
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    logger.warn('Push notification permission denied');
    return { token: null, reason: 'PERMISSION_DENIED' };
  }

  // EXPO_PUBLIC_PROJECT_ID is not a standard Expo env var — fall back to the
  // EAS project ID Expo already knows about from app.config.js, so a missing
  // env var doesn't silently kill registration the way the Sentry vars did.
  const projectId =
    process.env.EXPO_PUBLIC_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId;

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenData.data;
  } catch (error) {
    logger.error('Error getting Expo push token', error);
    return { token: null, reason: 'TOKEN_ERROR' };
  }

  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) {
    logger.error('Failed to save push token', error);
    // Permission is granted and the token is real — this is a persistence
    // failure, not a permission failure. Do not let the caller conflate them.
    return { token: null, reason: 'SAVE_ERROR' };
  }

  return { token };
}

/**
 * Clear push token from database (call on sign out)
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: null })
      .eq('id', userId);
    if (error) {
      logger.error('Failed to clear push token', error);
    }
  } catch (error) {
    logger.error('Error unregistering push notifications', error);
  }
}

/**
 * Schedule a local notification (for testing)
 */
type ScheduleTrigger = Parameters<typeof Notifications.scheduleNotificationAsync>[0]['trigger'];

export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds: number = 0
): Promise<string> {
  const trigger: ScheduleTrigger = delaySeconds > 0
    ? { type: SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + delaySeconds * 1000) }
    : null;

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger,
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}