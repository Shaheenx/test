// app/route-map.tsx
import React, { useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Star,
  ShareNetwork,
  MapPin,
  MapTrifold,
  Clock,
  Lightning,
  Plus,
  Minus,
  Crosshair,
  CaretRight,
  BookmarkSimple,
  Bell,
  Check,
  Compass,
  Lightbulb,
  WarningCircle,
} from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useTrainDetail } from '../hooks/useTrainDetail';
import { TrainAvatar } from '../components/ui/TrainAvatar/TrainAvatar';
import { useSavedRoutes } from '../hooks/useSavedRoutes';
import { useTranslation } from '../i18n';
import { useFeatureGate } from '../lib/featureGates';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE, isMapAvailable, NIGHT_TRAIN_MAP_STYLE } from '../lib/mapKit';
import type { Station } from '../types/database.types';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

type RouteMapView = 'map' | 'timeline';

interface GeoPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isStart: boolean;
  isEnd: boolean;
}

const hasCoords = (s: Station | null | undefined): s is Station & { latitude: number; longitude: number } =>
  !!s && typeof s.latitude === 'number' && typeof s.longitude === 'number';

export default function RouteMapScreen() {
  const colors = useThemeColors();
  const C = colors;
  const rm = useMemo(() => createRm(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [view, setView] = React.useState<RouteMapView>('map');
  const mapRef = useRef<InstanceType<NonNullable<typeof MapView>> | null>(null);

  // Tile-load watchdog — the native MapView can mount successfully (zoom
  // controls + Google attribution render) while the actual tile imagery
  // never arrives, which typically means a Google Cloud Console config
  // problem (Maps SDK not enabled, billing off, API key Android
  // restriction mismatch) rather than anything fixable in this file.
  // `onMapLoaded` (Android) fires once tiles have actually rendered; if it
  // hasn't fired ~5s after the map is ready, show an inline fallback note
  // so the failure is visible instead of a silent dark rectangle.
  const [tilesLoaded, setTilesLoaded] = React.useState(false);
  const [showMapTilesNotice, setShowMapTilesNotice] = React.useState(false);

  const { data: train, isLoading, error } = useTrainDetail(id ?? '');
  const { saveRoute, isRouteSaved } = useSavedRoutes();
  const { allowed: delayAlertsAllowed } = useFeatureGate('delayNotifications');

  const handleSaveRoute = async () => {
    if (!train?.origin || !train?.destination) return;
    await saveRoute(
      { id: train.origin.id, name_en: train.origin.name_en, name_bn: train.origin.name_bn, code: train.origin.code },
      { id: train.destination.id, name_en: train.destination.name_en, name_bn: train.destination.name_bn, code: train.destination.code }
    );
  };

  const handleDelayAlertsPress = () => {
    if (delayAlertsAllowed) {
      router.push('/journey-tools');
    } else {
      router.push({ pathname: '/coming-soon', params: { feature: t('route_map.delay_alerts') + ' (Pro)' } });
    }
  };

  const isSaved = train?.origin && train?.destination
    ? isRouteSaved(train.origin.id, train.destination.id)
    : false;

  const stops = train?.stops ?? [];

  // Coordinates flow from stations.latitude/longitude (Part 07 §7.2). Not
  // every station has been geocoded yet, so points are filtered rather than
  // assumed — a route is only drawable once at least two verified points
  // exist, otherwise the timeline list is the source of truth.
  const geoPoints: GeoPoint[] = useMemo(() => {
    const points: GeoPoint[] = [];
    if (stops.length > 0) {
      stops.forEach((stop, i) => {
        if (hasCoords(stop.station)) {
          points.push({
            id: stop.id,
            name: stop.station.name_en,
            latitude: stop.station.latitude,
            longitude: stop.station.longitude,
            isStart: i === 0,
            isEnd: i === stops.length - 1,
          });
        }
      });
    } else if (hasCoords(train?.origin) && hasCoords(train?.destination)) {
      points.push(
        { id: 'origin', name: train!.origin!.name_en, latitude: train!.origin!.latitude, longitude: train!.origin!.longitude, isStart: true, isEnd: false },
        { id: 'destination', name: train!.destination!.name_en, latitude: train!.destination!.latitude, longitude: train!.destination!.longitude, isStart: false, isEnd: true }
      );
    }
    return points;
  }, [stops, train]);

  const MapComponent = MapView;
  const MarkerComponent = Marker;
  const PolylineComponent = Polyline;
  const canRenderMap = isMapAvailable && !!MapComponent && !!MarkerComponent && !!PolylineComponent && geoPoints.length >= 2;

  const initialRegion = useMemo(() => {
    if (geoPoints.length < 2) return undefined;
    const lats = geoPoints.map(p => p.latitude);
    const lngs = geoPoints.map(p => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.3),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.3),
    };
  }, [geoPoints]);

  const recenter = useCallback(() => {
    mapRef.current?.fitToCoordinates(
      geoPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [geoPoints]);

  const zoom = useCallback((delta: number) => {
    mapRef.current?.getCamera().then((cam: any) => {
      mapRef.current?.animateCamera({ ...cam, zoom: (cam.zoom ?? 12) + delta }, { duration: 200 });
    });
  }, []);

  // Reset the watchdog whenever the map tab is (re-)entered — the
  // MapComponent unmounts when the user switches to the timeline tab, so a
  // fresh native view means tiles need to load again.
  React.useEffect(() => {
    if (view === 'map') setTilesLoaded(false);
  }, [view]);

  React.useEffect(() => {
    if (!canRenderMap || Platform.OS !== 'android' || tilesLoaded) {
      setShowMapTilesNotice(false);
      return;
    }
    const timer = setTimeout(() => setShowMapTilesNotice(true), 5000);
    return () => clearTimeout(timer);
  }, [canRenderMap, tilesLoaded, view]);

  if (isLoading) {
    return (
      <SafeAreaView style={rm.root}>
        <View style={rm.header}>
          <TouchableOpacity style={rm.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
          <View style={rm.headerCenter}>
            <TrainAvatar size={40} />
            <View>
              <Text style={rm.title}>{t('route_map.title')}</Text>
            </View>
          </View>
          <View style={rm.headerActions}>
            <View style={rm.starBtn}><Star size={16} color={C['text-tertiary']} /></View>
            <View style={rm.shareBtn}><ShareNetwork size={16} color={C['text-tertiary']} /></View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !train) {
    return (
      <SafeAreaView style={rm.root}>
        <View style={rm.header}>
          <TouchableOpacity style={rm.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
          <View style={rm.headerCenter}>
            <TrainAvatar size={40} />
            <View><Text style={rm.title}>{t('route_map.title')}</Text></View>
          </View>
          <View style={rm.headerActions}>
            <View style={rm.starBtn}><Star size={16} color={C['text-tertiary']} /></View>
            <View style={rm.shareBtn}><ShareNetwork size={16} color={C['text-tertiary']} /></View>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing['space-3'] }}>
          <Text style={{ color: C['text-secondary'], ...Typography.body }}>
            {error ? t('common.error') : t('train.not_found')}
          </Text>
          <TouchableOpacity style={rm.retryBtn} onPress={() => router.back()}>
            <Text style={rm.retryBtnText}>{t('common.go_back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const originName = train.origin?.name_en ?? t('route_map.unknown');
  const destName = train.destination?.name_en ?? t('route_map.unknown');
  const trainLabel = `${train.name_en} (${train.number})`;

  return (
    <SafeAreaView style={rm.root}>
      {/* Header */}
      <View style={rm.header}>
        <TouchableOpacity style={rm.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View style={rm.headerCenter}>
          <TrainAvatar size={40} />
          <View>
            <Text style={rm.title}>{t('route_map.title')}</Text>
            <Text style={rm.subtitle}>{originName} → {destName}</Text>
            <View style={rm.trainSelector}>
              <Text style={rm.trainSelectorText}>{trainLabel}  ▾</Text>
            </View>
          </View>
        </View>
        <View style={rm.headerActions}>
          <TouchableOpacity style={rm.starBtn} onPress={handleSaveRoute}>
            <Star
              size={16}
              weight={isSaved ? 'fill' : 'regular'}
              color={isSaved ? C.primary : C['text-secondary']}
            />
          </TouchableOpacity>
          <TouchableOpacity style={rm.shareBtn} onPress={() => Share.share({ message: `${trainLabel}: ${originName} → ${destName}` })}>
            <ShareNetwork size={16} color={C['text-secondary']} weight="regular" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View toggle */}
      <View style={rm.viewToggle}>
        <TouchableOpacity
          style={[rm.viewTab, view === 'map' && rm.viewTabActive]}
          onPress={() => setView('map')}
        >
          <View style={rm.viewTabInner}>
            <MapPin size={14} weight={view === 'map' ? 'fill' : 'regular'} color={view === 'map' ? C['bg-base'] : C['text-secondary']} />
            <Text style={[rm.viewTabText, view === 'map' && rm.viewTabTextActive]}>{t('route_map.tab_map')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[rm.viewTab, view === 'timeline' && rm.viewTabActive]}
          onPress={() => setView('timeline')}
        >
          <View style={rm.viewTabInner}>
            <Clock size={14} weight={view === 'timeline' ? 'fill' : 'regular'} color={view === 'timeline' ? C['bg-base'] : C['text-secondary']} />
            <Text style={[rm.viewTabText, view === 'timeline' && rm.viewTabTextActive]}>{t('route_map.tab_timeline')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rm.scroll}>

        {view === 'map' ? (
          /* ── MAP VIEW ── */
          <View style={rm.mapSection}>
            <View style={rm.mapContainer}>
              {canRenderMap && MapComponent && MarkerComponent && PolylineComponent ? (
                <MapComponent
                  ref={mapRef}
                  {...(Platform.OS === 'android' && PROVIDER_GOOGLE ? { provider: PROVIDER_GOOGLE } : {})}
                  style={rm.map}
                  initialRegion={initialRegion}
                  customMapStyle={NIGHT_TRAIN_MAP_STYLE as unknown as any[]}
                  onMapReady={recenter}
                  onMapLoaded={() => setTilesLoaded(true)}
                >
                  <PolylineComponent
                    coordinates={geoPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                    strokeWidth={3}
                    strokeColor={C.primary}
                  />
                  {geoPoints.map((p) => (
                    <MarkerComponent
                      key={p.id}
                      coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                      title={p.name}
                      pinColor={(p.isStart || p.isEnd) ? C.primary : C['text-tertiary']}
                    />
                  ))}
                </MapComponent>
              ) : (
                <View style={rm.mapPlaceholder}>
                  <MapTrifold size={40} color={C.info} weight="regular" />
                  <Text style={rm.mapLabel}>{t('route_map.map_unavailable')}</Text>
                  <Text style={rm.mapSub}>{t('route_map.map_unavailable_hint')}</Text>
                </View>
              )}
              {canRenderMap && (
                <View style={rm.mapControls}>
                  <TouchableOpacity style={rm.mapBtn} onPress={() => zoom(1)}><Plus size={16} color={C['text-primary']} weight="regular" /></TouchableOpacity>
                  <TouchableOpacity style={rm.mapBtn} onPress={() => zoom(-1)}><Minus size={16} color={C['text-primary']} weight="regular" /></TouchableOpacity>
                  <TouchableOpacity style={rm.mapBtn} onPress={recenter}><Crosshair size={16} color={C['text-primary']} weight="regular" /></TouchableOpacity>
                </View>
              )}
              {canRenderMap && showMapTilesNotice && !tilesLoaded && (
                <View style={rm.mapTilesNotice}>
                  <WarningCircle size={14} color={C.accent} weight="regular" />
                  <Text style={rm.mapTilesNoticeText} numberOfLines={2} ellipsizeMode="tail">
                    {t('route_map.map_tiles_timeout')}
                  </Text>
                </View>
              )}
            </View>

            {/* Stops list alongside map */}
            <View style={rm.stopsPanel}>
              <View style={rm.stopsPanelHeader}>
                <Text style={rm.stopsPanelTitle}>{t('route_map.major_stations')}</Text>
                <View style={rm.stopsBadge}>
                  <Text style={rm.stopsBadgeText}>{t('route_map.stops_count', { count: stops.length })}</Text>
                </View>
              </View>
              {stops.length === 0 ? (
                <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>{t('route_map.no_stops')}</Text>
              ) : (
                stops.map((stop, i) => {
                  const isFirst = i === 0;
                  const isLast = i === stops.length - 1;
                  const time = stop.departure_time?.slice(0, 5) ?? stop.arrival_time?.slice(0, 5) ?? '—';
                  return (
                    <View key={stop.id}>
                      <View style={rm.stopRow}>
                        <View style={rm.stopIndicator}>
                          <View style={[rm.stopDot, { backgroundColor: (isFirst || isLast) ? C.primary : C['text-tertiary'] }]} />
                          {i < stops.length - 1 && <View style={rm.stopLine} />}
                        </View>
                        <View style={rm.stopContent}>
                          <View style={rm.stopTimeRow}>
                            <Text style={rm.stopTime}>{time}</Text>
                            <Text style={rm.stopStation}>{stop.station?.name_en ?? t('route_map.unknown')}</Text>
                            {isFirst && (
                              <View style={rm.stopTag}>
                                <Text style={rm.stopTagText}>{t('route_map.start')}</Text>
                              </View>
                            )}
                            {isLast && (
                              <View style={[rm.stopTag, rm.stopTagEnd]}>
                                <Text style={[rm.stopTagText, rm.stopTagTextEnd]}>{t('route_map.end')}</Text>
                              </View>
                            )}
                          </View>
                          {stop.halt_minutes > 0 && (
                            <Text style={rm.stopExtra}>{t('train.halt', { minutes: stop.halt_minutes })}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={rm.locationBtn}
                          accessibilityLabel={t('route_map.open_in_maps')}
                          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.station?.name_en ?? '')}`)}
                        >
                          <MapPin size={10} color={C.info} weight="regular" />
                        </TouchableOpacity>
                        <View style={rm.stopChevron}><CaretRight size={10} color={C['text-tertiary']} weight="regular" /></View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* ── TIMELINE VIEW ── */
          <View style={rm.timelineSection}>
            {stops.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing['space-5'] }}>
                <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>{t('route_map.no_timeline')}</Text>
              </View>
            ) : (
              stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast = i === stops.length - 1;
                const time = stop.departure_time?.slice(0, 5) ?? stop.arrival_time?.slice(0, 5) ?? '—';
                return (
                  <View key={stop.id} style={rm.timelineRow}>
                    <View style={rm.timelineLeft}>
                      <Text style={rm.timelineTime}>{time}</Text>
                    </View>
                    <View style={rm.timelineIndicator}>
                      <View style={[rm.timelineDot, { backgroundColor: (isFirst || isLast) ? C.primary : C['text-tertiary'] }]} />
                      {i < stops.length - 1 && <View style={rm.timelineLine} />}
                    </View>
                    <View style={rm.timelineContent}>
                      <Text style={[rm.timelineStation, (isFirst || isLast) && { color: C.primary }]}>
                        {stop.station?.name_en ?? t('route_map.unknown')}
                      </Text>
                      {stop.halt_minutes > 0 && (
                        <Text style={rm.timelineExtra}>{t('train.halt', { minutes: stop.halt_minutes })}</Text>
                      )}
                      {isFirst && (
                        <View style={rm.stopTag}>
                          <Text style={rm.stopTagText}>{t('route_map.start')}</Text>
                        </View>
                      )}
                      {isLast && (
                        <View style={[rm.stopTag, rm.stopTagEnd]}>
                          <Text style={[rm.stopTagText, rm.stopTagTextEnd]}>{t('route_map.end')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Journey stats */}
        <View style={rm.statsCard}>
          {[
            { Icon: MapPin, label: t('route_map.stat_stops'), val: String(stops.length), sub: '' },
            { Icon: Clock, label: t('route_map.stat_duration'), val: '—', sub: t('route_map.estimated') },
            { Icon: Lightning, label: t('route_map.stat_speed'), val: '—', sub: t('route_map.estimated') },
          ].map(stat => (
            <View key={stat.label} style={rm.statItem}>
              <stat.Icon size={18} color={C.primary} weight="regular" />
              <Text style={rm.statLabel}>{stat.label}</Text>
              <Text style={rm.statVal}>{stat.val}</Text>
              {!!stat.sub && <Text style={rm.statSub}>{stat.sub}</Text>}
            </View>
          ))}
        </View>

        {/* Train info */}
        <View style={rm.trainInfoCard}>
          <View style={rm.trainInfoLeft}>
            <TrainAvatar size={40} />
            <View style={rm.trainInfoLeftText}>
              <Text style={rm.trainInfoName} numberOfLines={1} ellipsizeMode="tail">{trainLabel}</Text>
              <Text style={rm.trainInfoRoute} numberOfLines={1} ellipsizeMode="tail">{originName} → {destName}</Text>
              <View style={rm.dailyBadge}><Text style={rm.dailyBadgeText}>{t('route_map.daily_service')}</Text></View>
            </View>
          </View>
          <View style={rm.trainInfoRight}>
            <Text style={rm.trainInfoLabel}>{t('train.departure')}</Text>
            <Text style={rm.trainInfoDep} numberOfLines={1} ellipsizeMode="tail">{originName}</Text>
            <Text style={rm.trainInfoLabel}>{t('train.arrival')}</Text>
            <Text style={rm.trainInfoArr} numberOfLines={1} ellipsizeMode="tail">{destName}</Text>
          </View>
          <View style={rm.trainInfoChevron}><CaretRight size={12} color={C['text-tertiary']} weight="regular" /></View>
        </View>

        {/* Action rows */}
        <View style={rm.actionRow}>
          <View style={rm.actionIcon}>
            <BookmarkSimple size={16} color={isSaved ? C.primary : C['text-secondary']} weight={isSaved ? 'fill' : 'regular'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rm.actionLabel}>{t('route_map.save_route')}</Text>
            <Text style={rm.actionValue}>{isSaved ? t('route_map.saved_confirmation') : t('route_map.save_hint')}</Text>
          </View>
          {isSaved ? (
            <View style={rm.savedCheck}><Check size={14} color={C['bg-base']} weight="fill" /></View>
          ) : (
            <TouchableOpacity style={rm.actionChevron} onPress={handleSaveRoute}>
              <CaretRight size={12} color={C['text-tertiary']} weight="regular" />
            </TouchableOpacity>
          )}
        </View>

        {/* Delay Alerts — Pro feature (Part 12 §12.1 / Part 13 §13.1: DELAY_ALERT
            is free: ✗, pro: ✓). Free users are routed to the same Coming Soon
            upsell pattern used elsewhere in the app rather than shown a toggle
            that silently does nothing. */}
        <TouchableOpacity style={rm.actionRow} onPress={handleDelayAlertsPress} activeOpacity={0.7}>
          <View style={rm.actionIcon}><Bell size={16} color={C.primary} weight="regular" /></View>
          <View style={{ flex: 1 }}>
            <Text style={rm.actionLabel}>{t('route_map.delay_alerts')}</Text>
            <Text style={rm.actionValue}>
              {delayAlertsAllowed ? t('route_map.delay_alerts_hint') : t('route_map.delay_alerts_pro_hint')}
            </Text>
          </View>
          <View style={rm.actionChevron}><CaretRight size={12} color={C['text-tertiary']} weight="regular" /></View>
        </TouchableOpacity>

        {/* Route overview */}
        <View style={rm.overviewCard}>
          <View style={rm.overviewLeft}>
            <View style={rm.overviewIcon}><Compass size={18} color={C.primary} weight="regular" /></View>
            <View style={rm.overviewStats}>
              {[
                [t('route_map.stops_label'), String(stops.length)],
                [t('route_map.origin_short'), originName.slice(0, 8)],
                [t('route_map.dest_short'), destName.slice(0, 8)],
                [t('route_map.service_label'), t('route_map.daily')],
              ].map(([l, v]) => (
                <View key={l} style={rm.overviewItem}>
                  <Text style={rm.overviewLabel} numberOfLines={1} ellipsizeMode="tail">{l}</Text>
                  <Text style={rm.overviewVal} numberOfLines={1} ellipsizeMode="tail">{v}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={rm.crowdBox}>
            <Text style={rm.crowdLabel}>{t('route_map.crowd_level')}</Text>
            <View style={rm.crowdIcons}>
              <View style={[rm.crowdDot, { backgroundColor: C.success }]} />
              <View style={[rm.crowdDot, { backgroundColor: C.accent }]} />
              <View style={[rm.crowdDot, { backgroundColor: C.danger }]} />
            </View>
            <Text style={rm.crowdVal}>{t('route_map.unknown')}</Text>
          </View>
          <View style={rm.overviewChevron}><CaretRight size={12} color={C['text-tertiary']} weight="regular" /></View>
        </View>

        <View style={rm.tapHint}>
          <Lightbulb size={16} color={C.accent} weight="regular" />
          <Text style={rm.tapHintText}>{t('route_map.tap_hint')}</Text>
          <View style={rm.tapHintChevron}><CaretRight size={12} color={C['text-tertiary']} weight="regular" /></View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createRm = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  title: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'] },
  trainSelector: { marginTop: 2 },
  trainSelectorText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  headerActions: { flexDirection: 'row', gap: Spacing['space-2'] },
  starBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  viewToggle: { flexDirection: 'row', marginHorizontal: Spacing['space-5'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: 4, gap: 4 },
  viewTab: { flex: 1, paddingVertical: Spacing['space-2'], alignItems: 'center', borderRadius: 10 },
  viewTabActive: { backgroundColor: C.primary },
  viewTabInner: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewTabText: { ...Typography['body-sm'], fontWeight: '500', color: C['text-secondary'] },
  viewTabTextActive: { fontWeight: '700', color: C['bg-base'] },
  mapSection: { flexDirection: 'row', gap: Spacing['space-3'] },
  mapContainer: { flex: 1, position: 'relative', minHeight: 320 },
  map: { flex: 1, height: 320, borderRadius: Radius['radius-lg'], overflow: 'hidden' },
  mapPlaceholder: { height: 320, backgroundColor: C['info-subtle'], borderRadius: Radius['radius-lg'], alignItems: 'center', justifyContent: 'center', gap: Spacing['space-2'], borderWidth: 1, borderColor: C.info, paddingHorizontal: Spacing['space-4'] },
  mapLabel: { ...Typography.h4, fontWeight: '700', color: C['text-primary'], textAlign: 'center' },
  mapSub: { ...Typography['body-sm'], color: C['text-secondary'], textAlign: 'center' },
  mapControls: { position: 'absolute', left: Spacing['space-3'], bottom: Spacing['space-3'], gap: Spacing['space-2'] },
  mapBtn: { width: 32, height: 32, backgroundColor: C['bg-base'], borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  mapTilesNotice: { position: 'absolute', top: Spacing['space-3'], left: Spacing['space-3'], right: Spacing['space-3'], flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing['space-3'], paddingVertical: Spacing['space-2'] },
  mapTilesNoticeText: { flex: 1, flexShrink: 1, ...Typography['body-sm'], color: C['text-secondary'] },
  stopsPanel: { flex: 1, gap: Spacing['space-1'] },
  stopsPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['space-1'] },
  stopsPanelTitle: { ...Typography['body-sm'], fontWeight: '700', color: C['text-primary'] },
  stopsBadge: { backgroundColor: C['primary-subtle'], borderRadius: 8, paddingHorizontal: Spacing['space-1'], paddingVertical: 2 },
  stopsBadgeText: { ...Typography.caption, fontWeight: '600', color: C.primary },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['space-1'] },
  stopIndicator: { alignItems: 'center', width: 14 },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  stopLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: C.border, marginTop: 2 },
  stopContent: { flex: 1, paddingBottom: Spacing['space-2'] },
  stopTimeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'], flexWrap: 'wrap' },
  stopTime: { ...Typography.time, fontWeight: '600', color: C['text-primary'] },
  stopStation: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  stopTag: { backgroundColor: C['primary-subtle'], borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  stopTagEnd: { backgroundColor: C['bg-overlay'] },
  stopTagText: { fontSize: 8, fontWeight: '700', color: C.primary },
  stopTagTextEnd: { color: C['text-secondary'] },
  stopExtra: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  locationBtn: { width: 16, height: 16, backgroundColor: C['info-subtle'], borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stopChevron: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  timelineSection: { gap: Spacing['space-2'] },
  timelineRow: { flexDirection: 'row', gap: Spacing['space-3'] },
  timelineLeft: { width: 48, alignItems: 'flex-end' },
  timelineTime: { ...Typography.time, fontWeight: '600', color: C['text-primary'] },
  timelineIndicator: { alignItems: 'center', width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, minHeight: 28, backgroundColor: C.border, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: Spacing['space-3'], gap: 4 },
  timelineStation: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  timelineExtra: { ...Typography['body-sm'], color: C['text-secondary'] },
  statsCard: { flexDirection: 'row', backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statLabel: { ...Typography.caption, color: C['text-secondary'], textAlign: 'center' },
  statVal: { fontSize: 14, fontWeight: '700', color: C['text-primary'] },
  statSub: { ...Typography.caption, color: C['text-tertiary'] },
  trainInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  trainInfoLeft: { flex: 1, flexDirection: 'row', gap: Spacing['space-3'], alignItems: 'center' },
  trainInfoLeftText: { flex: 1, flexShrink: 1 },
  trainInfoName: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  trainInfoRoute: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  dailyBadge: { backgroundColor: C['bg-overlay'], borderRadius: 6, paddingHorizontal: Spacing['space-1'], paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  dailyBadgeText: { ...Typography.caption, color: C['text-secondary'] },
  trainInfoRight: { gap: 2, minWidth: 92, maxWidth: 130, flexShrink: 0 },
  trainInfoLabel: { ...Typography.caption, color: C['text-secondary'] },
  trainInfoDep: { ...Typography.body, fontWeight: '700', color: C.primary },
  trainInfoArr: { ...Typography.body, fontWeight: '700', color: C.info },
  trainInfoChevron: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'] },
  actionIcon: { width: 28, height: 28, backgroundColor: C['bg-overlay'], borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  actionValue: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  savedCheck: { width: 24, height: 24, backgroundColor: C.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionChevron: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  overviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  overviewLeft: { flex: 1, flexDirection: 'row', gap: Spacing['space-3'], alignItems: 'center' },
  overviewIcon: { width: 36, height: 36, backgroundColor: C['primary-subtle'], borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  overviewStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['space-2'] },
  overviewItem: { minWidth: 56, maxWidth: 100, flexShrink: 1 },
  overviewLabel: { ...Typography.caption, color: C['text-secondary'] },
  overviewVal: { ...Typography['body-sm'], fontWeight: '700', color: C['text-primary'] },
  crowdBox: { alignItems: 'center', gap: 4, minWidth: 72, flexShrink: 0 },
  crowdLabel: { ...Typography.caption, color: C['text-secondary'] },
  crowdIcons: { flexDirection: 'row', gap: 4 },
  crowdDot: { width: 8, height: 8, borderRadius: 4 },
  crowdVal: { ...Typography['body-sm'], fontWeight: '700', color: C.accent },
  overviewChevron: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  tapHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-3'], gap: Spacing['space-2'] },
  tapHintText: { flex: 1, ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 18 },
  tapHintChevron: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  retryBtnText: { ...Typography.body, fontWeight: '700', color: C['bg-base'] },
});