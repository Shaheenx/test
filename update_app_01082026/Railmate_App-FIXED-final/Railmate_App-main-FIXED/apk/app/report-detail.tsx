// app/report-detail.tsx
import React, { useMemo } from 'react';
import { ArrowLeft, ShareNetwork } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useReportVerifiers, useVoteReport, useReportComments } from '../hooks/useCommunityReports';
import { useAuthStore } from '../stores/authStore';
import { TrainAvatar } from '../components/ui/TrainAvatar/TrainAvatar';
import { Avatar } from '../components/ui/Avatar/Avatar';
import { useTranslation } from '../i18n';
import type { CommunityReport } from '../types/report.types';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

export default function ReportDetailScreen() {
  const colors = useThemeColors();
  const C = colors;
  const rd = useMemo(() => createRd(colors), [colors]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: report, isLoading, error, refetch } = useQuery<CommunityReport | null>({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('community_reports')
        .select(`id, user_id, train_id, station_id, report_type:category, description, delay_minutes, crowd_level, coach_number, condition_rating, photo_url, reported_at:created_at, journey_date, status, verification_count, dispute_count, helpful_count, comment_count, user:users!community_reports_user_id_fkey(id, display_name, avatar_url, is_trusted, trust_score), train:trains!community_reports_train_id_fkey(name_en, name_bn, number), station:stations!community_reports_station_id_fkey(name_en, name_bn)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as CommunityReport;
    },
    enabled: !!id,
  });

  const { data: verifiers } = useReportVerifiers(id ?? '');
  const { data: comments } = useReportComments(id ?? '');
  const voteReport = useVoteReport();

  const handleVote = (voteType: 'CONFIRM' | 'DISPUTE') => {
    if (!id || !user) return;
    voteReport.mutate({
      reportId: id,
      voteType,
      existingVote: report?.current_user_vote ?? null,
      activeFilter: null,
    });
  };

  const handleShare = () => {
    if (!report) return;
    const trainLabel = report.train?.name_en ?? 'Train';
    const stationLabel = report.station?.name_en ?? '';
    Share.share({ message: `${trainLabel}${stationLabel ? ` @ ${stationLabel}` : ''}: #${report.id.slice(0, 8).toUpperCase()}` });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={rd.root}>
        <View style={rd.header}>
          <TouchableOpacity style={rd.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
          <Text style={rd.title}>Report Detail</Text>
          <View style={rd.shareBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={rd.root}>
        <View style={rd.header}>
          <TouchableOpacity style={rd.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
          <Text style={rd.title}>Report Detail</Text>
          <View style={rd.shareBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing['space-3'] }}>
          <Text style={{ color: C['text-secondary'], ...Typography.body }}>{t('common.error')}</Text>
          <TouchableOpacity style={rd.retryBtn} onPress={() => refetch()}>
            <Text style={rd.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={rd.root}>
        <View style={rd.header}>
          <TouchableOpacity style={rd.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
          <Text style={rd.title}>Report Detail</Text>
          <View style={rd.shareBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C['text-secondary'], ...Typography.body }}>Report not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reportedAt = report.reported_at
    ? new Date(report.reported_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  const badgeColor = report.report_type === 'DELAY' ? C.danger
    : report.report_type === 'CROWD' ? C.accent
    : C.info;
  const badgeBg = report.report_type === 'DELAY' ? C['danger-subtle']
    : report.report_type === 'CROWD' ? C['accent-subtle']
    : C['info-subtle'];

  const badgeLabel = report.report_type === 'DELAY' ? 'Delay Report'
    : report.report_type === 'CROWD' ? 'Crowding Report'
    : report.report_type === 'GENERAL' ? 'General Report'
    : report.report_type;

  const top3Verifiers = (verifiers ?? []).slice(0, 3);
  const top3Comments = (comments ?? []).slice(0, 3);

  return (
    <SafeAreaView style={rd.root}>
      <View style={rd.header}>
        <TouchableOpacity style={rd.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <Text style={rd.title}>Report Detail</Text>
        <TouchableOpacity style={rd.shareBtn} onPress={handleShare}>
          <ShareNetwork size={16} color={C['text-secondary']} weight="regular" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rd.scroll}>
        {/* Badge + ref */}
        <View style={rd.topRow}>
          <View style={[rd.delayBadge, { backgroundColor: badgeBg }]}>
            <Text style={[rd.delayBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
          <Text style={rd.refNum}>#{report.id.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Train info */}
        <View style={rd.card}>
          <View style={rd.trainRow}>
            <TrainAvatar size={50} />
            <View style={{ flex: 1 }}>
              <Text style={rd.trainName}>
                {report.train?.name_en ?? 'Unknown Train'}
                {report.train ? ` (${report.train.number})` : ''}
              </Text>
              <Text style={rd.trainRoute}>{report.station?.name_en ?? 'Unknown Station'}</Text>
            </View>
            {report.status === 'VERIFIED' && (
              <View style={rd.verifiedBadge}><Text style={rd.verifiedText}>Verified ✓</Text></View>
            )}
          </View>
          <View style={rd.divider} />
          <View style={rd.metaRow}>
            <View>
              <Text style={rd.metaLabel}>Reported{'\n'}
                <Text style={rd.metaValue}>{reportedAt}</Text>
              </Text>
            </View>
            {report.station && (
              <View>
                <Text style={rd.metaLabel}>At Station{'\n'}
                  <Text style={rd.metaValue}>{report.station.name_en}</Text>
                </Text>
              </View>
            )}
            {report.report_type === 'DELAY' && report.delay_minutes != null && (
              <View>
                <Text style={rd.metaLabel}>Delay{'\n'}
                  <Text style={[rd.metaValue, { color: C.danger }]}>{report.delay_minutes} min</Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delay / Crowd info */}
        {(report.report_type === 'DELAY' || report.report_type === 'CROWD') && (
          <View style={rd.card}>
            <Text style={rd.sectionTitle}>
              {report.report_type === 'DELAY' ? 'Delay Information' : 'Crowding Information'}
            </Text>
            <View style={rd.delayRow}>
              {report.report_type === 'DELAY' && (
                <>
                  <View>
                    <Text style={rd.delayLabel}>Reported Delay</Text>
                    <Text style={[rd.delayNum, { color: C.danger }]}>{report.delay_minutes ?? '?'} min</Text>
                  </View>
                  {report.coach_number && (
                    <View>
                      <Text style={rd.delayLabel}>Coach</Text>
                      <Text style={[rd.delayNum, { color: C.accent }]}>{report.coach_number}</Text>
                    </View>
                  )}
                </>
              )}
              {report.report_type === 'CROWD' && (
                <View>
                  <Text style={rd.delayLabel}>Crowd Level</Text>
                  <Text style={[rd.delayNum, { color: C.accent }]}>{report.crowd_level ?? 'N/A'}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        {report.description ? (
          <View style={rd.card}>
            <Text style={rd.sectionTitle}>Report Description</Text>
            <Text style={rd.description}>{report.description}</Text>
          </View>
        ) : null}

        {/* Verification */}
        <View style={rd.card}>
          <View style={rd.verifyRow}>
            <View>
              <Text style={rd.sectionTitle}>Verification</Text>
              <Text style={rd.verifyCount}>{report.verification_count}</Text>
              <Text style={rd.verifyLabel}>Total Verifications</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: Spacing['space-2'] }}>
              <Text style={rd.verifiedByLabel}>Verified by</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {top3Verifiers.map((v, i) => (
                  <Avatar key={v.user_id + i} uri={v.user?.avatar_url} name={v.user?.display_name ?? undefined} size={28} />
                ))}
                {(verifiers?.length ?? 0) > 3 && (
                  <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>+{(verifiers?.length ?? 0) - 3}</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0, 1, 2, 3, 4].map(i => <View key={i} style={rd.checkCircle} />)}
                <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>
                  {report.dispute_count > 0 ? `${report.dispute_count} disputes` : ''}
                </Text>
              </View>
              <Text style={{ color: C['text-primary'], ...Typography['body-sm'] }}>👍 {report.helpful_count} Helpful Votes</Text>
            </View>
          </View>
        </View>

        {/* Vote buttons */}
        {user && (
          <View style={rd.voteRow}>
            <TouchableOpacity
              style={[rd.voteBtn, { backgroundColor: C['primary-subtle'], borderColor: C.primary }]}
              onPress={() => handleVote('CONFIRM')}
            >
              <Text style={[rd.voteBtnText, { color: C.primary }]}>✓ Confirm ({report.verification_count})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rd.voteBtn, { backgroundColor: C['danger-subtle'], borderColor: C.danger }]}
              onPress={() => handleVote('DISPUTE')}
            >
              <Text style={[rd.voteBtnText, { color: C.danger }]}>✕ Dispute ({report.dispute_count})</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments preview */}
        <View style={rd.card}>
          <View style={rd.cardHeader}>
            <Text style={rd.sectionTitle}>Comments Preview</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/comments-discussion', params: { report_id: id } })}
            >
              <Text style={rd.viewAll}>View All ({report.comment_count})</Text>
            </TouchableOpacity>
          </View>
          {top3Comments.length === 0 ? (
            <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>No comments yet.</Text>
          ) : (
            top3Comments.map((c: any, i: number) => (
              <View key={c.id ?? i}>
                <View style={rd.commentRow}>
                  <Avatar uri={c.user?.avatar_url} name={c.user?.display_name ?? undefined} size={36} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] }}>
                      <Text style={rd.commentUser}>{c.user?.display_name ?? 'Anonymous'}</Text>
                      {c.user?.is_trusted && (
                        <View style={[rd.commentBadge, { backgroundColor: C['primary-subtle'] }]}>
                          <Text style={[rd.commentBadgeText, { color: C.primary }]}>Trusted Reporter</Text>
                        </View>
                      )}
                    </View>
                    <Text style={rd.commentText}>{c.body ?? c.comment ?? ''}</Text>
                    <View style={{ flexDirection: 'row', gap: Spacing['space-3'] }}>
                      <Text style={rd.commentTime}>
                        {c.created_at ? new Date(c.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                {i < top3Comments.length - 1 && <View style={rd.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={rd.footerNote}>
          <Text style={rd.footerText}>ℹ Thank you! Your report helps thousands of travelers.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createRd = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  shareBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  delayBadge: { backgroundColor: C['danger-subtle'], borderRadius: 20, paddingHorizontal: Spacing['space-3'], paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  delayBadgeText: { ...Typography['body-sm'], fontWeight: '700', color: C.danger },
  refNum: { ...Typography['body-sm'], color: C['text-tertiary'] },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  trainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  trainIcon: { width: 50, height: 50, backgroundColor: C['primary-subtle'], borderRadius: 20 },
  trainName: { ...Typography.h3, fontWeight: '700', color: C['text-primary'] },
  trainRoute: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  verifiedBadge: { backgroundColor: C['primary-subtle'], borderRadius: 8, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  verifiedText: { ...Typography.caption, fontWeight: '700', color: C.primary },
  divider: { height: 1, backgroundColor: C.border },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 20 },
  metaValue: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  sectionTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  delayRow: { flexDirection: 'row', gap: Spacing['space-8'] },
  delayLabel: { ...Typography['body-sm'], color: C['text-secondary'] },
  delayNum: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  verifyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  verifyCount: { fontSize: 28, fontWeight: '800', color: C['text-primary'], marginTop: Spacing['space-2'] },
  verifyLabel: { ...Typography['body-sm'], color: C['text-secondary'] },
  verifiedByLabel: { ...Typography['body-sm'], color: C['text-secondary'] },
  verifierAvatar: { width: 28, height: 28, backgroundColor: C['bg-overlay'], borderRadius: 14 },
  checkCircle: { width: 22, height: 22, backgroundColor: C['primary-subtle'], borderRadius: 11, borderWidth: 1, borderColor: C.primary },
  description: { ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  commentRow: { flexDirection: 'row', gap: Spacing['space-3'], paddingVertical: Spacing['space-2'] },
  commentAvatar: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18 },
  commentUser: { ...Typography['body-sm'], fontWeight: '700', color: C['text-primary'] },
  commentBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  commentBadgeText: { ...Typography.caption, fontWeight: '600' },
  commentText: { ...Typography['body-sm'], color: C['text-secondary'], lineHeight: 18 },
  commentTime: { ...Typography.caption, color: C['text-tertiary'] },
  commentLikes: { ...Typography.caption, color: C['text-secondary'] },
  footerNote: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'] },
  footerText: { ...Typography['body-sm'], color: C['text-secondary'] },
  retryBtn: { backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  retryBtnText: { ...Typography.body, fontWeight: '700', color: C['bg-base'] },
  voteRow: { flexDirection: 'row', gap: Spacing['space-3'] },
  voteBtn: { flex: 1, borderRadius: Radius['radius-md'], borderWidth: 1, padding: Spacing['space-3'], alignItems: 'center' },
  voteBtnText: { ...Typography.body, fontWeight: '700' },
});
