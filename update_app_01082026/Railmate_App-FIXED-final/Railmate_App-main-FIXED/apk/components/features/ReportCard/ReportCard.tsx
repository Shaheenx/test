// components/features/ReportCard/ReportCard.tsx

import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle,
  Warning,
  Users,
  Star,
  X,
} from 'phosphor-react-native';
import { useColorScheme } from 'nativewind';
import { Colors } from '../../../constants/colors';
import { useTranslation } from '../../../i18n';
import { Typography } from '../../ui/Typography/Typography';
import { Avatar } from '../../ui/Avatar/Avatar';
import { timeAgo } from '../../../utils/timeAgo';
import type { CommunityReport, VoteType } from '../../../types/report.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportCardProps {
  report: CommunityReport;
  isBengali: boolean;
  onVote: (id: string, type: VoteType) => void;
  currentUserId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAccentClass(type: CommunityReport['report_type']): string {
  switch (type) {
    case 'DELAY':
      return 'bg-danger';
    case 'CROWD':
      return 'bg-accent';
    case 'PLATFORM':
      return 'bg-info';
    default:
      return 'bg-border';
  }
}

function StarRating({ rating }: { rating: number }) {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          weight={i <= rating ? 'fill' : 'regular'}
          color={i <= rating ? currentColors.primary : currentColors['text-secondary']}
        />
      ))}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportCard({
  report,
  isBengali,
  onVote,
  currentUserId: _currentUserId,
}: ReportCardProps) {
  const { colorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];
  const { t } = useTranslation();
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const isVerified = report.verification_count >= 5;
  const userConfirmed = report.current_user_vote === 'CONFIRM';
  const userDisputed = report.current_user_vote === 'DISPUTE';

  const trainName = isBengali ? (report.train?.name_bn ?? '') : (report.train?.name_en ?? '');
  const stationName = isBengali
    ? (report.station?.name_bn ?? '')
    : (report.station?.name_en ?? '');

  const time = timeAgo(report.reported_at, isBengali, t as any);
  const reporterName = report.user?.display_name ?? '—';

  // ── Main message line ────────────────────────────────────────────────────
  function renderMessage() {
    switch (report.report_type) {
      case 'DELAY':
        return (
          <Typography variant="body-sm" className="text-text-primary">
            {t('community.delay_report', { minutes: report.delay_minutes ?? 0 })}
          </Typography>
        );
      case 'CROWD': {
        const levelKey = `community.crowd_${report.crowd_level?.toLowerCase()}` as any;
        return (
          <Typography variant="body-sm" className="text-text-primary">
            {t('community.crowding_report', { level: t(levelKey) })}
          </Typography>
        );
      }
      case 'PLATFORM':
        return (
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <StarRating rating={report.condition_rating ?? 0} />
              <Typography variant="caption" className="text-text-secondary">
                {t('community.condition_report', {
                  rating: report.condition_rating ?? 0,
                })}
              </Typography>
            </View>
            {report.condition_note ? (
              <Typography variant="caption" className="text-text-secondary">
                {report.condition_note}
              </Typography>
            ) : null}
          </View>
        );
    }
  }

  // ── Report type icon ─────────────────────────────────────────────────────
  function renderIcon() {
    const props = { size: 18, weight: 'fill' as const };
    switch (report.report_type) {
      case 'DELAY':
        return <Warning {...props} color={currentColors.danger} />;
      case 'CROWD':
        return <Users {...props} color={currentColors.accent} />;
      case 'PLATFORM':
        return <Star {...props} color={currentColors.info} />;
    }
  }

  return (
    <>
      <View className="flex-row bg-bg-card rounded-xl overflow-hidden mb-3 border border-border">
        {/* Left accent bar */}
        <View className={`w-[3px] ${getAccentClass(report.report_type)}`} />

        <View className="flex-1 px-3 py-3 gap-2">
          {/* ── Top row: train badge + name + time + verified badge ────── */}
          <View className="flex-row items-center gap-2">
            <View className="bg-bg-elevated rounded-full px-2 py-0.5">
              <Typography variant="caption" className="text-text-secondary">
                {(report.train?.number ?? '')}
              </Typography>
            </View>

            <Typography
              variant="h4"
              className="text-text-primary flex-1"
              numberOfLines={1}
              isBengali={isBengali}
            >
              {trainName}
            </Typography>

            {isVerified && (
              <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                <CheckCircle size={12} color={currentColors.primary} weight="fill" />
                <Typography variant="caption" className="text-primary">
                  {t('community.verified')}
                </Typography>
              </View>
            )}
          </View>

          {/* ── Middle: icon + message + photo thumbnail ──────────────── */}
          <View className="flex-row items-start gap-2">
            <View className="pt-0.5">{renderIcon()}</View>

            <View className="flex-1 gap-1">
              {renderMessage()}
              <Typography
                variant="caption"
                className="text-text-secondary"
                isBengali={isBengali}
              >
                {stationName}
              </Typography>
            </View>

            {report.photo_url ? (
              <TouchableOpacity
                onPress={() => setPhotoModalVisible(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: report.photo_url }}
                  className="w-20 h-20 rounded-md"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Bottom row: avatar + name + time + vote buttons ──────── */}
          <View className="flex-row items-center">
            {/* User identity */}
            <View className="flex-row items-center gap-1.5 flex-1">
              <Avatar uri={report.user?.avatar_url} name={reporterName} size={24} />
              <Typography variant="caption" className="text-text-secondary">
                {reporterName}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                · {time}
              </Typography>
            </View>

            {/* Vote buttons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => onVote(report.id, 'CONFIRM')}
                className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
                  userConfirmed
                    ? 'bg-primary/10 border-primary'
                    : 'border-border bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <CheckCircle
                  size={14}
                  color={userConfirmed ? currentColors.primary : currentColors['text-secondary']}
                  weight={userConfirmed ? 'fill' : 'regular'}
                />
                <Typography
                  variant="caption"
                  className={userConfirmed ? 'text-primary' : 'text-text-secondary'}
                >
                  {report.verification_count}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onVote(report.id, 'DISPUTE')}
                className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
                  userDisputed
                    ? 'bg-danger/10 border-danger'
                    : 'border-border bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <X
                  size={14}
                  color={userDisputed ? currentColors.danger : currentColors['text-secondary']}
                  weight={userDisputed ? 'bold' : 'regular'}
                />
                <Typography
                  variant="caption"
                  className={userDisputed ? 'text-danger' : 'text-text-secondary'}
                >
                  {report.dispute_count}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── Full-screen photo modal ──────────────────────────────────────── */}
      {report.photo_url ? (
        <Modal
          visible={photoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/90 items-center justify-center"
            onPress={() => setPhotoModalVisible(false)}
          >
            <Image
              source={{ uri: report.photo_url }}
              className="w-full"
              style={{ aspectRatio: 1 }}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => setPhotoModalVisible(false)}
              className="absolute top-14 right-5 w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <X size={20} color={currentColors['text-primary']} />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
