// app/comments-discussion.tsx
import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, PaperPlaneTilt, Camera, Smiley, DotsThreeVertical, ThumbsUp, Heart } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useReportComments, useAddComment } from '../hooks/useCommunityReports';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/ui/Avatar/Avatar';
import type { ReportComment } from '../hooks/useCommunityReports';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function CommentItem({ comment }: { comment: ReportComment }) {
  // trust_score > 0 means the user has earned community trust.
  // NOTE: the users table exposes trust_score (0.00-5.00), not a boolean
  // is_trusted flag — do not reintroduce comment.user?.is_trusted here,
  // that field does not exist on ReportComment and will always be undefined.
  const isTrusted = (comment.user?.trust_score ?? 0) > 0;
  const bgColor = isTrusted ? C['primary-subtle'] : C['info-subtle'];
  const textColor = isTrusted ? C.primary : C.info;

  const handleCommentMenu = () => {
    Alert.alert(
      comment.user?.display_name ?? 'Comment options',
      undefined,
      [
        { text: 'Report Comment', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thanks — our team will review this comment.') },
        { text: `Mute ${comment.user?.display_name ?? 'user'}`, onPress: () => Alert.alert('Muted', 'You won\u2019t see comments from this user anymore.') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={cd.commentCard}>
      <View style={cd.commentTop}>
        <Avatar uri={comment.user?.avatar_url} name={comment.user?.display_name ?? undefined} size={38} />
        <View style={{ flex: 1 }}>
          <View style={cd.nameRow}>
            <Text style={cd.userName}>{comment.user?.display_name ?? 'Anonymous'}</Text>
            {isTrusted && (
              <View style={[cd.badge, { backgroundColor: bgColor }]}>
                <Text style={[cd.badgeText, { color: textColor }]}>Trusted Reporter</Text>
              </View>
            )}
            {isTrusted && <View style={cd.verifiedDot} />}
          </View>
          <Text style={cd.time}>{timeAgo(comment.created_at)}</Text>
        </View>
        <TouchableOpacity style={cd.moreBtn} onPress={handleCommentMenu}>
          <DotsThreeVertical size={16} color={C['text-secondary']} weight="bold" />
        </TouchableOpacity>
      </View>
      <Text style={cd.commentText}>{comment.body}</Text>
      <View style={cd.commentActions}>
        <TouchableOpacity style={cd.actionRow}>
          <ThumbsUp size={16} color={C.primary} weight="regular" />
          <Text style={cd.likeCount}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cd.actionRow}>
          <Heart size={16} color={C.danger} weight="regular" />
          <Text style={cd.heartCount}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity><Text style={cd.replyBtn}>Reply</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommentsDiscussionScreen() {
  const colors = useThemeColors();
  const C = colors;
  const cd = useMemo(() => createCd(colors), [colors]);
  const router = useRouter();
  const { report_id } = useLocalSearchParams<{ report_id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: comments, isLoading } = useReportComments(report_id ?? '');
  const addComment = useAddComment(report_id ?? '', null);

  const handleThreadMenu = () => {
    Alert.alert(
      'Discussion Options',
      undefined,
      [
        { text: 'Report Discussion', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thanks — our team will review this discussion.') },
        { text: 'Mute Notifications', onPress: () => Alert.alert('Muted', 'You won\u2019t get notified about new comments here.') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleSend = async () => {
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      router.push('/auth/login' as any);
      return;
    }
    try {
      await addComment.mutateAsync(commentText.trim());
      setCommentText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      // Never swallow this silently — a silent failure here is indistinguishable
      // from "commenting is broken" with zero diagnostic signal for the user
      // or for us. Surface the real Postgres/Supabase error message.
      Alert.alert(
        'Something went wrong',
        err instanceof Error ? err.message : 'Could not post your comment. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={cd.root}>
      <View style={cd.header}>
        <TouchableOpacity style={cd.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={cd.title}>Comments & Discussion</Text>
          <Text style={cd.subtitle}>Discussion</Text>
        </View>
        <TouchableOpacity style={cd.moreHeaderBtn} onPress={handleThreadMenu}>
          <DotsThreeVertical size={18} color={C['text-secondary']} weight="bold" />
        </TouchableOpacity>
      </View>

      {/* Report ref */}
      <View style={cd.reportRef}>
        <View style={cd.reportTag}><Text style={cd.reportTagText}>Report</Text></View>
        <View style={{ flex: 1, paddingLeft: Spacing['space-2'] }}>
          <Text style={cd.refTitle}>Report Discussion</Text>
          <Text style={cd.refMeta}>Report ID: {report_id ?? '—'}</Text>
        </View>
        <Text style={cd.refNum}>{report_id ? `#${report_id.slice(0, 8)}` : ''}</Text>
      </View>

      {/* Filter tabs */}
      <View style={cd.tabsRow}>
        {['All Comments', 'Latest', 'Verified Only'].map((tab, i) => (
          <TouchableOpacity key={tab} style={[cd.tab, i === 0 && cd.tabActive]}>
            <Text style={[cd.tabText, i === 0 && cd.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={cd.sortRow}>
        <Text style={cd.sortText}>Oldest first</Text>
        <Text style={cd.countText}>{comments?.length ?? 0} comments</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={cd.scroll}
        >
          {isLoading && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing['space-5'] }}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          )}

          {!isLoading && (comments ?? []).length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing['space-8'] }}>
              <Text style={{ color: C['text-secondary'], ...Typography.body }}>Start the discussion</Text>
            </View>
          )}

          {!isLoading &&
            (comments ?? []).map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}

          <View style={cd.footerNote}>
            <Text style={cd.footerText}>🔒 Be respectful. Helpful comments improve everyone&#39;s journey.</Text>
          </View>
        </ScrollView>

        {/* Comment input */}
        <View style={cd.inputBar}>
          <Avatar uri={user?.avatar_url} name={user?.display_name ?? undefined} size={36} />
          <View style={cd.inputField}>
            <TextInput
              style={cd.input}
              placeholder="Write a comment..."
              placeholderTextColor={C['text-tertiary']}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              multiline
            />
            <View style={cd.inputActions}>
              <TouchableOpacity style={cd.inputIcon}>
                <Camera size={16} color={C['text-secondary']} />
              </TouchableOpacity>
              <TouchableOpacity style={cd.inputIcon}>
                <Smiley size={16} color={C['text-secondary']} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[cd.sendBtn, commentText.trim() === '' && { opacity: 0.4 }]}
            disabled={commentText.trim() === '' || addComment.isPending}
            onPress={handleSend}
          >
            {addComment.isPending ? (
              <ActivityIndicator size="small" color={C['bg-base']} />
            ) : (
              <PaperPlaneTilt size={18} color={C['bg-base']} weight="fill" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createCd = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-3'], paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 1 },
  moreHeaderBtn: { width: 24, height: 24, backgroundColor: C['bg-overlay'], borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportRef: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing['space-5'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-3'], gap: Spacing['space-2'] },
  reportTag: { backgroundColor: C['danger-subtle'], borderRadius: 20, paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  reportTagText: { ...Typography.caption, fontWeight: '700', color: C.danger },
  refTitle: { ...Typography.body, fontWeight: '700', color: C['text-primary'] },
  refMeta: { ...Typography.caption, color: C['text-secondary'], marginTop: 2 },
  refNum: { ...Typography.caption, color: C['text-tertiary'] },
  tabsRow: { flexDirection: 'row', marginHorizontal: Spacing['space-5'], marginTop: Spacing['space-3'], backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: Spacing['space-3'], alignItems: 'center', borderRadius: Radius['radius-md'] },
  tabActive: { backgroundColor: C.primary },
  tabText: { ...Typography['body-sm'], color: C['text-secondary'] },
  tabTextActive: { fontWeight: '700', color: C['bg-base'] },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-2'] },
  sortText: { ...Typography['body-sm'], color: C['text-secondary'] },
  countText: { ...Typography['body-sm'], color: C['text-tertiary'] },
  commentCard: { backgroundColor: C['bg-card'], borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-2'] },
  replyCard: { marginLeft: Spacing['space-6'], backgroundColor: C['bg-overlay'] },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  avatar: { width: 38, height: 38, backgroundColor: C['bg-overlay'], borderRadius: 19 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  userName: { ...Typography['body-sm'], fontWeight: '700', color: C['text-primary'] },
  badge: { borderRadius: 20, paddingHorizontal: Spacing['space-2'], paddingVertical: 2 },
  badgeText: { ...Typography.caption, fontWeight: '600' },
  verifiedDot: { width: 16, height: 16, backgroundColor: C.primary, borderRadius: 8 },
  time: { ...Typography.caption, color: C['text-tertiary'], marginTop: 2 },
  moreBtn: { width: 20, height: 20, backgroundColor: C['bg-overlay'], borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  commentText: { ...Typography['body-sm'], color: C['text-primary'], lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-4'] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'] },
  likeIcon: { width: 18, height: 18, backgroundColor: C['primary-subtle'], borderRadius: 9 },
  likeCount: { ...Typography['body-sm'], fontWeight: '600', color: C['text-secondary'] },
  heartIcon: { width: 18, height: 18, backgroundColor: C['danger-subtle'], borderRadius: 9 },
  heartCount: { ...Typography['body-sm'], fontWeight: '600', color: C['text-secondary'] },
  replyBtn: { ...Typography['body-sm'], fontWeight: '600', color: C['text-secondary'] },
  translateBtn: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  footerNote: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-3'] },
  footerText: { ...Typography['body-sm'], color: C['text-secondary'], textAlign: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], padding: Spacing['space-3'], backgroundColor: C['bg-card'], borderTopWidth: 1, borderTopColor: C.border },
  inputAvatar: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18 },
  inputField: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-overlay'], borderRadius: 20, paddingHorizontal: Spacing['space-3'] },
  input: { flex: 1, paddingVertical: Spacing['space-2'], color: C['text-primary'], ...Typography.body },
  inputActions: { flexDirection: 'row', gap: Spacing['space-2'] },
  inputIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 36, height: 36, backgroundColor: C.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
