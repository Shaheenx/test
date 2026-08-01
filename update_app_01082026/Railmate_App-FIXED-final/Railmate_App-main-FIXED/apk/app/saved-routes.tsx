// app/saved-routes.tsx
//
// Real "Saved Routes" screen. Previously this menu item routed to
// /coming-soon?feature=Saved+Routes even though useSavedRoutes() was fully
// functional — see hooks/useSavedRoutes.ts. This screen lists saved
// routes, lets the user delete one (with confirmation), and taps through
// to search results for that route.

import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookmarkSimple, ArrowsLeftRight, TrashSimple } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useSavedRoutes, SavedRoute } from '../hooks/useSavedRoutes';
import { useTranslation } from '../i18n';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

// "Saved Today" / "Saved Yesterday" / "Saved N days ago" — same relative
// date convention already used for this exact data shape in
// app/journey-tools.tsx. Kept local rather than utils/timeAgo.ts, which
// only covers minute/hour granularity and is coupled to community.*
// translation keys that don't apply here.
function formatSavedLabel(isoString: string): string {
  const savedDate = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function SavedRoutesScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { t, isBengali } = useTranslation();
  const { savedRoutes, loading, deleteRoute, refresh } = useSavedRoutes();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Tap-through — same params shape used by app/(tabs)/index.tsx,
  // app/(tabs)/search.tsx and app/search-trains.tsx when pushing to
  // /search-results, with today's date since a saved route has no
  // associated travel date of its own.
  const handleRoutePress = useCallback((route: SavedRoute) => {
    router.push({
      pathname: '/search-results',
      params: {
        from_station_id: route.fromStation.id,
        to_station_id: route.toStation.id,
        date: new Date().toISOString().split('T')[0],
        from_name: isBengali ? route.fromStation.name_bn : route.fromStation.name_en,
        to_name: isBengali ? route.toStation.name_bn : route.toStation.name_en,
      },
    } as any);
  }, [router, isBengali]);

  // Same confirm-then-delete pattern as app/journey-tools.tsx.
  const handleDeletePress = useCallback((route: SavedRoute) => {
    const fromName = isBengali ? route.fromStation.name_bn : route.fromStation.name_en;
    const toName = isBengali ? route.toStation.name_bn : route.toStation.name_en;
    Alert.alert(
      t('journey.remove_route'),
      `Remove "${fromName} → ${toName}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.remove'), style: 'destructive', onPress: () => deleteRoute(route.id) },
      ],
    );
  }, [t, isBengali, deleteRoute]);

  const renderContent = () => {
    if (loading && savedRoutes.length === 0) {
      return (
        <View style={s.centerState}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={s.stateText}>{t('common.loading')}</Text>
        </View>
      );
    }

    if (savedRoutes.length === 0) {
      return (
        <View style={s.centerState}>
          <View style={s.emptyIconWrap}>
            <BookmarkSimple size={40} color={C.primary} weight="fill" />
          </View>
          <Text style={s.emptyTitle}>{t('journey.no_saved_routes')}</Text>
          <Text style={s.emptySub}>{t('journey.no_saved_routes_sub')}</Text>
          <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/(tabs)/search' as any)}>
            <Text style={s.emptyCtaText}>Find a Route</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ gap: Spacing['space-3'] }}>
        {savedRoutes.map((route) => {
          const fromName = isBengali ? route.fromStation.name_bn : route.fromStation.name_en;
          const toName = isBengali ? route.toStation.name_bn : route.toStation.name_en;
          return (
            <View key={route.id} style={s.routeCard}>
              <TouchableOpacity
                style={s.routeMain}
                activeOpacity={0.8}
                onPress={() => handleRoutePress(route)}
              >
                <View style={s.routeIconWrap}>
                  <BookmarkSimple size={18} color={C.primary} weight="fill" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={s.routeNameRow}>
                    <Text style={s.routeName} numberOfLines={1} ellipsizeMode="tail">{fromName}</Text>
                    <ArrowsLeftRight size={13} color={C.primary} weight="bold" />
                    <Text style={s.routeName} numberOfLines={1} ellipsizeMode="tail">{toName}</Text>
                  </View>
                  <Text style={s.routeSaved}>Saved {formatSavedLabel(route.savedAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDeletePress(route)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <TrashSimple size={18} color={C.danger} weight="regular" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={C['text-primary']} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.title} numberOfLines={1}>{t('journey.saved_routes')}</Text>
          <Text style={s.subtitle} numberOfLines={1}>{t('profile.menu_routes_sub')}</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:            { flex: 1, backgroundColor: C['bg-base'] },
  scroll:          { padding: Spacing['space-5'], paddingBottom: 40, flexGrow: 1 },

  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'], gap: Spacing['space-2'] },
  backBtn:         { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  title:           { ...Typography.h3, fontWeight: '700', color: C['text-primary'], textAlign: 'center' },
  subtitle:        { ...Typography['body-sm'], color: C['text-secondary'], textAlign: 'center', marginTop: 2 },
  headerSpacer:    { width: 36 },

  centerState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: Spacing['space-3'] },
  stateText:       { ...Typography.body, color: C['text-secondary'], textAlign: 'center' },

  emptyIconWrap:   { width: 88, height: 88, backgroundColor: C['primary-subtle'], borderRadius: Radius['radius-xl'], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['space-2'] },
  emptyTitle:      { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  emptySub:        { ...Typography['body-sm'], color: C['text-secondary'], textAlign: 'center', paddingHorizontal: Spacing['space-8'] },
  emptyCta:        { marginTop: Spacing['space-2'], backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingVertical: Spacing['space-3'], paddingHorizontal: Spacing['space-6'] },
  emptyCtaText:    { ...Typography['body-sm'], fontWeight: '700', color: C['text-inverse'] },

  routeCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, paddingVertical: Spacing['space-3'], paddingHorizontal: Spacing['space-4'], gap: Spacing['space-3'] },
  routeMain:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  routeIconWrap:   { width: 36, height: 36, backgroundColor: C['primary-subtle'], borderRadius: Radius['radius-md'], alignItems: 'center', justifyContent: 'center' },
  routeNameRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  routeName:       { ...Typography.body, fontWeight: '700', color: C['text-primary'], flexShrink: 1 },
  routeSaved:      { ...Typography.caption, color: C['text-tertiary'] },
  deleteBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C['danger-subtle'], borderRadius: Radius['radius-md'] },
});
