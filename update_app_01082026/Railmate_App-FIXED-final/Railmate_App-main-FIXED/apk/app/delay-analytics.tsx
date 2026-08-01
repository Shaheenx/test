// app/delay-analytics.tsx
import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

type Period = '7D' | '30D' | '90D';

const getDistribution = (C: ThemeColors) => [
  { label: 'On Time (≤5 min)', pct: '42%', color: C.primary },
  { label: '5 - 15 min', pct: '28%', color: C.accent },
  { label: '15 - 30 min', pct: '18%', color: C.accent },
  { label: '30 - 60 min', pct: '8%', color: C.danger },
  { label: '> 60 min', pct: '4%', color: C.info },
];

export default function DelayAnalyticsScreen() {
  const colors = useThemeColors();
  const C = colors;
  const DISTRIBUTION = useMemo(() => getDistribution(colors), [colors]);
  const da = useMemo(() => createDa(colors), [colors]);
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState<Period>('7D');
  const { id } = useLocalSearchParams<{ id: string }>();
  const periods: Period[] = ['7D', '30D', '90D'];

  const { data: delayReports, isLoading, refetch } = useQuery({
    queryKey: ['delay_analytics', id, activePeriod],
    queryFn: async () => {
      if (!id) return [];
      const days = activePeriod === '7D' ? 7 : activePeriod === '30D' ? 30 : 90;
      const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - days);

      // First find train by number
      const { data: trainData } = await supabase.from('trains').select('id').eq('number', id).maybeSingle();
      if (!trainData?.id) return [];

      const { data, error } = await supabase
        .from('community_reports')
        .select('id, delay_minutes, reported_at, journey_date, verification_count')
        .eq('train_id', trainData.id)
        .eq('report_type', 'DELAY')
        .not('delay_minutes', 'is', null)
        .gte('created_at', fromDate.toISOString())
        .order('reported_at', { ascending: true });

      if (error) return [];
      return (data ?? []) as { id: string; delay_minutes: number; reported_at: string; journey_date: string; verification_count: number }[];
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const avgDelay = delayReports?.length
    ? Math.round(delayReports.reduce((sum, r) => sum + (r.delay_minutes ?? 0), 0) / delayReports.length)
    : 0;

  // For bar chart: group by day
  const barData = (() => {
    if (!delayReports?.length) return [];
    const days = activePeriod === '7D' ? 7 : activePeriod === '30D' ? 30 : 90;
    const grouped: Record<string, number[]> = {};
    delayReports.forEach(r => {
      const day = r.journey_date ?? r.reported_at?.slice(0, 10) ?? '';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(r.delay_minutes ?? 0);
    });
    return Object.entries(grouped).slice(-Math.min(days, 14)).map(([day, vals]) => ({
      day: day.slice(5), // MM-DD
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  })();
  const maxBar = Math.max(...barData.map(b => b.avg), 1);

  return (
    <SafeAreaView style={da.root}>
      <View style={da.header}>
        <TouchableOpacity style={da.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View style={da.headerCenter}>
          <View style={da.headerIcon} />
          <View>
            <Text style={da.title}>Delay Analytics</Text>
            {id ? <Text style={da.subtitle}>Train #{id}</Text> : null}
          </View>
        </View>
        <View style={da.headerRight}>
          <TouchableOpacity style={da.iconBtn} />
          <TouchableOpacity style={da.iconBtn} />
        </View>
      </View>

      {/* Period tabs */}
      <View style={da.periodRow}>
        {periods.map(p => (
          <TouchableOpacity key={p} style={[da.periodTab, activePeriod === p && da.periodTabActive]} onPress={() => setActivePeriod(p)}>
            <Text style={[da.periodText, activePeriod === p && da.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={da.scroll}>
        {/* Stats row */}
        <View style={da.statsRow}>
          {[
            { label: 'Total Reports', val: String(delayReports?.length ?? 0), sub: `Last ${activePeriod}`, color: C.primary, bg: C['primary-subtle'] },
            { label: 'Average Delay', val: `${avgDelay} min`, sub: 'Avg across period', color: C.info, bg: C['info-subtle'] },
            { label: 'Reliability Score', val: avgDelay <= 10 ? 'Good' : avgDelay <= 20 ? 'Fair' : 'Poor', sub: 'Based on delays', color: C.info, bg: C['info-subtle'] },
          ].map(stat => (
            <View key={stat.label} style={[da.statCard, { backgroundColor: stat.bg, borderColor: stat.color }]}>
              <Text style={da.statLabel}>{stat.label}</Text>
              <Text style={[da.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={da.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View style={da.card}>
          <View style={da.chartHeader}>
            <Text style={da.sectionTitle}>Average Delay Trend</Text>
            <TouchableOpacity style={da.minutesBtn}><Text style={da.minutesBtnText}>Minutes ▾</Text></TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : barData.length === 0 ? (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>No delay data for this period.</Text>
            </View>
          ) : (
            <>
              {/* Simple bar chart */}
              <View style={da.chart}>
                {barData.map(d => (
                  <View key={d.day} style={da.barCol}>
                    <Text style={da.barVal}>{d.avg}</Text>
                    <View style={[da.bar, { height: Math.max((d.avg / maxBar) * 120, 4), backgroundColor: C.info }]} />
                    <Text style={da.barDay}>{d.day}</Text>
                  </View>
                ))}
              </View>
              <View style={da.legend}>
                <View style={da.legendItem}><View style={[da.legendLine, { backgroundColor: C.info }]} /><Text style={da.legendText}>Average Delay (min)</Text></View>
                <View style={da.legendItem}><View style={[da.legendDash]} /><Text style={da.legendText}>Target (15 min)</Text></View>
              </View>
            </>
          )}
        </View>

        {/* Distribution + Insights */}
        <View style={da.rowCards}>
          <View style={[da.card, { flex: 1 }]}>
            <Text style={da.sectionTitle}>Delay Distribution</Text>
            <View style={da.donutPlaceholder}>
              <Text style={da.donutTotal}>{delayReports?.length ?? 0}</Text>
              <Text style={da.donutSub}>Reports</Text>
            </View>
            {DISTRIBUTION.map(d => (
              <View key={d.label} style={da.distRow}>
                <View style={[da.distDot, { backgroundColor: d.color }]} />
                <Text style={da.distLabel}>{d.label}</Text>
                <Text style={[da.distPct, { color: d.color }]}>{d.pct}</Text>
              </View>
            ))}
          </View>
          <View style={[da.card, { flex: 1 }]}>
            <Text style={da.sectionTitle}>Delay Insights</Text>
            {[
              { label: 'Total delays', val: String(delayReports?.length ?? 0), sub: `In last ${activePeriod}`, color: C.accent },
              { label: 'Average delay', val: `${avgDelay} min`, sub: 'Across period', color: C.danger },
              { label: 'Max delay', val: delayReports?.length ? `${Math.max(...delayReports.map(r => r.delay_minutes ?? 0))} min` : 'N/A', sub: 'Single report', color: C.info },
            ].map(ins => (
              <View key={ins.label} style={da.insightItem}>
                <Text style={da.insightLabel}>{ins.label}</Text>
                <Text style={[da.insightVal, { color: ins.color }]}>{ins.val}</Text>
                <Text style={da.insightSub}>{ins.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly overview using real barData */}
        {barData.length > 0 && (
          <View style={da.card}>
            <View style={da.sectionHeader}>
              <Text style={da.sectionTitle}>Period Performance Overview</Text>
              <TouchableOpacity onPress={() => refetch()}><Text style={da.viewAll}>Refresh  ›</Text></TouchableOpacity>
            </View>
            <View style={da.weekRow}>
              {barData.slice(-7).map(d => {
                const color = d.avg <= 10 ? C.primary : d.avg <= 20 ? C.accent : C.danger;
                const label = d.avg <= 10 ? 'Good' : d.avg <= 20 ? 'Average' : 'Poor';
                return (
                  <View key={d.day} style={da.weekItem}>
                    <Text style={da.weekDay}>{d.day}</Text>
                    <Text style={da.weekVal}>{d.avg} min</Text>
                    <View style={[da.weekBar, { backgroundColor: color }]} />
                    <View style={[da.weekIcon, { backgroundColor: color + '30' }]} />
                    <Text style={[da.weekLabel, { color }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Comparison banner */}
        <View style={[da.banner, { backgroundColor: C['info-subtle'], borderColor: C.info }]}>
          <View style={da.bannerIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[da.bannerTitle, { color: C.info }]}>
              {avgDelay > 0 ? `Average delay: ${avgDelay} min over ${activePeriod}` : 'No delay data available'}
            </Text>
            <Text style={da.bannerSub}>Based on community reports</Text>
          </View>
          <TouchableOpacity onPress={() => refetch()}><Text style={[da.bannerLink, { color: C.info }]}>Refresh  ›</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createDa = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  headerIcon: { width: 36, height: 36, backgroundColor: C['primary-subtle'], borderRadius: 10 },
  title: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'] },
  route: { ...Typography.caption, color: C['text-tertiary'] },
  headerRight: { flexDirection: 'row', gap: Spacing['space-2'] },
  iconBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16 },
  periodRow: { flexDirection: 'row', marginHorizontal: Spacing['space-5'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border },
  periodTab: { flex: 1, paddingVertical: Spacing['space-3'], alignItems: 'center', borderRadius: Radius['radius-md'] },
  periodTabActive: { backgroundColor: C.primary },
  periodText: { ...Typography['body-sm'], color: C['text-secondary'] },
  periodTextActive: { fontWeight: '700', color: C['bg-base'] },
  statsRow: { flexDirection: 'row', gap: Spacing['space-2'] },
  statCard: { flex: 1, borderRadius: Radius['radius-md'], borderWidth: 1, padding: Spacing['space-3'], gap: 4 },
  statLabel: { ...Typography.caption, color: C['text-secondary'] },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statSub: { ...Typography.caption, color: C['text-secondary'] },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-2'] },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  minutesBtn: { backgroundColor: C['bg-overlay'], borderRadius: 8, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  minutesBtnText: { ...Typography['body-sm'], color: C['text-secondary'] },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: Spacing['space-4'] },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barVal: { ...Typography.caption, color: C['text-primary'] },
  bar: { width: 20, borderRadius: 4, minHeight: 4 },
  barDay: { ...Typography.caption, color: C['text-secondary'] },
  legend: { flexDirection: 'row', gap: Spacing['space-5'] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  legendLine: { width: 20, height: 3, borderRadius: 2 },
  legendDash: { width: 20, height: 3, borderRadius: 2, backgroundColor: C['text-tertiary'], borderStyle: 'dashed' },
  legendText: { ...Typography.caption, color: C['text-secondary'] },
  rowCards: { flexDirection: 'row', gap: Spacing['space-3'] },
  donutPlaceholder: { width: 80, height: 80, backgroundColor: C['bg-overlay'], borderRadius: 40, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  donutTotal: { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  donutSub: { ...Typography.caption, color: C['text-secondary'] },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  distDot: { width: 10, height: 10, borderRadius: 5 },
  distLabel: { flex: 1, ...Typography.caption, color: C['text-secondary'] },
  distPct: { ...Typography.caption, fontWeight: '700' },
  insightItem: { gap: 2 },
  insightLabel: { ...Typography.caption, color: C['text-secondary'] },
  insightVal: { ...Typography['body-sm'], fontWeight: '700' },
  insightSub: { ...Typography.caption, color: C['text-tertiary'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekItem: { alignItems: 'center', gap: 4, flex: 1 },
  weekDay: { ...Typography.caption, color: C['text-secondary'] },
  weekVal: { ...Typography.caption, fontWeight: '600', color: C['text-primary'] },
  weekBar: { width: '80%', height: 4, borderRadius: 2 },
  weekIcon: { width: 24, height: 24, borderRadius: 12 },
  weekLabel: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  banner: { borderRadius: Radius['radius-lg'], borderWidth: 1, padding: Spacing['space-4'], flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  bannerIcon: { width: 36, height: 36, backgroundColor: C['info-subtle'], borderRadius: 18 },
  bannerTitle: { ...Typography['body-sm'], fontWeight: '700' },
  bannerSub: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  bannerLink: { ...Typography['body-sm'], fontWeight: '600' },
});
