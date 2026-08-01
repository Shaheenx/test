// components/features/BadgePreviewModal/BadgePreviewModal.tsx
//
// Task 2: public badge preview. Deliberately a modal, not a route — the
// founder does not want full profile browsing for privacy. Shows only:
// avatar, display name, trust score / level, report count, earned
// badges. Reads through the `user_public_profiles` view (see
// supabase/migrations/006_public_user_profiles.sql) which exposes
// nothing beyond those fields — no phone, email, or premium status.
//
// Also hosts the Task 3 Follow/Unfollow button — kept in this single
// entry point per the brief ("don't add a separate entry point").

import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { X, Flag } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../../../constants';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../ui/Avatar/Avatar';
import { getReputationLevel, BADGE_ICONS } from '../../../lib/reputation';
import { useAuthStore } from '../../../stores/authStore';
import { useIsFollowing, useToggleFollow } from '../../../hooks/useUserFollows';
import { useTranslation } from '../../../i18n';
import { useThemeColors, ThemeColors } from '../../../hooks/useThemeColors';

interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  report_count: number;
  is_trusted: boolean;
}

interface EarnedBadge {
  badge_type: string;
}

interface BadgePreviewModalProps {
  userId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function BadgePreviewModal({ userId, visible, onClose }: BadgePreviewModalProps) {
  const colors = useThemeColors();
  const C = colors;
  const bp = useMemo(() => createBp(colors), [colors]);
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = !!userId && userId === currentUser?.id;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user_public_profile', userId],
    queryFn: async (): Promise<PublicProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_public_profiles')
        .select('id, display_name, avatar_url, trust_score, report_count, is_trusted')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!userId && visible,
  });

  const { data: badges } = useQuery({
    queryKey: ['user_badges_public', userId],
    queryFn: async (): Promise<EarnedBadge[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_type')
        .eq('user_id', userId);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!userId && visible,
  });

  const { data: isFollowing } = useIsFollowing(userId ?? undefined);
  const toggleFollow = useToggleFollow();

  const level = profile ? getReputationLevel(profile.trust_score) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={bp.backdrop}>
        <View style={bp.sheet}>
          <View style={bp.headerRow}>
            <Text style={bp.headerTitle}>{t('badge_preview.title')}</Text>
            <TouchableOpacity style={bp.closeBtn} onPress={onClose}>
              <X size={18} color={C['text-secondary']} weight="regular" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: Spacing['space-6'], alignItems: 'center' }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : error || !profile ? (
            <View style={{ paddingVertical: Spacing['space-6'], alignItems: 'center' }}>
              <Text style={{ color: C['text-secondary'], ...Typography['body-sm'] }}>
                {t('badge_preview.load_error')}
              </Text>
            </View>
          ) : (
            <>
              <View style={bp.profileRow}>
                <Avatar uri={profile.avatar_url} name={profile.display_name ?? undefined} size={64} />
                <Text style={bp.name}>{profile.display_name ?? 'Traveler'}</Text>
                {level && (
                  <Text style={bp.level}>Level {level.num} · {level.name}</Text>
                )}
              </View>

              <View style={bp.statsRow}>
                <View style={bp.statBox}>
                  <Text style={bp.statVal}>{profile.trust_score}</Text>
                  <Text style={bp.statLabel}>{t('badge_preview.trust_score')}</Text>
                </View>
                <View style={bp.statBox}>
                  <Text style={bp.statVal}>{profile.report_count}</Text>
                  <Text style={bp.statLabel}>{t('badge_preview.reports')}</Text>
                </View>
              </View>

              <Text style={bp.sectionTitle}>{t('badge_preview.earned_badges')}</Text>
              {(badges ?? []).length === 0 ? (
                <Text style={bp.noBadges}>{t('badge_preview.no_badges')}</Text>
              ) : (
                <View style={bp.badgeRow}>
                  {(badges ?? []).map((b, i) => {
                    const Icon = BADGE_ICONS[b.badge_type] ?? Flag;
                    return (
                      <View key={b.badge_type + i} style={bp.badgeIcon}>
                        <Icon size={20} color={C['text-primary']} weight="fill" />
                      </View>
                    );
                  })}
                </View>
              )}

              {!isOwnProfile && currentUser && (
                <TouchableOpacity
                  style={[bp.followBtn, isFollowing && bp.followBtnActive]}
                  onPress={() => toggleFollow.mutate({ followedId: profile.id, isCurrentlyFollowing: !!isFollowing })}
                  disabled={toggleFollow.isPending}
                >
                  <Text style={[bp.followBtnText, isFollowing && bp.followBtnTextActive]}>
                    {isFollowing ? t('badge_preview.following') : t('badge_preview.follow')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createBp = (C: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C['bg-card'],
    borderTopLeftRadius: Radius['radius-lg'],
    borderTopRightRadius: Radius['radius-lg'],
    padding: Spacing['space-5'],
    gap: Spacing['space-4'],
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  closeBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  profileRow: { alignItems: 'center', gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: C['text-primary'], marginTop: Spacing['space-2'] },
  level: { ...Typography['body-sm'], color: C['text-secondary'] },
  statsRow: { flexDirection: 'row', gap: Spacing['space-3'] },
  statBox: { flex: 1, backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-md'], paddingVertical: Spacing['space-3'], alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: C['text-primary'] },
  statLabel: { ...Typography['body-sm'], color: C['text-secondary'] },
  sectionTitle: { ...Typography['body-sm'], fontWeight: '600', color: C['text-primary'] },
  noBadges: { ...Typography['body-sm'], color: C['text-tertiary'] },
  badgeRow: { flexDirection: 'row', gap: Spacing['space-2'], flexWrap: 'wrap' },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C['primary-dim'], alignItems: 'center', justifyContent: 'center' },
  followBtn: { backgroundColor: C.primary, borderRadius: Radius['radius-md'], paddingVertical: Spacing['space-3'], alignItems: 'center' },
  followBtnActive: { backgroundColor: C['bg-overlay'], borderWidth: 1, borderColor: C.border },
  followBtnText: { ...Typography.body, fontWeight: '700', color: C['text-inverse'] },
  followBtnTextActive: { color: C['text-primary'] },
});
