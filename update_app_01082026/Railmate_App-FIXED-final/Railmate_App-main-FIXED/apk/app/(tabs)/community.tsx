import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MagnifyingGlass, Plus, Warning, Users, CheckCircle, ArrowUp, ArrowDown,
  ChatCircle, ShareNetwork, Clock, DotsThreeVertical,
} from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useCommunityReports , useVoteReport } from '../../hooks/useCommunityReports';
import { useFollowingIds } from '../../hooks/useUserFollows';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { BadgePreviewModal } from '../../components/features/BadgePreviewModal/BadgePreviewModal';
import { useTranslation } from '../../i18n';
import { timeAgo } from '../../utils/timeAgo';
import type { CommunityReport, VoteType } from '../../types/report.types';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type TabId = 'all' | 'following' | 'my';

export default function CommunityScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { user } = useAuth();
  const { locale, t } = useTranslation();
  const isBengali = locale === 'bn';
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  const { data: followingIds = [] } = useFollowingIds();

  const filter =
    activeTab === 'my' && user?.id ? { userId: user.id }
    : activeTab === 'following' ? { userIds: followingIds }
    : null;
  const { data: reports = [], isLoading, error, refetch } = useCommunityReports(filter);
  const { mutate: vote } = useVoteReport();

  const handleVote = (report: CommunityReport, voteType: VoteType) => {
    if (!user?.id) return;
    vote({
      reportId: report.id,
      voteType,
      existingVote: report.current_user_vote ?? null,
      activeFilter: filter ?? null,
    });
  };

  const getStatusInfo = (report: CommunityReport) => {
    switch (report.report_type) {
      case 'DELAY':
        return { label: `${report.delay_minutes ?? 0} min delay reported`, color: C.danger, bg: 'rgba(232,57,75,0.12)', icon: <Clock size={14} color={C.danger} weight="fill" /> };
      case 'CROWD':
        return { label: 'Crowding High', color: '#F5A623', bg: 'rgba(245,166,35,0.12)', icon: <Users size={14} color="#F5A623" weight="fill" /> };
      case 'GENERAL':
        return { label: 'Running On Time', color: C.primary, bg: 'rgba(0,168,89,0.12)', icon: <CheckCircle size={14} color={C.primary} weight="fill" /> };
      default:
        return { label: report.report_type, color: C['text-secondary'], bg: C['bg-overlay'], icon: null };
    }
  };

  const getTrustBadge = (report: CommunityReport) => {
    const score = report.user?.trust_score ?? 0;
    if (score >= 4.0) return { label: 'Trusted Reporter', color: C.primary, bg: 'rgba(0,168,89,0.15)' };
    if (score >= 2.5) return { label: 'Helpful Traveler', color: '#F5A623', bg: 'rgba(245,166,35,0.15)' };
    return null;
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <Users size={20} color={C.primary} weight="fill" />
          </View>
          <View>
            <Text style={s.headerTitle}>Community</Text>
            <Text style={s.headerSub}>Share updates, help fellow travelers</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <Pressable style={s.headerBtn}>
            <MagnifyingGlass size={18} color={C['text-primary']} />
          </Pressable>
          <Pressable
            style={[s.headerBtn, s.headerBtnPrimary]}
            onPress={() => router.push('/submit-report' as any)}
          >
            <Plus size={18} color={C['text-inverse']} weight="bold" />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {(['all', 'following', 'my'] as TabId[]).map((tab) => (
          <Pressable
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'all' ? 'All' : tab === 'following' ? 'Following' : 'My Posts'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.primary} />
        }
      >
        {error ? (
          <View style={s.emptyWrap}>
            <Warning size={40} color={C['text-tertiary']} />
            <Text style={s.emptyTitle}>Failed to load reports</Text>
            <Text style={s.emptySub}>Please check your connection and try again</Text>
            {/* DIAGNOSTIC: show the real error below the generic message so we
                can actually see what's failing (missing FK relationship, wrong
                column name, RLS denial, etc.) instead of guessing. Safe to
                remove once the root cause is confirmed and fixed server-side. */}
            {__DEV__ && (
              <Text style={[s.emptySub, { color: C.danger, fontSize: 11, marginTop: 4 }]} selectable>
                {(error as Error)?.message ?? String(error)}
              </Text>
            )}
            <Pressable style={s.retryBtn} onPress={() => refetch()}>
              <Text style={s.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : !isLoading && reports.length === 0 ? (
          <View style={s.emptyWrap}>
            <Image source={require('../../assets/images/empty-reports.png')} style={{ width: 200, height: 200, alignSelf: 'center' }} resizeMode="contain" />
            <Text style={s.emptyTitle}>
              {activeTab === 'my' ? 'No reports yet' : activeTab === 'following' ? t('community.tab_following_empty_title') : 'No community reports'}
            </Text>
            <Text style={s.emptySub}>
              {activeTab === 'my'
                ? 'Report train status to help fellow travelers'
                : activeTab === 'following'
                ? t('community.tab_following_empty_sub')
                : 'Be the first to report train status'}
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <ReportFeedCard
              key={report.id}
              report={report}
              isBengali={isBengali}
              onVote={handleVote}
              onPress={() => router.push(`/report-detail?id=${report.id}` as any)}
              onAvatarPress={() => setPreviewUserId(report.user?.id ?? null)}
              statusInfo={getStatusInfo(report)}
              trustBadge={getTrustBadge(report)}
            />
          ))
        )}

        {/* Community CTA */}
        <View style={s.ctaBanner}>
          <Text style={s.ctaIcon}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>Be a Community Hero!</Text>
            <Text style={s.ctaSub}>Your updates help thousands of travelers make better journey decisions.</Text>
          </View>
          <Pressable
            style={s.ctaBtn}
            onPress={() => router.push('/submit-report' as any)}
          >
            <Text style={s.ctaBtnText}>Submit Report</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BadgePreviewModal
        userId={previewUserId}
        visible={!!previewUserId}
        onClose={() => setPreviewUserId(null)}
      />
    </SafeAreaView>
  );
}

interface FeedCardProps {
  report: CommunityReport;
  isBengali: boolean;
  onVote: (report: CommunityReport, type: VoteType) => void;
  onPress: () => void;
  onAvatarPress: () => void;
  statusInfo: { label: string; color: string; bg: string; icon: React.ReactNode };
  trustBadge: { label: string; color: string; bg: string } | null;
}

function ReportFeedCard({ report, isBengali, onVote, onPress, onAvatarPress, statusInfo, trustBadge }: FeedCardProps) {
  const { t } = useTranslation();
  const ago = timeAgo(report.reported_at, isBengali, t as any);
  const trainName = isBengali ? (report.train?.name_bn ?? '') : (report.train?.name_en ?? '');
  const trainDisplay = trainName || 'Unknown Train';
  const trainNum = report.train?.number ?? '';
  const routeFrom = (report as any).route_from ?? '';
  const routeTo = (report as any).route_to ?? '';
  const reporterName = report.user?.display_name ?? 'Traveler';
  const confirmed = report.current_user_vote === 'CONFIRM';
  const disputed = report.current_user_vote === 'DISPUTE';

  return (
    <Pressable style={s.feedCard} onPress={onPress}>
      {/* Top row: avatar, name, badge, time */}
      <View style={s.cardTop}>
        <TouchableOpacity style={s.avatarWrap} onPress={onAvatarPress} disabled={!report.user?.id}>
          <View style={s.avatarBorder}>
            <Avatar uri={report.user?.avatar_url} name={reporterName} size={42} />
          </View>
          {(report.user?.trust_score ?? 0) >= 4.0 && (
            <View style={s.verifiedDot} />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={s.nameRow}>
            <TouchableOpacity onPress={onAvatarPress} disabled={!report.user?.id}>
              <Text style={s.reporterName}>{reporterName}</Text>
            </TouchableOpacity>
            {trustBadge && (
              <View style={[s.trustBadge, { backgroundColor: trustBadge.bg }]}>
                <Text style={[s.trustBadgeText, { color: trustBadge.color }]}>
                  {trustBadge.label}
                </Text>
                <CheckCircle size={10} color={trustBadge.color} weight="fill" />
              </View>
            )}
          </View>
          <Text style={s.trainMeta}>
            {trainNum ? `${trainDisplay} #${trainNum}` : trainDisplay}
            {routeFrom && routeTo ? `  •  ${routeFrom} → ${routeTo}` : ''}
          </Text>
        </View>
        <View style={s.cardTopRight}>
          <View style={s.timeRow}>
            <Clock size={11} color={C.danger} />
            <Text style={s.timeText}>{ago}</Text>
          </View>
          <DotsThreeVertical size={18} color={C['text-tertiary']} />
        </View>
      </View>

      {/* Status badge + description + photo */}
      <View style={s.cardBody}>
        <View style={s.bodyLeft}>
          <View style={[s.statusBadge, { backgroundColor: statusInfo.bg }]}>
            {statusInfo.icon}
            <Text style={[s.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          {report.description ? (
            <Text style={s.description} numberOfLines={3}>{report.description}</Text>
          ) : null}
        </View>
        {report.photo_url ? (
          <Image source={{ uri: report.photo_url }} style={s.photoThumb} />
        ) : null}
      </View>

      {/* Verifier count */}
      <Text style={s.verifierCount}>
        <Users size={12} color={C['text-secondary']} />
        {'  '}{report.verification_count} travelers confirmed
        {'   '}{report.comment_count > 0 ? `${report.comment_count} comments` : ''}
      </Text>

      {/* Vote / Comment / Share row */}
      <View style={s.cardActions}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => onVote(report, 'CONFIRM')}
        >
          <ArrowUp size={16} color={confirmed ? C.primary : C['text-secondary']} weight={confirmed ? 'fill' : 'regular'} />
          <Text style={[s.actionCount, confirmed && { color: C.primary }]}>
            {report.verification_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => onVote(report, 'DISPUTE')}
        >
          <ArrowDown size={16} color={disputed ? C.danger : C['text-secondary']} weight={disputed ? 'fill' : 'regular'} />
        </TouchableOpacity>
        <View style={s.actionDivider} />
        <TouchableOpacity style={s.actionBtn} onPress={onPress}>
          <ChatCircle size={16} color={C['text-secondary']} />
          <Text style={s.actionLabel}>Comment</Text>
        </TouchableOpacity>
        <View style={s.actionDivider} />
        <TouchableOpacity style={s.actionBtn}>
          <ShareNetwork size={16} color={C['text-secondary']} />
          <Text style={s.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: C['bg-base'] },
  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:     { width: 38, height: 38, backgroundColor: 'rgba(0,168,89,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  headerSub:      { fontSize: 11, color: C['text-secondary'] },
  headerActions:  { flexDirection: 'row', gap: 8 },
  headerBtn:      { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerBtnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  // Tabs
  tabBar:         { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 4 },
  tab:            { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: C.primary },
  tabText:        { fontSize: 14, fontWeight: '500', color: C['text-secondary'] },
  tabTextActive:  { color: C.primary, fontWeight: '700' },
  // Scroll
  scroll:         { paddingTop: 8, paddingHorizontal: 12 },
  // Empty states
  emptyWrap:      { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:     { fontSize: 16, fontWeight: '600', color: C['text-primary'] },
  emptySub:       { fontSize: 13, color: C['text-secondary'], textAlign: 'center' },
  retryBtn:       { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:      { fontSize: 13, fontWeight: '700', color: C['text-inverse'] },
  // Feed card
  feedCard:       { backgroundColor: C['bg-card'], borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12, gap: 10 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarWrap:     { position: 'relative' },
  // Avatar component doesn't accept a border prop — wrap it to preserve the
  // existing ring instead of losing it in the dedup.
  avatarBorder:   { borderRadius: 21, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  // NOTE: avatar/avatarFallback/avatarInitial below are now unused after the
  // Avatar component swap — left in place rather than removed in the same
  // patch as the actual bug fix; safe to delete in a follow-up cleanup pass.
  avatar:         { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: C.border },
  avatarFallback: { backgroundColor: C['bg-overlay'], alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  verifiedDot:    { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, backgroundColor: C.primary, borderRadius: 6, borderWidth: 1.5, borderColor: C['bg-card'] },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reporterName:   { fontSize: 14, fontWeight: '700', color: C['text-primary'] },
  trustBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trustBadgeText: { fontSize: 10, fontWeight: '600' },
  trainMeta:      { fontSize: 11, color: C['text-secondary'] },
  cardTopRight:   { alignItems: 'flex-end', gap: 4 },
  timeRow:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText:       { fontSize: 11, color: C.danger },
  // Card body
  cardBody:       { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bodyLeft:       { flex: 1, gap: 6 },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  statusLabel:    { fontSize: 13, fontWeight: '700' },
  description:    { fontSize: 13, color: C['text-primary'], lineHeight: 19 },
  photoThumb:     { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  // Verifier
  verifierCount:  { fontSize: 11, color: C['text-secondary'] },
  // Actions
  cardActions:    { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, gap: 4 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  actionCount:    { fontSize: 13, fontWeight: '700', color: C['text-secondary'] },
  actionLabel:    { fontSize: 13, color: C['text-secondary'] },
  actionDivider:  { flex: 1 },
  // CTA
  ctaBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,168,89,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,168,89,0.2)', padding: 14, gap: 10, marginBottom: 4 },
  ctaIcon:        { fontSize: 32 },
  ctaTitle:       { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 2 },
  ctaSub:         { fontSize: 11, color: C['text-secondary'] },
  ctaBtn:         { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  ctaBtnText:     { fontSize: 12, fontWeight: '700', color: C['text-inverse'] },
});
