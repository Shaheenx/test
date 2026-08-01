// app/train-detail.tsx — Train Detail Screen

import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Share, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShareNetwork, Bell } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { TrainHero } from '../components/train/TrainHero';
import { useTrainDetail } from '../hooks/useTrainDetail';
import { useCommunityReports } from '../hooks/useCommunityReports';
import { useTrainStopProgress } from '../hooks/useTrainStopProgress';
import { useTranslation } from '../i18n';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calcDuration(depTime: string, arrTime: string): string {
  const [dh, dm] = depTime.split(':').map(Number);
  const [ah, am] = arrTime.split(':').map(Number);
  let depMins = dh * 60 + dm;
  let arrMins = ah * 60 + am;
  if (arrMins < depMins) arrMins += 24 * 60; // overnight
  const diff = arrMins - depMins;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

export default function TrainDetailScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: train, isLoading, error, refetch } = useTrainDetail(id ?? '');
  const { data: reports } = useCommunityReports({ type: 'DELAY' });
  const todayReports = (reports ?? []).filter(
    r => r.train_id === train?.id && r.journey_date === new Date().toISOString().split('T')[0],
  );

  const journeyDate = new Date().toISOString().split('T')[0];
  const { data: liveStops } = useTrainStopProgress(train?.id ?? null, journeyDate);

  const handleShare = useCallback(async () => {
    if (!train) return;
    try {
      await Share.share({ message: t('train.journey'), title: train.name_en });
    } catch {
      // Share dismissed — no-op
    }
  }, [train, t]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing['space-4'], padding: Spacing['space-5'] }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ width: '100%', height: 120, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: Radius['radius-lg'], opacity: 0.6 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={s.root}>
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
  if (!train && !isLoading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: C['text-secondary'], ...Typography.body }}>{t('train.not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Derive values from real data
  const firstStop = train!.stops[0];
  const lastStop = train!.stops[train!.stops.length - 1];
  const depTime = firstStop?.departure_time?.slice(0, 5) ?? '-';
  const arrTime = lastStop?.arrival_time?.slice(0, 5) ?? '-';
  const duration = depTime !== '-' && arrTime !== '-' ? calcDuration(depTime, arrTime) : '-';

  const latestDelay = todayReports.find(r => r.delay_minutes != null);

  const daysOfWeek = train!.days_of_week ?? [];
  const runDays = daysOfWeek.map(d => DAY_NAMES[d]).join(', ') || 'Daily';
  const offDays = DAY_NAMES.filter((_, i) => !daysOfWeek.includes(i)).join(', ') || 'None';

  const confirmedNum = todayReports.reduce((sum, r) => sum + r.verification_count, 0);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <TrainHero height={260} borderRadius={0}>
          <View style={s.headerOverlay}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>

            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
                <ShareNetwork size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/notifications')}>
                <Bell size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.heroContent}>
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeText}>#{train!.number}</Text>
            </View>

            <Text style={s.heroTitle}>{train!.name_en}</Text>
            <Text style={s.heroSubtitle}>{train!.name_bn}</Text>
            <Text style={s.heroRoute}>
              {train!.origin?.name_en}
              {'  →  '}
              {train!.destination?.name_en}
            </Text>
          </View>
        </TrainHero>

        <View style={s.body}>
          {/* Train info card — simplified, duplicated info now lives in the hero */}
          <View style={s.card}>
            <View style={s.liveStatusRow}>
              <View>
                <Text style={s.liveStatusLabel}>Live Status</Text>
                <Text style={s.liveStatusValue}>
                  {latestDelay ? `${latestDelay.delay_minutes} min Delay` : 'Running On Time'}
                </Text>
              </View>

              <View style={[s.statusChip, latestDelay ? s.statusChipDelay : s.statusChipOnTime]}>
                <Text style={s.statusChipText}>{latestDelay ? 'Delayed' : 'On Time'}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.timingRow}>
              <View>
                <Text style={s.timeMain}>{depTime}</Text>
                <Text style={s.timeLabel}>Depart</Text>
                <Text style={s.timeStation}>{train!.origin?.name_en ?? '-'}</Text>
                <Text style={s.timeStationBn}>{train!.origin?.name_bn ?? ''}</Text>
              </View>
              <View style={s.durationCol}>
                <Text style={s.durationText}>{duration}</Text>
                <View style={s.durationLine} />
                <Text style={s.distanceText}>{train!.stops.length} stops</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.timeMain}>{arrTime}</Text>
                <Text style={s.timeLabel}>Arrive</Text>
                <Text style={s.timeStation}>{train!.destination?.name_en ?? '-'}</Text>
                <Text style={s.timeStationBn}>{train!.destination?.name_bn ?? ''}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.metaRow}>
              {([
                ['Runs', runDays.length > 12 ? 'Daily' : runDays],
                ['Classes', String(train!.stops.length > 0 ? 4 : 0)],
                ['Off Day', offDays.length > 10 ? 'None' : offDays],
              ] as [string, string][]).map(([l, v]) => (
                <View key={l} style={s.metaItem}>
                  <Text style={s.metaLabel}>{l}</Text>
                  <Text style={s.metaValue}>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Journey Progress */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.sectionTitle}>Journey Progress</Text>
                {liveStops && liveStops.length > 0 && (
                  <View style={{ backgroundColor: 'rgba(0,168,89,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: '#00A859', fontSize: 10, fontWeight: '700' }}>LIVE TRACKING</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: '/route-map' as any, params: { id: train!.number } })}>
                <Text style={s.linkText}>View full route</Text>
              </TouchableOpacity>
            </View>

            {train!.stops.length === 0 ? (
              <View>
                <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>{t('train.timetable_not_verified_hint')}</Text>
              </View>
            ) : (
              train!.stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast = i === train!.stops.length - 1;
                const stopTime = stop.departure_time?.slice(0, 5) ?? stop.arrival_time?.slice(0, 5) ?? '-';
                const haltText = stop.halt_minutes > 0
                  ? t('train.halt', { minutes: stop.halt_minutes })
                  : undefined;
                const tag = isFirst ? 'Start' : isLast ? 'End' : undefined;
                const active = isFirst || isLast;
                const liveStop = liveStops?.find(ls => ls.station_name_en === stop.station.name_en);
                const hasPassed = liveStop ? liveStop.has_passed : false;

                return (
                  <View key={stop.id}>
                    <View style={s.stopRow}>
                      <View style={[s.stopDot, hasPassed ? s.stopPassed : active ? s.stopCurrent : s.stopUpcoming]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.stopTop}>
                          <Text style={s.stopTime}>{stopTime}</Text>
                          <Text style={s.stopStation}>{stop.station.name_en}</Text>
                          {tag && (
                            <View style={s.stopTag}>
                              <Text style={s.stopTagText}>{tag}</Text>
                            </View>
                          )}
                          {hasPassed && (
                            <View style={s.timelineChipPassed}>
                              <Text style={s.timelineChipPassedText}>Passed</Text>
                            </View>
                          )}
                          {active && (
                            <View style={s.timelineChipCurrent}>
                              <Text style={s.timelineChipCurrentText}>Current</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.stopBottom}>
                          <Text style={s.stopBn}>{stop.station.name_bn}</Text>
                          {haltText && <Text style={s.stopDuration}>{haltText}</Text>}
                        </View>
                      </View>
                      <View style={s.mapIcon} />
                    </View>
                    {i < train!.stops.length - 1 && (
                      <View style={[s.stopLine, hasPassed ? s.stopLinePassed : s.stopLineUpcoming]} />
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Community Report Summary */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Community Report Summary</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/comments-discussion' as any, params: { train_id: train!.id } })}>
                <Text style={s.linkText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={s.communityRow}>
              <View style={s.communityConfirmed}>
                <Text style={s.confirmedNum}>{confirmedNum}</Text>
                <Text style={s.confirmedLabel}>Travelers confirmed</Text>
                <Text style={s.confirmedSub}>today</Text>
              </View>
              {([['Reports', String(todayReports.length), C.accent], ['Punctuality', latestDelay ? 'Delay' : 'On Time', latestDelay ? C.danger : C.primary], ['Today', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), C['text-secondary']]] as [string, string, string][]).map(([label, val, color]) => (
                <View key={label} style={s.communityMetric}>
                  <Text style={s.metricLabel}>{label}</Text>
                  <Text style={[s.metricVal, { color: color }]}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={s.actionBar}>
        <TouchableOpacity style={s.actionSecondary} onPress={() => router.push({ pathname: '/notifications' })}>
          <Text style={s.actionSecondaryText}>Set Alert</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionPrimary} onPress={() => Linking.openURL('https://eticket.railway.gov.bd')}>
          <Text style={s.actionPrimaryText}>Buy Ticket via Rail Sheba</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionSecondary} onPress={handleShare}>
          <Text style={s.actionSecondaryText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  headerOverlay: { position: 'absolute', top: 48, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'] },
  backBtn: { width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing['space-2'] },
  iconBtn: { width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  heroContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 28 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  heroBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 4 },
  heroRoute: { color: '#fff', marginTop: 12, fontSize: 15, fontWeight: '600' },

  body: { padding: Spacing['space-5'], gap: Spacing['space-4'] },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },

  liveStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveStatusLabel: { fontSize: 12, color: C['text-secondary'] },
  liveStatusValue: { fontSize: 18, fontWeight: '700', color: C['text-primary'], marginTop: 4 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  statusChipOnTime: { backgroundColor: 'rgba(34,197,94,0.18)' },
  statusChipDelay: { backgroundColor: 'rgba(239,68,68,0.18)' },
  statusChipText: { fontWeight: '700', color: '#fff' },

  divider: { height: 1, backgroundColor: C.border },
  timingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeMain: { fontSize: 30, fontWeight: '800', color: C['text-primary'] },
  timeLabel: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  timeStation: { ...Typography['body-sm'], fontWeight: '600', color: C.primary, marginTop: 2 },
  timeStationBn: { ...Typography.caption, color: C['text-tertiary'] },
  durationCol: { alignItems: 'center', gap: 4 },
  durationText: { ...Typography['body-sm'], color: C['text-secondary'] },
  durationLine: { width: 110, height: 2, backgroundColor: C.primary, borderRadius: 1 },
  distanceText: { marginTop: 6, ...Typography.caption, color: C['text-tertiary'] },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 9, color: C['text-secondary'] },
  metaValue: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  linkText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },

  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['space-3'], paddingVertical: 14 },
  stopDot: { width: 14, height: 14, borderRadius: 7, marginTop: 6 },
  stopPassed: { backgroundColor: '#22C55E' },
  stopCurrent: { backgroundColor: '#3B82F6', borderWidth: 3, borderColor: '#ffffff' },
  stopUpcoming: { backgroundColor: '#475569' },
  stopTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  stopTime: { ...Typography.body, fontWeight: '800', color: '#ffffff' },
  stopStation: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  stopTag: { backgroundColor: C['primary-subtle'], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  stopTagText: { fontSize: 9, fontWeight: '700', color: C.primary },
  stopBottom: { flexDirection: 'row', gap: Spacing['space-3'], marginTop: 2 },
  stopBn: { ...Typography['body-sm'], color: C['text-secondary'] },
  stopDuration: { ...Typography['body-sm'], color: C['text-tertiary'] },
  stopLine: { width: 3, height: 30, marginLeft: 6, borderRadius: 2 },
  stopLinePassed: { backgroundColor: '#22C55E' },
  stopLineUpcoming: { backgroundColor: C.border },

  timelineChipPassed: { marginLeft: 8, backgroundColor: 'rgba(34,197,94,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  timelineChipPassedText: { color: '#22C55E', fontSize: 10, fontWeight: '700' },
  timelineChipCurrent: { marginLeft: 8, backgroundColor: 'rgba(59,130,246,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  timelineChipCurrentText: { color: '#60A5FA', fontSize: 10, fontWeight: '700' },

  mapIcon: { width: 16, height: 16, backgroundColor: C['info-subtle'], borderRadius: 8 },

  communityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  communityConfirmed: { alignItems: 'center' },
  confirmedNum: { fontSize: 28, fontWeight: '800', color: C['text-primary'] },
  confirmedLabel: { fontSize: 9, color: C['text-secondary'], textAlign: 'center' },
  confirmedSub: { fontSize: 8, color: C['text-tertiary'], textAlign: 'center' },
  communityMetric: { alignItems: 'center', gap: 4 },
  metricLabel: { ...Typography.caption, color: C['text-secondary'] },
  metricVal: { ...Typography['body-sm'], fontWeight: '700' },

  actionBar: { flexDirection: 'row', gap: Spacing['space-2'], padding: Spacing['space-4'], backgroundColor: C['bg-base'], borderTopWidth: 1, borderTopColor: C.border },
  actionSecondary: { flex: 0.4, backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  actionSecondaryText: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  actionPrimary: { flex: 1, backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingVertical: 14, alignItems: 'center' },
  actionPrimaryText: { ...Typography['body-sm'], fontWeight: '700', color: C['bg-base'] },
});
