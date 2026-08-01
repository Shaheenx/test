// app/station-information.tsx
import React, { useCallback, useMemo } from 'react';
import { ArrowLeft, MapPin, ShareNetwork, ArrowSquareOut, CaretRight, Phone, Armchair, Ticket, ForkKnife, Drop, Car, MapTrifold, ImageSquare } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Station } from '../types/station.types';
import { useTranslation } from '../i18n';
import { MapView, Marker, PROVIDER_GOOGLE, isMapAvailable, NIGHT_TRAIN_MAP_STYLE } from '../lib/mapKit';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

const FACILITIES = ['Waiting Room', 'Ticket Counter', 'Washroom', 'Food Court', 'Drinking Water', 'Parking'];

const hasCoords = (s: Station | null | undefined): s is Station & { latitude: number; longitude: number } =>
  !!s && typeof s.latitude === 'number' && typeof s.longitude === 'number';

// Task 3 fix: each facility gets its own concept-matching icon instead of
// one repeated colored box. Ticket is reused as the fallback since it's
// already imported for "Ticket Counter" and reads fine as a generic default.
const FACILITY_ICONS: Record<string, typeof Armchair> = {
  'Waiting Room': Armchair,
  'Ticket Counter': Ticket,
  'Washroom': Drop,
  'Food Court': ForkKnife,
  'Drinking Water': Drop,
  'Parking': Car,
};

export default function StationInformationScreen() {
  const colors = useThemeColors();
  const C = colors;
  const si = useMemo(() => createSi(colors), [colors]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: station, isLoading: stationLoading, error: stationError, refetch } = useQuery<Station | null>({
    queryKey: ['station', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('stations')
        .select('id, code, name_en, name_bn, division, zone, is_major, latitude, longitude')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Station | null;
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  const { data: popularTrains } = useQuery<any[]>({
    queryKey: ['station_trains', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('trains')
        .select('id, number, name_en, name_bn, type, origin_id, destination_id')
        .or(`origin_id.eq.${id},destination_id.eq.${id}`)
        .eq('is_active', true)
        .limit(10);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  const openMaps = useCallback(() => {
    const query = encodeURIComponent(`${station?.name_en} Railway Station Bangladesh`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }, [station?.name_en]);

  // Loading state
  if (stationLoading) {
    return (
      <SafeAreaView style={si.root} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing['space-4'], padding: Spacing['space-5'] }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ width: '100%', height: 120, backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], opacity: 0.6 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (stationError) {
    return (
      <SafeAreaView style={si.root} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing['space-4'] }}>
          <Text style={{ color: C['text-secondary'], ...Typography.body }}>{t('common.error')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] }}>
            <Text style={{ color: C['bg-base'], fontWeight: '700', ...Typography.body }}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Not found state
  if (!station && !stationLoading) {
    return (
      <SafeAreaView style={si.root} edges={['top']}>
        <View style={si.header}>
          <TouchableOpacity style={si.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={C['text-primary']} />
          </TouchableOpacity>
          <Text style={si.title}>Station Information</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing['space-4'], padding: Spacing['space-5'] }}>
          <View style={{ width: 80, height: 80, backgroundColor: C['bg-overlay'], borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, color: C['text-tertiary'] }}>🚉</Text>
          </View>
          <Text style={{ color: C['text-primary'], ...Typography.h3, fontWeight: '700', textAlign: 'center' }}>Station Not Found</Text>
          <Text style={{ color: C['text-secondary'], ...Typography.body, textAlign: 'center' }}>
            The station you&#39;re looking for doesn&#39;t exist or has been removed.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] }}
            onPress={() => router.back()}
          >
            <Text style={{ color: C['bg-base'], fontWeight: '700', ...Typography.body }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={si.root} edges={['top']}>
      <View style={si.header}>
        <TouchableOpacity style={si.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View style={si.headerTitle}>
          <View style={[si.headerIcon, { alignItems: 'center', justifyContent: 'center' }]}>
            <MapPin size={18} color={C.primary} />
          </View>
          <Text style={si.title}>Station Information</Text>
        </View>
        <TouchableOpacity style={[si.shareBtn, { alignItems: 'center', justifyContent: 'center' }]}>
          <ShareNetwork size={16} color={C['text-primary']} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={si.scroll}>
        {/* Station name */}
        <View style={si.nameRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] }}>
              <Text style={si.stationName} numberOfLines={1} ellipsizeMode="tail">{station!.name_en}</Text>
              {station!.is_major && (
                <View style={{ backgroundColor: C['primary-subtle'], borderRadius: 6, paddingHorizontal: Spacing['space-2'], paddingVertical: 2, borderWidth: 1, borderColor: C.primary }}>
                  <Text style={{ ...Typography.caption, fontWeight: '700', color: C.primary }}>Major Station</Text>
                </View>
              )}
            </View>
            <Text style={si.stationBn} numberOfLines={1} ellipsizeMode="tail">{station!.name_bn}</Text>
            {station!.code ? (
              <Text style={{ ...Typography.caption, color: C['text-tertiary'], marginTop: 2 }}>Code: {station!.code}</Text>
            ) : null}
          </View>
          <View style={si.ratingBox}>
            {station!.division ? (
              <>
                <Text style={si.ratingNum} numberOfLines={1} ellipsizeMode="tail">{station!.division}</Text>
                <Text style={si.ratingCount}>Division</Text>
              </>
            ) : null}
            {station!.zone ? (
              <Text style={[si.ratingCount, { marginTop: 4 }]}>{station!.zone} Zone</Text>
            ) : null}
          </View>
        </View>
        {/* Location header — functional map wired to lat/lng (Task 4). Visual
            design is a photo carousel (building photo + "1/6" counter +
            pagination dots) with a star rating / review count. Neither a
            photo source nor a ratings/reviews table exists anywhere in this
            schema (no station_photos table, no photo_url column on
            stations, no reviews table) — that data in the screenshot reads
            like it's sourced from Google Places Details/Photos, which this
            app doesn't currently call. Shipping a neutral placeholder here
            rather than faking photos/ratings; see the note at the bottom of
            this file's PR description for what's needed to wire this up
            for real. The map — which the earlier draft mistakenly merged
            into this header — is a separate, SMALL element that belongs in
            the Directions card below, matching the screenshot. */}
        <View style={si.stationPhoto}>
          <ImageSquare size={28} color={C['text-tertiary']} weight="regular" />
          <Text style={si.stationPhotoText}>Station photos coming soon</Text>
        </View>
        {/* Facilities */}
        <View style={si.card}>
          <View style={si.sectionHeader}>
            <Text style={si.sectionTitle}>Facilities</Text>
            <TouchableOpacity><Text style={si.viewAll}>View All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={si.facilitiesRow}>
              {FACILITIES.map(f => (
                <View key={f} style={si.facilityItem}>
                  <View style={[si.facilityIcon, { alignItems: 'center', justifyContent: 'center' }]}>
                    {(() => {
                      const Icon = FACILITY_ICONS[f] ?? Ticket;
                      return <Icon size={22} color={C['text-secondary']} />;
                    })()}
                  </View>
                  <Text style={si.facilityLabel}>{f}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
        {/* Directions */}
        <View style={si.card}>
          <View style={si.dirRow}>
            <View style={{ flex: 1 }}>
              <View style={si.dirTitleRow}>
                <View style={[si.dirIcon, { alignItems: 'center', justifyContent: 'center' }]}>
                <ArrowSquareOut size={12} color={C.primary} />
              </View>
                <Text style={si.dirTitle}>Directions</Text>
              </View>
              <Text style={si.dirAddress}>{station!.name_en} Railway Station{'\n'}{station!.division ? station!.division + ', ' : ''}Bangladesh</Text>
            </View>
            <View style={si.mapPreview}>
              {hasCoords(station) && isMapAvailable && MapView && Marker ? (
                <MapView
                  style={si.mapPreviewMap}
                  initialRegion={{
                    latitude: station!.latitude!,
                    longitude: station!.longitude!,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  customMapStyle={NIGHT_TRAIN_MAP_STYLE as unknown as any[]}
                  {...(Platform.OS === 'android' && PROVIDER_GOOGLE ? { provider: PROVIDER_GOOGLE } : {})}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pointerEvents="none"
                >
                  <Marker
                    coordinate={{ latitude: station!.latitude!, longitude: station!.longitude! }}
                    pinColor={C.primary}
                  />
                </MapView>
              ) : (
                <View style={si.mapPreviewFallback}>
                  <MapTrifold size={20} color={C.info} weight="regular" />
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={si.openMapBtn} onPress={openMaps}>
            <Text style={si.openMapText}>Open in Maps ↗</Text>
          </TouchableOpacity>
        </View>
        {/* Popular trains */}
        <View style={si.card}>
          <View style={si.sectionHeader}>
            <Text style={[si.sectionTitle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">Popular Trains from {station!.name_en}</Text>
            <TouchableOpacity><Text style={si.viewAll}>View All</Text></TouchableOpacity>
          </View>
          {(popularTrains ?? []).length === 0 ? (
            <Text style={{ color: C['text-secondary'], ...Typography['body-sm'], textAlign: 'center', paddingVertical: Spacing['space-3'] }}>No trains found</Text>
          ) : (
            (popularTrains ?? []).map((train, i) => (
              <View key={train.id}>
                <TouchableOpacity
                  style={si.trainRow}
                  onPress={() => router.push({ pathname: '/train-detail' as any, params: { id: train.number } })}
                >
                  <View style={si.trainNumBadge}>
                    <Text style={si.trainNumText}>#{train.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={si.trainName} numberOfLines={1} ellipsizeMode="tail">{train.name_en}</Text>
                    <Text style={si.trainRoute}>{train.name_bn}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={si.trainTime}>{train.type}</Text>
                    <Text style={si.trainFreq}>Active</Text>
                  </View>
                  <CaretRight size={16} color={C['text-tertiary']} />
                </TouchableOpacity>
                {i < (popularTrains ?? []).length - 1 && <View style={si.divider} />}
              </View>
            ))
          )}
        </View>
        {/* Contact */}
        <View style={si.card}>
          <Text style={si.sectionTitle}>Contact</Text>
          {[['Station Master Office', ''], ['Bangladesh Railway', '']].map(([l, v], i, arr) => (
            <View key={l}>
              <View style={si.contactRow}>
                <View style={[si.contactIcon, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Phone size={14} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={si.contactLabel}>{l}</Text>
                  {v ? <Text style={si.contactVal}>{v}</Text> : null}
                </View>
                <CaretRight size={16} color={C['text-tertiary']} />
              </View>
              {i < arr.length - 1 && <View style={si.divider} />}
            </View>
          ))}
        </View>
        <View style={si.noteCard}>
          <Text style={si.noteText}>ℹ Information is community verified. Please help keep it up to date.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createSi = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  headerIcon: { width: 32, height: 32, backgroundColor: C['primary-subtle'], borderRadius: 8 },
  title: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  shareBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stationName: { fontSize: 17, fontWeight: '700', color: C['text-primary'], flexShrink: 1 },
  stationBn: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  ratingBox: { alignItems: 'center', flexShrink: 0, marginLeft: Spacing['space-3'] },
  ratingStar: { fontSize: 16 },
  ratingNum: { fontSize: 14, fontWeight: '700', color: C['text-primary'], maxWidth: 100 },
  ratingCount: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  stationPhoto: { width: '100%', height: 180, backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-lg'], alignItems: 'center', justifyContent: 'center', gap: Spacing['space-2'] },
  stationPhotoText: { ...Typography['body-sm'], color: C['text-tertiary'] },
  mapPreview: { width: 96, height: 84, backgroundColor: C['info-subtle'], borderRadius: 10, overflow: 'hidden' },
  mapPreviewMap: { width: '100%', height: '100%' },
  mapPreviewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  viewAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  facilitiesRow: { flexDirection: 'row', gap: Spacing['space-2'] },
  facilityItem: { alignItems: 'center', gap: Spacing['space-1'], width: 70 },
  facilityIcon: { width: 48, height: 48, backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-md'] },
  facilityLabel: { ...Typography.caption, color: C['text-secondary'], textAlign: 'center' },
  dirRow: { flexDirection: 'row', gap: Spacing['space-3'] },
  dirTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], marginBottom: Spacing['space-2'] },
  dirIcon: { width: 20, height: 20, backgroundColor: C['primary-subtle'], borderRadius: 10 },
  dirTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  dirAddress: { ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 20 },
  openMapBtn: { backgroundColor: C['bg-overlay'], borderRadius: 10, paddingVertical: Spacing['space-3'], alignItems: 'center', borderWidth: 1, borderColor: C.border },
  openMapText: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  trainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'], paddingVertical: Spacing['space-2'] },
  trainNumBadge: { width: 28, height: 28, backgroundColor: C['primary-subtle'], borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trainNumText: { ...Typography['body-sm'], fontWeight: '700', color: C.primary },
  trainName: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  trainRoute: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 1 },
  trainTime: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  trainFreq: { ...Typography.caption, color: C['text-secondary'], marginTop: 1 },
  chevron: { width: 16, height: 16, backgroundColor: C['bg-overlay'], borderRadius: 4 },
  divider: { height: 1, backgroundColor: C.border },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'], paddingVertical: Spacing['space-2'] },
  contactIcon: { width: 28, height: 28, backgroundColor: C['primary-subtle'], borderRadius: 14 },
  contactLabel: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  contactVal: { ...Typography['body-sm'], fontWeight: '600', color: C.primary, marginTop: 2 },
  extIcon: { width: 20, height: 20, backgroundColor: C['primary-subtle'], borderRadius: 10 },
  noteCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-3'] },
  noteText: { ...Typography['body-sm'], color: C['text-secondary'], textAlign: 'center' },
});
