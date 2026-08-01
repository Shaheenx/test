import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Broadcast, Bell, Funnel,
} from 'phosphor-react-native';
import { useCommunityReports } from '../../hooks/useCommunityReports';
import { useRealtimeReports } from '../../hooks/useRealtimeReports';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { LiveUpdateCard } from '../../components/features/LiveUpdateCard';
import { LiveTrackingSection } from '../../components/features/LiveTrackingSection';
import { useTranslation } from '../../i18n';
import type { ReportFilter } from '../../types/report.types';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type FilterKey = 'all' | 'delays' | 'crowding' | 'platform' | 'condition';
type ActiveTab = 'reports' | 'tracking';

function filterFromKey(key: FilterKey): ReportFilter {
  switch (key) {
    case 'delays':    return { type: 'DELAY' as const };
    case 'crowding':  return { type: 'CROWD' as const };
    case 'platform':  return { type: 'PLATFORM' as const };
    case 'condition': return { type: 'PLATFORM' as const }; // closest match
    default:          return null;
  }
}

export default function LiveUpdatesScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
  const [activeFilterKey, setActiveFilterKey] = useState<FilterKey>('all');

  useRealtimeReports();

  const queryFilter = filterFromKey(activeFilterKey);
  const { data: updates = [], isLoading, error, refetch } = useCommunityReports(queryFilter);

  const todayDate = new Date().toISOString().split('T')[0];

  const delayCount = updates.filter(u => u.report_type === 'DELAY').length;
  const crowdCount = updates.filter(u => u.report_type === 'CROWD').length;
  const onTimeCount = updates.filter(u => u.report_type === 'GENERAL').length;

  const lastUpdated = updates.length > 0
    ? new Date(updates[0].reported_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  const handleRefresh = () => refetch();

  const getStatusStyle = (reportType: string) => {
    if (reportType === 'DELAY') return { color: C.danger, badgeBg: 'rgba(232,57,75,0.15)', label: 'min delay' };
    if (reportType === 'CROWD') return { color: '#F5A623', badgeBg: 'rgba(245,166,35,0.15)', label: 'Crowding High' };
    return { color: C.primary, badgeBg: 'rgba(0,168,89,0.15)', label: 'Running On Time' };
  };

  const filterChips: { key: FilterKey; labelKey: string }[] = [
    { key: 'all',       labelKey: 'updates.filter_all' },
    { key: 'delays',    labelKey: 'updates.filter_delays' },
    { key: 'crowding',  labelKey: 'updates.filter_crowding' },
    { key: 'platform',  labelKey: 'updates.filter_platform' },
    { key: 'condition', labelKey: 'updates.filter_condition' },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <Broadcast size={20} color={C.primary} weight="fill" />
          </View>
          <View>
            <Text style={s.headerTitle}>Live Updates</Text>
            <Text style={s.headerSub}>Real-time train status &amp; alerts</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <Pressable style={s.headerBtn}>
            <Bell size={18} color={C['text-primary']} />
            <View style={s.headerBadge}><Text style={s.headerBadgeText}>6</Text></View>
          </Pressable>
          <Pressable style={s.headerBtn}>
            <Funnel size={18} color={C['text-primary']} />
          </Pressable>
        </View>
      </View>

      {/* Segmented control */}
      <View style={s.segmentedBar}>
        <Pressable
          style={[s.segmentTab, activeTab === 'reports' && s.segmentTabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[s.segmentText, activeTab === 'reports' && s.segmentTextActive]}>
            {t('updates.tab_reports')}
          </Text>
        </Pressable>
        <Pressable
          style={[s.segmentTab, activeTab === 'tracking' && s.segmentTabActive]}
          onPress={() => setActiveTab('tracking')}
        >
          <Text style={[s.segmentText, activeTab === 'tracking' && s.segmentTextActive]}>
            {t('updates.tab_tracking')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'reports' ? (
        <>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBarWrap} contentContainerStyle={s.filterBar}>
            {filterChips.map((chip) => (
              <Pressable
                key={chip.key}
                style={[s.filterTab, activeFilterKey === chip.key && s.filterTabActive]}
                onPress={() => setActiveFilterKey(chip.key)}
              >
                <Text style={[s.filterTabText, activeFilterKey === chip.key && s.filterTabTextActive]}>
                  {t(chip.labelKey as any)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Stats strip */}
          <View style={s.statsStrip}>
            <View style={s.statChip}>
              <View style={[s.statDot, { backgroundColor: C.danger }]} />
              <Text style={s.statNum}>{delayCount}</Text>
              <Text style={s.statLabel}>Delay Reports{'\n'}Active Now</Text>
            </View>
            <View style={s.statChip}>
              <View style={[s.statDot, { backgroundColor: '#F5A623' }]} />
              <Text style={s.statNum}>{crowdCount}</Text>
              <Text style={s.statLabel}>Crowding Alerts{'\n'}Active Now</Text>
            </View>
            <View style={s.statChip}>
              <View style={[s.statDot, { backgroundColor: C.primary }]} />
              <Text style={s.statNum}>{onTimeCount}</Text>
              <Text style={s.statLabel}>Trains On Time{'\n'}Running Smooth</Text>
            </View>
            <View style={s.statChip}>
              <View style={[s.statDot, { backgroundColor: '#4EA8E0' }]} />
              <Text style={s.statNum}>0</Text>
              <Text style={s.statLabel}>Service Alerts{'\n'}Announcements</Text>
            </View>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={C.primary} />
            }
          >
            {/* Section title + timestamp */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Live Train Updates</Text>
              {lastUpdated && (
                <Pressable style={s.refreshRow} onPress={handleRefresh}>
                  <Text style={s.lastUpdated}>Last updated: {lastUpdated}</Text>
                  <Text style={s.refreshIcon}>↻</Text>
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <>
                <Skeleton width="100%" height={100} style={{ borderRadius: 12, marginBottom: 10 }} />
                <Skeleton width="100%" height={100} style={{ borderRadius: 12, marginBottom: 10 }} />
                <Skeleton width="100%" height={100} style={{ borderRadius: 12, marginBottom: 10 }} />
              </>
            ) : error ? (
              <EmptyState
                iconName="Warning"
                title="Failed to load updates"
                description="Please check your connection and try again"
                ctaLabel="Retry"
                onCta={handleRefresh}
              />
            ) : updates.length === 0 ? (
              <EmptyState
                iconName="BellSimple"
                title="No live updates"
                description="Check back soon for real-time train updates"
              />
            ) : (
              updates.map((update) => {
                const st = getStatusStyle(update.report_type);
                return (
                  <LiveUpdateCard
                    key={update.id}
                    update={{
                      train_name: update.train?.name_en ?? 'Unknown Train',
                      train_number: update.train?.number ?? 'N/A',
                      route_from: update.train?.origin?.name_en ?? '—',
                      route_to: update.train?.destination?.name_en ?? '—',
                      status_type: update.report_type === 'DELAY' ? 'delay'
                        : update.report_type === 'CROWD' ? 'crowding'
                        : update.report_type === 'PLATFORM' ? 'platform' : 'onTime',
                      status_label: update.report_type === 'DELAY'
                        ? `${update.delay_minutes || 0} min delay`
                        : st.label,
                      description: update.description || undefined,
                      delay_minutes: update.delay_minutes || undefined,
                      reported_at: new Date(update.reported_at).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      }),
                      reporter_count: update.verification_count ?? 0,
                    }}
                    onPress={() => {
                      if (update.train?.number) {
                        router.push(`/train/${update.train.number}` as any);
                      }
                    }}
                  />
                );
              })
            )}

            {/* Stay Informed banner */}
            <View style={s.alertBanner}>
              <Bell size={28} color={C.primary} weight="fill" />
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>Stay Informed, Travel Smart</Text>
                <Text style={s.alertSub}>Enable live alerts for your favorite routes</Text>
              </View>
              <Pressable style={s.alertBtn} onPress={() => router.push('/notifications' as any)}>
                <Text style={s.alertBtnText}>Manage Alerts →</Text>
              </Pressable>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.trackingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LiveTrackingSection
            journeyDate={todayDate}
            onTrainPress={(id) => router.push(`/train-detail?id=${id}` as any)}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:             { flex: 1, backgroundColor: C['bg-base'] },
  // Header
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:       { width: 38, height: 38, backgroundColor: 'rgba(0,168,89,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  headerSub:        { fontSize: 11, color: C['text-secondary'] },
  headerActions:    { flexDirection: 'row', gap: 8 },
  headerBtn:        { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerBadge:      { position: 'absolute', top: -4, right: -4, width: 16, height: 16, backgroundColor: C.danger, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerBadgeText:  { fontSize: 9, fontWeight: '700', color: '#FFF' },
  // Segmented control
  segmentedBar:     { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  segmentTab:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segmentTabActive: { borderBottomColor: C.primary },
  segmentText:      { fontSize: 14, fontWeight: '500', color: C['text-secondary'] },
  segmentTextActive:{ color: C['text-primary'], fontWeight: '700' },
  // Filter tabs
  filterBarWrap:    { flexGrow: 0, flexShrink: 0 },
  filterBar:        { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  filterTab:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C['bg-card'], borderRadius: 20, borderWidth: 1, borderColor: C.border, height: 36 },
  filterTabActive:  { backgroundColor: C.primary, borderColor: C.primary },
  filterTabText:    { fontSize: 13, fontWeight: '500', color: C['text-secondary'] },
  filterTabTextActive: { color: C['text-inverse'], fontWeight: '700' },
  // Stats strip
  statsStrip:       { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  statChip:         { flex: 1, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 8, alignItems: 'center', gap: 2 },
  statDot:          { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  statNum:          { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  statLabel:        { fontSize: 9, color: C['text-secondary'], textAlign: 'center' },
  // Scroll
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: 12 },
  trackingScrollContent: { paddingTop: 12 },
  // Section header
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: C['text-primary'] },
  refreshRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastUpdated:      { fontSize: 11, color: C['text-tertiary'] },
  refreshIcon:      { fontSize: 14, color: C.primary },
  // Alert banner
  alertBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,168,89,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,168,89,0.2)', padding: 14, gap: 10, marginTop: 12 },
  alertTitle:       { fontSize: 13, fontWeight: '700', color: C['text-primary'], marginBottom: 2 },
  alertSub:         { fontSize: 11, color: C['text-secondary'] },
  alertBtn:         { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  alertBtnText:     { fontSize: 12, fontWeight: '700', color: C['text-inverse'] },
});
