import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { Typography } from '../../constants/typography';
import { useTranslation } from '../../i18n';
import type { LiveTrainPosition } from '../../types/liveTracking.types';
import { TrainProgressBar } from './TrainProgressBar';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface LiveTrainCardProps {
  train: LiveTrainPosition;
  onPress: () => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Minutes until scheduled departure, or null if it's already passed/invalid.
function minutesUntil(isoString: string): number | null {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / 60000);
}

function statusColor(status: LiveTrainPosition['live_status']): string {
  switch (status) {
    case 'ON_TIME':   return C.success;
    case 'DELAYED':   return C.danger;
    case 'ARRIVED':   return C['text-tertiary'];
    case 'SCHEDULED':
    default:          return C.info;
  }
}

function statusLabelKey(status: LiveTrainPosition['live_status']): string {
  switch (status) {
    case 'ON_TIME':   return 'updates.status_on_time';
    case 'DELAYED':   return 'updates.status_delayed';
    case 'ARRIVED':   return 'updates.status_arrived';
    case 'SCHEDULED': return 'updates.status_scheduled';
    default:          return 'updates.status_scheduled';
  }
}

export function LiveTrainCard({ train, onPress }: LiveTrainCardProps) {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const { t } = useTranslation();
  const color = statusColor(train.live_status);
  const depTime = formatTime(train.scheduled_departure);
  const arrTime = formatTime(train.scheduled_arrival);
  const hasDelay = train.estimated_delay_minutes > 0;
  const isLive = train.live_status === 'ON_TIME' || train.live_status === 'DELAYED';
  const isArrived = train.live_status === 'ARRIVED';
  const mins = train.live_status === 'SCHEDULED' ? minutesUntil(train.scheduled_departure) : null;

  return (
    <Pressable
      style={({ pressed }) => [s.card, { borderLeftColor: color }, isArrived && s.cardArrived, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {/* Top row: number + name + status */}
      <View style={s.topRow}>
        <Text style={s.trainNumber}>#{train.train_number}</Text>
        <Text style={s.trainName} numberOfLines={1} ellipsizeMode="tail">{train.train_name_en}</Text>
        <View style={s.statusGroup}>
          <View style={[s.statusDot, { backgroundColor: color }]} />
          <Text style={[s.statusText, { color }]}>{t(statusLabelKey(train.live_status) as any)}</Text>
        </View>
      </View>

      {/* Route row */}
      <Text style={s.routeText} numberOfLines={1}>
        {train.origin_name_en} → {train.destination_name_en}
      </Text>

      {/* Time row */}
      <View style={s.timeRow}>
        <Text style={s.timeText}>{depTime}</Text>
        <Text style={s.timeSep}> → </Text>
        <Text style={s.timeText}>{arrTime}</Text>
        {hasDelay && (
          <View style={s.delayBadge}>
            <Text style={s.delayText}>+{train.estimated_delay_minutes}m</Text>
          </View>
        )}
      </View>

      {/* Footer — differs by status instead of always showing a progress
          bar. A 0%-filled bar on a SCHEDULED train looked identical to a
          stalled live train, which was the core of the "can't tell which
          is running" complaint. */}
      {isLive && (
        <TrainProgressBar progress={train.progress_pct} status={train.live_status} />
      )}
      {train.live_status === 'SCHEDULED' && mins !== null && mins <= 180 && (
        <Text style={s.footerNote}>{t('updates.departs_in', { mins: String(mins) })}</Text>
      )}
      {isArrived && (
        <View style={s.completedRow}>
          <CheckCircle size={12} color={C['text-tertiary']} weight="fill" />
          <Text style={s.footerNote}>{t('updates.completed_journey')}</Text>
        </View>
      )}
    </Pressable>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-lg'],
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    padding: Spacing['space-3'],
    marginBottom: Spacing['space-3'],
  },
  cardArrived: {
    opacity: 0.65,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['space-2'],
    marginBottom: Spacing['space-1'],
  },
  trainNumber: {
    ...Typography.time,
    fontSize: 12,
    color: C['text-secondary'],
  },
  trainName: {
    flex: 1,
    ...Typography['h4'],
    fontSize: 14,
    color: C['text-primary'],
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
  },
  routeText: {
    ...Typography['body-sm'],
    color: C['text-secondary'],
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...Typography.time,
    fontSize: 13,
    color: C['text-primary'],
  },
  timeSep: {
    fontSize: 12,
    color: C['text-tertiary'],
  },
  delayBadge: {
    marginLeft: 8,
    backgroundColor: C['danger-subtle'],
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  delayText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.danger,
  },
  footerNote: {
    ...Typography.caption,
    color: C['text-tertiary'],
    marginTop: Spacing['space-2'],
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing['space-2'],
  },
});
