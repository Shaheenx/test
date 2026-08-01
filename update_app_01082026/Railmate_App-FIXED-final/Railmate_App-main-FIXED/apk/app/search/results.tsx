// app/search/results.tsx — Search Results Screen

import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../../constants';
import { useSearchTrains } from '../../hooks/useTrains';
import { useTrainDelayStatus } from '../../hooks/useCommunityReports';
import { TrainSearchResult } from '../../types/database.types';
import { useTranslation } from '../../i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

function SkeletonCard() {
  return (
    <View style={[s.trainCard, { height: 160, opacity: 0.6 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], marginBottom: Spacing['space-3'] }}>
        <View style={{ width: 56, height: 20, backgroundColor: C['bg-overlay'], borderRadius: 4 }} />
        <View style={{ width: 120, height: 16, backgroundColor: C['bg-overlay'], borderRadius: 4 }} />
      </View>
      <View style={{ width: '80%', height: 12, backgroundColor: C['bg-overlay'], borderRadius: 4, marginBottom: Spacing['space-2'] }} />
      <View style={s.divider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing['space-2'] }}>
        <View style={{ width: 60, height: 28, backgroundColor: C['bg-overlay'], borderRadius: 4 }} />
        <View style={{ width: 60, height: 8, backgroundColor: C['bg-overlay'], borderRadius: 4, alignSelf: 'center' }} />
        <View style={{ width: 60, height: 28, backgroundColor: C['bg-overlay'], borderRadius: 4 }} />
      </View>
    </View>
  );
}

function TrainCard({ train, delayStatus, onPress }: {
  train: TrainSearchResult;
  delayStatus?: { delayMinutes: number; reportedAt: string };
  onPress: () => void;
}) {
  const { t } = useTranslation();

  const delayBadgeBg = delayStatus
    ? (delayStatus.delayMinutes >= 15 ? C['danger-subtle'] : C['accent-subtle'])
    : C['primary-subtle'];
  const delayBadgeColor = delayStatus
    ? (delayStatus.delayMinutes >= 15 ? C.danger : C.accent)
    : C.primary;
  const delayBadgeText = delayStatus
    ? `${delayStatus.delayMinutes} min delay`
    : t('results.on_time');

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <TouchableOpacity style={s.trainCard} onPress={onPress} activeOpacity={0.8}>
      {/* Top row */}
      <View style={s.trainTop}>
        <View style={s.trainLeft}>
          <View style={s.numBadge}>
            <Text style={s.numBadgeText}>#{train.train_number}</Text>
          </View>
          <View>
            <Text style={s.trainName}>{train.train_name_en}</Text>
            <Text style={s.trainNameBn}>{train.train_type}</Text>
          </View>
        </View>
        <View style={[s.delayBadge, { backgroundColor: delayBadgeBg }]}>
          <Text style={[s.delayText, { color: delayBadgeColor }]}>{delayBadgeText}</Text>
        </View>
      </View>

      <Text style={s.trainRoute}>{train.train_name_en}</Text>
      <View style={s.divider} />

      {/* Timing */}
      {train.verified ? (
        <View style={s.timingRow}>
          <View>
            <Text style={s.timeMain}>{train.departure_time}</Text>
            <Text style={s.timeLabel}>{t('train.depart')}</Text>
          </View>
          <View style={s.durationCol}>
            <Text style={s.durationText}>{formatDuration(train.duration_minutes)}</Text>
            <View style={s.durationLine} />
            <Text style={s.arrowText}>→</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.timeMain}>{train.arrival_time}</Text>
            <Text style={s.timeLabel}>{t('train.arrive')}</Text>
          </View>
        </View>
      ) : (
        <View style={s.timingRow}>
          <Text style={[s.trainRoute, { color: C['text-tertiary'] }]}>{t('results.schedule_being_verified')}</Text>
        </View>
      )}

      <View style={s.divider} />

      {/* Bottom */}
      <View style={s.trainBottom}>
        <View style={s.classPills}>
          {/* Classes not available per-train without fares table join — skip pills */}
        </View>
        <View>
          <Text style={s.seatsLabel}>{t('results.verified_schedule')}</Text>
          <Text style={[s.seatsValue, { color: train.verified ? C.primary : C['text-tertiary'] }]}>
            {train.verified ? '✓' : '—'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchResultsScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ from_station_id: string; to_station_id: string; date: string; from_name: string; to_name: string }>();
  const { t } = useTranslation();

  const { data: trains, isLoading, error, refetch } = useSearchTrains({
    fromStationId: params.from_station_id,
    toStationId: params.to_station_id,
    date: params.date ?? new Date().toISOString().split('T')[0],
  });

  const trainNumbers = (trains ?? []).filter((tr) => tr.verified).map((tr) => tr.train_number);
  const { data: delayMap } = useTrainDelayStatus(trainNumbers, params.date ?? '');

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  // BUG 4 FIX: When 0 results, fetch alternate trains from same origin station
  const { data: alternateTrains } = useQuery({
    queryKey: ['alternate_trains', params.from_station_id],
    queryFn: async () => {
      if (!params.from_station_id) return [];
      const { data, error } = await supabase
        .from('trains')
        .select('id, number, name_en, type, origin_id, destination_id, days_of_week')
        .eq('origin_id', params.from_station_id)
        .eq('is_active', true)
        .limit(5);
      if (error) return [];
      return data ?? [];
    },
    enabled: !isLoading && !error && (trains?.length ?? 0) === 0 && !!params.from_station_id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View>
          <Text style={s.title}>{t('results.title')}</Text>
          <Text style={s.subtitle}>
            {isLoading ? t('common.loading') : t('results.found', { count: trains?.length ?? 0 })}
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn}><Text style={s.headerBtnText}>{t('results.filter')}</Text></TouchableOpacity>
          <TouchableOpacity style={s.headerBtn}><Text style={s.headerBtnText}>{t('results.sort')}</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >

        {/* Summary card */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View>
              <Text style={s.summaryLabel}>From</Text>
              <Text style={s.summaryValue}>{params.from_name ?? 'Origin'}</Text>
            </View>
            <View style={s.swapIcon} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.summaryLabel}>To</Text>
              <Text style={s.summaryValue}>{params.to_name ?? 'Destination'}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.summaryMeta}>
            <Text style={s.summaryMetaText}>{params.date ?? t('results.today_all_classes')}</Text>
            <Text style={s.summaryMetaText}>All Classes</Text>
          </View>
        </View>

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error state */}
        {!isLoading && !!error && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing['space-5'], gap: Spacing['space-3'] }}>
            <Text style={{ color: C['text-secondary'], ...Typography.body }}>{t('common.error')}</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={{ color: C.primary, ...Typography.body }}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state with alternate suggestions */}
        {!isLoading && !error && trains?.length === 0 && (
          <>
            <View style={{ alignItems: 'center', paddingVertical: Spacing['space-5'], gap: Spacing['space-3'] }}>
              <Image source={require('../../assets/images/empty-search.png')} style={{ width: 140, height: 140 }} resizeMode="contain" />
              <Text style={{ color: C['text-primary'], ...Typography.h4, fontWeight: '600' }}>{t('results.none')}</Text>
              <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>{t('results.none_hint')}</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ color: C.primary, ...Typography.body }}>{t('results.search_again')}</Text>
              </TouchableOpacity>
            </View>

            {/* Alternate trains from same origin */}
            {alternateTrains && alternateTrains.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>Other trains from {params.from_name}</Text>
                <Text style={[s.trainRoute, { marginBottom: Spacing['space-3'] }]}>These trains depart from the same station</Text>
                {alternateTrains.map((train) => (
                  <TouchableOpacity
                    key={train.id}
                    style={[s.numberField, { marginBottom: Spacing['space-2'] }]}
                    onPress={() => router.push({ pathname: '/train/[id]', params: { id: train.number } })}
                  >
                    <Text style={s.numBadgeText}>#{train.number}</Text>
                    <Text style={[s.trainName, { flex: 1 }]}>{train.name_en}</Text>
                    <Text style={s.trainRoute}>{train.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Train list */}
        {!isLoading && !error && (trains ?? []).map((train) => (
          <TrainCard
            key={train.train_id}
            train={train}
            delayStatus={delayMap?.get(train.train_number)}
            onPress={() => router.push({ pathname: '/train/[id]', params: { id: train.train_number } })}
          />
        ))}

        {/* Community verified */}
        <View style={s.communityBadge}>
          <View style={s.communityIcon} />
          <View style={{ flex: 1 }}>
            <Text style={s.communityTitle}>{t('results.community_verified')}</Text>
            <Text style={s.communitySub}>
              {t('results.community_verified_body')}
            </Text>
          </View>
          <View style={s.reportersStack} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing['space-2'] },
  headerBtn: { backgroundColor: C['bg-overlay'], borderRadius: 10, paddingHorizontal: Spacing['space-3'], paddingVertical: 8 },
  headerBtnText: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  summaryCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.caption, color: C['text-secondary'] },
  summaryValue: { ...Typography.h4, fontWeight: '600', color: C['text-primary'], marginTop: 2 },
  swapIcon: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing['space-3'] },
  summaryMeta: { flexDirection: 'row', gap: Spacing['space-5'] },
  summaryMetaText: { ...Typography['body-sm'], fontWeight: '600', color: C['text-secondary'] },
  trainCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  trainTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trainLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  numBadge: { backgroundColor: C['primary-subtle'], borderRadius: 8, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  numBadgeText: { ...Typography['body-sm'], fontWeight: '700', color: C.primary },
  trainName: { fontSize: 14, fontWeight: '700', color: C['text-primary'] },
  trainNameBn: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 1 },
  delayBadge: { borderRadius: 8, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  delayText: { ...Typography.caption, fontWeight: '700' },
  trainRoute: { ...Typography['body-sm'], color: C['text-secondary'] },
  timingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeMain: { fontSize: 20, fontWeight: '700', color: C['text-primary'] },
  timeLabel: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  timeStation: { ...Typography.caption, fontWeight: '600', color: C.primary, marginTop: 1 },
  durationCol: { alignItems: 'center', gap: 4 },
  durationText: { ...Typography['body-sm'], color: C['text-secondary'] },
  durationLine: { width: 60, height: 2, backgroundColor: C.primary, borderRadius: 1 },
  arrowText: { ...Typography['body-sm'], color: C['text-secondary'] },
  trainBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  classPill: { backgroundColor: C['bg-overlay'], borderRadius: 6, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  classPillActive: { backgroundColor: C['primary-subtle'], borderWidth: 1, borderColor: C.primary },
  classPillText: { fontSize: 9, color: C['text-secondary'] },
  classPillTextActive: { color: C.primary },
  seatsLabel: { fontSize: 9, color: C['text-secondary'], textAlign: 'right' },
  seatsValue: { fontSize: 14, fontWeight: '700', color: C.primary, textAlign: 'right' },
  communityBadge: { backgroundColor: C['primary-subtle'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C['primary-dim'], padding: Spacing['space-4'], flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  communityIcon: { width: 40, height: 40, backgroundColor: C['primary-dim'], borderRadius: 20 },
  communityTitle: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  communitySub: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  reportersStack: { width: 40, height: 28, backgroundColor: C['bg-overlay'], borderRadius: 14 },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'] },
  sectionTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'], marginBottom: Spacing['space-2'] },
  numberField: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-md'], padding: Spacing['space-3'], borderWidth: 1, borderColor: C.border },
});
