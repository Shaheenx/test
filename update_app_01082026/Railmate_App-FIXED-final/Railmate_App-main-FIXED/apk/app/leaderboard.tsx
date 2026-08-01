// app/leaderboard.tsx
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Info, X } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Avatar } from '../components/ui/Avatar/Avatar';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

type Period = 'Weekly' | 'Monthly' | 'All Time';

const getScoreColors = (C: ThemeColors): Record<string, string> => ({
  Excellent: C.primary, 'Very Good': C.info, Good: C.primary, Fair: C.accent,
});

function getScoreLabel(score: number): string {
  if (score >= 900) return 'Excellent';
  if (score >= 750) return 'Very Good';
  if (score >= 600) return 'Good';
  return 'Fair';
}

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const C = colors;
  const SCORE_COLORS = useMemo(() => getScoreColors(colors), [colors]);
  const lb = useMemo(() => createLb(colors), [colors]);
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState<Period>('Weekly');
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const periods: Period[] = ['Weekly', 'Monthly', 'All Time'];

  const { data: leaderboard, isLoading, refetch, error } = useQuery({
    queryKey: ['leaderboard', activePeriod],
    queryFn: async () => {
      const now = new Date();
      let fromDate: string | null = null;
      if (activePeriod === 'Weekly') {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        fromDate = d.toISOString();
      } else if (activePeriod === 'Monthly') {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        fromDate = d.toISOString();
      }

      if (fromDate) {
        const { data, error } = await supabase
          .from('community_reports')
          .select('user_id, user:users!community_reports_user_id_fkey(id, display_name, avatar_url, trust_score, report_count)')
          .gte('created_at', fromDate)
          .limit(100);
        if (error) return [];
        const countMap = new Map<string, { user: any; count: number }>();
        for (const row of (data ?? []) as any[]) {
          if (!row.user_id) continue;
          const existing = countMap.get(row.user_id);
          if (existing) existing.count++;
          else countMap.set(row.user_id, { user: row.user, count: 1 });
        }
        const keys = Array.from(countMap.keys());
        return Array.from(countMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
          .map((entry, i) => ({
            rank: i + 1,
            user_id: keys[i],
            display_name: entry.user?.display_name ?? 'Anonymous',
            avatar_url: entry.user?.avatar_url ?? null,
            trust_score: entry.user?.trust_score ?? 0,
            report_count: entry.count,
          }));
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('id, display_name, trust_score, report_count, avatar_url')
          .order('report_count', { ascending: false })
          .limit(20);
        if (error) return [];
        return (data ?? []).map((u: any, i: number) => ({
          rank: i + 1,
          user_id: u.id,
          display_name: u.display_name ?? 'Anonymous',
          avatar_url: u.avatar_url ?? null,
          trust_score: u.trust_score ?? 0,
          report_count: u.report_count ?? 0,
        }));
      }
    },
    staleTime: 60_000,
  });

  const currentUserRank = leaderboard?.findIndex(e => e.user_id === user?.id);
  const currentUserEntry = currentUserRank !== undefined && currentUserRank >= 0
    ? leaderboard![currentUserRank]
    : null;

  return (
    <SafeAreaView style={lb.root}>
      <View style={lb.header}>
        <TouchableOpacity style={lb.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={lb.title}>👑 {t('leaderboard.title')}</Text>
          <Text style={lb.subtitle}>{t('leaderboard.sub')}</Text>
        </View>
        <TouchableOpacity style={lb.infoBtn} onPress={() => setHowItWorksVisible(true)}>
          <Info size={18} color={C['text-secondary']} weight="regular" />
        </TouchableOpacity>
      </View>

      {/* Period tabs */}
      <View style={lb.periodTabs}>
        {periods.map(p => (
          <TouchableOpacity key={p} style={[lb.periodTab, activePeriod === p && lb.periodTabActive]} onPress={() => setActivePeriod(p)}>
            <Text style={[lb.periodText, activePeriod === p && lb.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My rank */}
      {currentUserEntry ? (
        <View style={lb.myRank}>
          <Text style={lb.myRankNum}>{currentUserEntry.rank}</Text>
          <Avatar uri={currentUserEntry.avatar_url} name={currentUserEntry.display_name} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={lb.myRankName}>{currentUserEntry.display_name}</Text>
            <Text style={lb.myRankLevel}>{getScoreLabel(currentUserEntry.trust_score)} Reporter</Text>
          </View>
          <View style={lb.myRankStats}>
            <View style={{ alignItems: 'center' }}>
              <Text style={lb.myRankLabel}>Trust Score</Text>
              <Text style={lb.myRankScore}>✓ {currentUserEntry.trust_score}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={lb.myRankLabel}>Reports</Text>
              <Text style={lb.myRankPoints}>⭐ {currentUserEntry.report_count}</Text>
            </View>
          </View>
        </View>
      ) : user ? (
        <View style={[lb.myRank, { opacity: 0.6 }]}>
          <Text style={lb.myRankNum}>—</Text>
          <Avatar uri={user.avatar_url} name={user.display_name ?? undefined} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={lb.myRankName}>{user.display_name ?? 'You'}</Text>
            <Text style={lb.myRankLevel}>Not ranked yet</Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={lb.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
            tintColor={C.primary}
          />
        }
      >
        {/* Table header */}
        <View style={lb.tableHeader}>
          <Text style={lb.thNum}>#</Text>
          <Text style={lb.thReporter}>Reporter</Text>
          <Text style={lb.thScore}>Trust Score</Text>
          <Text style={lb.thPoints}>Reports</Text>
        </View>
        <View style={lb.divider} />

        {isLoading ? (
          <View style={{ paddingVertical: Spacing['space-5'], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: Spacing['space-5'], alignItems: 'center' }}>
            <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>Failed to load leaderboard.</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: Spacing['space-3'] }}>
              <Text style={{ color: C.primary, ...Typography['body-sm'], fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !leaderboard?.length ? (
          <View style={{ paddingVertical: Spacing['space-5'], alignItems: 'center' }}>
            <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>{t('leaderboard.no_data')}</Text>
          </View>
        ) : (
          /* Rows */
          <View style={lb.tableCard}>
            {leaderboard.map((entry, i) => {
              const rankColor = entry.rank === 1 ? C.accent : entry.rank === 2 ? C['text-secondary'] : entry.rank === 3 ? C.accent : undefined;
              const isMe = entry.user_id === user?.id;
              const scoreLabel = getScoreLabel(entry.trust_score);
              return (
                <View key={entry.user_id + entry.rank}>
                  <View style={[lb.userRow, isMe && lb.userRowMe]}>
                    <View style={[lb.rankCircle, rankColor ? { backgroundColor: rankColor } : {}]}>
                      <Text style={[lb.rankNum, rankColor ? { color: C['bg-base'] } : {}]}>{entry.rank}</Text>
                    </View>
                    <Avatar uri={entry.avatar_url} name={entry.display_name} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={[lb.userName, isMe && { color: C.primary }]}>{entry.display_name}</Text>
                      <Text style={lb.userLevel}>{scoreLabel} Reporter</Text>
                    </View>
                    <View style={{ alignItems: 'center', width: 70 }}>
                      <Text style={lb.scoreNum}>{entry.trust_score}</Text>
                      <Text style={[lb.scoreLabel, { color: SCORE_COLORS[scoreLabel] ?? C['text-secondary'] }]}>{scoreLabel}</Text>
                    </View>
                    <View style={lb.pointsCol}>
                      <Text style={lb.pointsStar}>⭐</Text>
                      <Text style={lb.pointsVal}>{entry.report_count}</Text>
                    </View>
                  </View>
                  {i < leaderboard.length - 1 && <View style={lb.rowDivider} />}
                </View>
              );
            })}
          </View>
        )}

        <View style={lb.footer}>
          <Text style={lb.footerTime}>
            Last updated: {new Date().toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={lb.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={howItWorksVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHowItWorksVisible(false)}
      >
        <View style={lb.modalBackdrop}>
          <View style={lb.modalSheet}>
            <View style={lb.modalHeader}>
              <Text style={lb.modalTitle}>How the Leaderboard Works</Text>
              <TouchableOpacity style={lb.infoBtn} onPress={() => setHowItWorksVisible(false)}>
                <X size={18} color={C['text-secondary']} weight="regular" />
              </TouchableOpacity>
            </View>
            <Text style={lb.modalBody}>
              Rankings are based on your Trust Score, which rises with verified reports and falls
              with disputed ones. Weekly and Monthly tabs count reports submitted in that window;
              All Time ranks everyone by total reports submitted.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createLb = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-3'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  infoBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C['bg-card'], borderTopLeftRadius: Radius['radius-lg'], borderTopRightRadius: Radius['radius-lg'], padding: Spacing['space-5'], gap: Spacing['space-3'], borderWidth: 1, borderColor: C.border, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  modalBody: { ...Typography['body-sm'], color: C['text-secondary'] },
  periodTabs: { flexDirection: 'row', marginHorizontal: Spacing['space-5'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border },
  periodTab: { flex: 1, paddingVertical: Spacing['space-3'], alignItems: 'center', borderRadius: Radius['radius-md'] },
  periodTabActive: { backgroundColor: C.primary },
  periodText: { ...Typography.body, fontWeight: '500', color: C['text-secondary'] },
  periodTextActive: { fontWeight: '700', color: C['bg-base'] },
  myRank: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'], marginHorizontal: Spacing['space-5'], marginTop: Spacing['space-3'], backgroundColor: C['primary-subtle'], borderRadius: 14, borderWidth: 1, borderColor: C['primary-dim'], padding: Spacing['space-3'] },
  myRankNum: { fontSize: 20, fontWeight: '800', color: C.primary, width: 36, textAlign: 'center' },
  myRankAvatar: { width: 44, height: 44, backgroundColor: C['bg-overlay'], borderRadius: 22 },
  myRankName: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  myRankLevel: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  myRankStats: { flexDirection: 'row', gap: Spacing['space-4'] },
  myRankLabel: { fontSize: 9, color: C['text-secondary'] },
  myRankScore: { ...Typography.body, fontWeight: '700', color: C.primary, marginTop: 2 },
  myRankPoints: { ...Typography.body, fontWeight: '700', color: C.accent, marginTop: 2 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['space-3'] },
  thNum: { width: 40, ...Typography['body-sm'], fontWeight: '700', color: C['text-tertiary'] },
  thReporter: { flex: 1, ...Typography['body-sm'], fontWeight: '700', color: C['text-tertiary'] },
  thScore: { width: 70, ...Typography['body-sm'], fontWeight: '700', color: C['text-tertiary'], textAlign: 'center' },
  thPoints: { width: 60, ...Typography['body-sm'], fontWeight: '700', color: C['text-tertiary'], textAlign: 'right' },
  divider: { height: 1, backgroundColor: C.border },
  tableCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], padding: Spacing['space-3'] },
  userRowMe: { backgroundColor: C['primary-subtle'] },
  rankCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C['bg-overlay'], alignItems: 'center', justifyContent: 'center' },
  rankNum: { ...Typography['body-sm'], fontWeight: '700', color: C['text-secondary'] },
  userAvatar: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18 },
  userName: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  userLevel: { ...Typography.caption, color: C['text-secondary'], marginTop: 1 },
  scoreNum: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  scoreLabel: { ...Typography.caption, fontWeight: '600', marginTop: 2 },
  pointsCol: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60, justifyContent: 'flex-end' },
  pointsStar: { ...Typography['body-sm'] },
  pointsVal: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  rowDivider: { height: 1, backgroundColor: C.border, marginHorizontal: Spacing['space-3'] },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTime: { ...Typography.caption, color: C['text-tertiary'] },
  refreshText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
});
