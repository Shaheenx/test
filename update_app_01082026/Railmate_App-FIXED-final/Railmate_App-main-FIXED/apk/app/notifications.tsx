// app/notifications.tsx — full file. This pass: wired registerForPushNotifications()
// (fires once per user per app session, on first reaching this screen) and added
// an inline banner + Settings deep link for denied/unavailable permission.
// (A prior pass changed queryFn + error render.)
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BellSimple, BellSlash, CaretRight, Checks, GearSix } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { registerForPushNotifications } from '../lib/notifications';
import { logger } from '../lib/logger';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

type NotifFilter = 'All' | 'Alerts' | 'Community' | 'Updates' | 'System';

const getFilters = (C: ThemeColors): { label: NotifFilter; color: string; bg: string }[] => [
  { label: 'All', color: C.primary, bg: C['primary-subtle'] },
  { label: 'Alerts', color: C.danger, bg: C['danger-subtle'] },
  { label: 'Community', color: C.info, bg: C['info-subtle'] },
  { label: 'Updates', color: C.info, bg: C['info-subtle'] },
  { label: 'System', color: C.accent, bg: C['accent-subtle'] },
];

function formatAlertDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return '';
  }
}

// User IDs we've already attempted push registration for during this app
// session (i.e. since the JS bundle was last loaded — a cold launch, not a
// screen re-mount). Module-level, not component state, so navigating away
// from and back to this screen doesn't re-trigger the permission flow. A
// different user signing in during the same session (sign-out, then
// sign-in as someone else) is a new key, so it registers correctly.
const attemptedPushRegistration = new Set<string>();

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const C = colors;
  const FILTERS = useMemo(() => getFilters(colors), [colors]);
  const ns = useMemo(() => createNs(colors), [colors]);
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<NotifFilter>('All');

  const { data: alerts, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('alerts')
        .select('id, user_id, train_id, station_id, alert_type, is_active, created_at, read_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        // 42P01 = Postgres "undefined_table" — the alerts table genuinely
        // doesn't exist yet. That specific case is fine, show empty state.
        // Everything else (RLS denial, bad column, network, JWT) is a real
        // problem and must surface — never swallow by guessing from message text.
        if ((error as any).code === '42P01') return [];
        logger.error('[Notifications] alerts query failed', error, { code: (error as any).code, details: (error as any).details, hint: (error as any).hint });
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (alertId: string) => {
      await supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('id', alertId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const [pushPermissionDenied, setPushPermissionDenied] = useState(false);

  // Register this device for push notifications the first time a logged-in
  // user reaches this screen in the current session — not on every app
  // launch, and not on every re-mount of this screen (see the module-level
  // Set above). registerForPushNotifications never throws (lib/notifications.ts
  // catches internally): it resolves to { token: null, reason } when
  // permission is denied, the device isn't physical, or the token/save step
  // fails, and to { token } on success. The .catch below is a safety net only.
  useEffect(() => {
    const userId = user?.id;
    if (!userId || attemptedPushRegistration.has(userId)) return;

    attemptedPushRegistration.add(userId);
    let cancelled = false;

    registerForPushNotifications(userId)
      .then(({ token }) => {
        if (!cancelled) setPushPermissionDenied(!token);
      })
      .catch((err) => {
        logger.error('[Notifications] push registration threw unexpectedly', err);
        if (!cancelled) setPushPermissionDenied(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={ns.centerState}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={ns.stateText}>{t('common.loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={ns.centerState}>
          <Text style={ns.stateText}>{t('common.error')}</Text>
          {/* Dev-only: shows the actual Postgres/PostgREST error on-device.
              This is temporary debugging visibility — strip this block (or
              gate it more strictly) before a real production release. */}
          {__DEV__ && (
            <Text style={ns.debugText}>
              {(error as any)?.code ? `[${(error as any).code}] ` : ''}
              {(error as any)?.message ?? String(error)}
            </Text>
          )}
          <TouchableOpacity style={ns.retryBtn} onPress={() => refetch()}>
            <Text style={ns.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!alerts || alerts.length === 0) {
      return (
        <View style={ns.centerState}>
          <Text style={ns.stateText}>{t('notifications.empty')}</Text>
        </View>
      );
    }

    return (
      <View style={{ gap: Spacing['space-2'] }}>
        {alerts.map((alert) => {
          const isUnread = !alert.read_at;
          return (
            <TouchableOpacity
              key={alert.id}
              style={[ns.notifCard, isUnread && ns.notifCardUnread]}
              activeOpacity={0.8}
              onPress={() => markRead.mutate(alert.id)}
            >
              <View style={[ns.notifIcon, { backgroundColor: isUnread ? C['primary-subtle'] : C['bg-overlay'], alignItems: 'center', justifyContent: 'center' }]}>
                <BellSimple size={20} color={isUnread ? C.primary : C['text-tertiary']} weight={isUnread ? 'fill' : 'regular'} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={ns.notifTop}>
                  <Text style={[ns.notifTitle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{alert.alert_type ?? 'Alert'}</Text>
                  <View style={ns.notifMeta}>
                    <Text style={ns.notifTime}>{formatAlertDate(alert.created_at)}</Text>
                    <View style={[ns.readDot, { backgroundColor: isUnread ? C.primary : C['text-tertiary'] }]} />
                  </View>
                </View>
                {alert.train_id && (
                  <Text style={ns.notifDesc}>Train ID: {alert.train_id}</Text>
                )}
                {alert.station_id && (
                  <Text style={ns.notifSub}>Station: {alert.station_id}</Text>
                )}
              </View>
              <CaretRight size={16} color={C['text-tertiary']} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={ns.root}>
      <View style={ns.header}>
        <TouchableOpacity style={ns.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View>
          <Text style={ns.title}>Notifications</Text>
          <Text style={ns.subtitle}>Stay informed, travel better</Text>
        </View>
        <View style={ns.headerRight}>
          <TouchableOpacity style={ns.iconBtn} onPress={() => markAllRead.mutate()}>
            <Checks size={18} color={C['text-secondary']} />
          </TouchableOpacity>
          <TouchableOpacity style={ns.iconBtn} onPress={() => router.push('/settings')}>
            <GearSix size={18} color={C['text-secondary']} />
          </TouchableOpacity>
        </View>
      </View>
      {pushPermissionDenied && (
        <View style={ns.pushWarning}>
          <BellSlash size={16} color={C.accent} weight="fill" />
          <Text style={ns.pushWarningText}>
            Push notifications are off, so alerts can't reach you outside the app.
          </Text>
          <TouchableOpacity onPress={() => Linking.openSettings().catch(() => {})}>
            <Text style={ns.pushWarningAction}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ns.filterRow} contentContainerStyle={{ flexDirection: 'row', gap: Spacing['space-2'], paddingHorizontal: Spacing['space-5'] }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.label} style={[ns.chip, active === f.label && { backgroundColor: f.bg, borderColor: f.color }]} onPress={() => setActive(f.label)}>
            <Text style={[ns.chipText, active === f.label && { color: f.color, fontWeight: '700' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ns.scroll}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
const createNs = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-2'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], fontWeight: '600', color: C.primary, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing['space-2'] },
  iconBtn: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterRow: { marginBottom: Spacing['space-3'] },
  chip: { backgroundColor: C['bg-card'], borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, height: 36, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  chipText: { ...Typography['body-sm'], color: C['text-secondary'] },
  group: { gap: Spacing['space-2'] },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing['space-2'] },
  groupLabel: { ...Typography.body, fontWeight: '700', color: C['text-secondary'] },
  markAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  notifCard: { backgroundColor: C['bg-card'], borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['space-3'] },
  notifCardUnread: { borderColor: C.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 22 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  notifTime: { ...Typography.caption, color: C['text-tertiary'] },
  readDot: { width: 8, height: 8, borderRadius: 4 },
  notifDesc: { ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 18 },
  notifSub: { ...Typography.caption, color: C['text-tertiary'] },
  chevron: { width: 16, height: 16, backgroundColor: C['bg-overlay'], borderRadius: 4 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: Spacing['space-3'] },
  stateText: { ...Typography.body, color: C['text-secondary'], textAlign: 'center' },
  debugText: { ...Typography.caption, color: C['text-tertiary'], textAlign: 'center', fontFamily: 'monospace', paddingHorizontal: Spacing['space-5'] },
  retryBtn: { backgroundColor: C['primary-subtle'], borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-4'], paddingVertical: Spacing['space-2'], borderWidth: 1, borderColor: C.primary },
  retryText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  pushWarning: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], backgroundColor: C['accent-subtle'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.accent, paddingHorizontal: Spacing['space-4'], paddingVertical: Spacing['space-3'], marginHorizontal: Spacing['space-5'], marginBottom: Spacing['space-2'] },
  pushWarningText: { ...Typography['body-sm'], color: C['text-primary'], flex: 1 },
  pushWarningAction: { ...Typography['body-sm'], fontWeight: '700', color: C.accent },
});