import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Chip } from '../ui/Chip/Chip';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useLiveTrainPositions } from '../../hooks/useLiveTrainPositions';
import { LiveTrainCard } from './LiveTrainCard';
import { useTranslation } from '../../i18n';
import type { LiveTrainPosition } from '../../types/liveTracking.types';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type StatusFilter = 'ALL' | 'ON_TIME' | 'DELAYED' | 'SCHEDULED';

interface LiveTrackingSectionProps {
  journeyDate: string;
  onTrainPress: (trainNumber: string) => void;
}

export function LiveTrackingSection({ journeyDate, onTrainPress }: LiveTrackingSectionProps) {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const { t } = useTranslation();
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL');
  const [showCompleted, setShowCompleted] = useState(false);
  const { data: trains = [], isLoading, error, refetch } = useLiveTrainPositions(journeyDate);

  const counts = useMemo(() => ({
    all:       trains.length,
    onTime:    trains.filter(tr => tr.live_status === 'ON_TIME').length,
    delayed:   trains.filter(tr => tr.live_status === 'DELAYED').length,
    scheduled: trains.filter(tr => tr.live_status === 'SCHEDULED').length,
    arrived:   trains.filter(tr => tr.live_status === 'ARRIVED').length,
  }), [trains]);

  const liveCount = counts.onTime + counts.delayed;

  const statusChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL',       label: t('updates.filter_all'),      count: counts.all },
    { key: 'ON_TIME',   label: t('updates.status_on_time'),  count: counts.onTime },
    { key: 'DELAYED',   label: t('updates.status_delayed'),  count: counts.delayed },
    { key: 'SCHEDULED', label: t('updates.status_scheduled'), count: counts.scheduled },
  ];

  // When a specific status filter is active, the person has already told us
  // what they want to see — show it as one flat list, don't re-group on top
  // of their own filter choice. Grouping only matters for the default "ALL"
  // view, where 120 interleaved trains is what caused the confusion.
  const isFiltered = activeStatus !== 'ALL';
  const filteredFlat: LiveTrainPosition[] = isFiltered
    ? trains.filter((tr) => tr.live_status === activeStatus)
    : [];

  const liveNow   = trains.filter(tr => tr.live_status === 'ON_TIME' || tr.live_status === 'DELAYED');
  const scheduled = trains.filter(tr => tr.live_status === 'SCHEDULED');
  const completed = trains.filter(tr => tr.live_status === 'ARRIVED');

  return (
    <View style={s.container}>
      {/* Stat line */}
      {!isLoading && !error && trains.length > 0 && (
        <View style={s.statLine}>
          <Text style={s.statText}>
            {t('updates.stat_tracked', { count: trains.length })}{' · '}
            {t('updates.stat_live', { liveCount })}
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={s.disclaimer}>{t('updates.tracking_disclaimer')}</Text>

      {/* Filter chips — count-annotated so the number is visible without tapping */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsWrap}
        contentContainerStyle={s.chipsContent}
      >
        {statusChips.map((chip) => (
          <Chip
            key={chip.key}
            label={`${chip.label}  ${chip.count}`}
            isActive={activeStatus === chip.key}
            onPress={() => setActiveStatus(chip.key)}
          />
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <>
          <Skeleton width="100%" height={90} radius={12} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={90} radius={12} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={90} radius={12} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={90} radius={12} style={{ marginBottom: 10 }} />
        </>
      ) : error ? (
        <EmptyState
          iconName="Warning"
          title={t('updates.tracking_error')}
          description="Please check your connection and try again"
          ctaLabel="Retry"
          onCta={refetch}
        />
      ) : trains.length === 0 ? (
        <EmptyState
          iconName="Train"
          title={t('updates.tracking_empty')}
          description="No trains are being tracked for this date"
        />
      ) : isFiltered ? (
        filteredFlat.length === 0 ? (
          <EmptyState iconName="Train" title={t('updates.tracking_empty')} description="No trains match this filter" />
        ) : (
          filteredFlat.map((train) => (
            <LiveTrainCard key={train.train_id} train={train} onPress={() => onTrainPress(train.train_number)} />
          ))
        )
      ) : (
        <>
          {liveNow.length > 0 && (
            <>
              <SectionHeader dotColor={C.success} label={t('updates.section_live_now')} count={liveNow.length} />
              {liveNow.map((train) => (
                <LiveTrainCard key={train.train_id} train={train} onPress={() => onTrainPress(train.train_number)} />
              ))}
            </>
          )}

          {scheduled.length > 0 && (
            <>
              <SectionHeader dotColor={C.info} label={t('updates.section_scheduled_today')} count={scheduled.length} />
              {scheduled.map((train) => (
                <LiveTrainCard key={train.train_id} train={train} onPress={() => onTrainPress(train.train_number)} />
              ))}
            </>
          )}

          {completed.length > 0 && (
            <>
              <Pressable style={s.completedToggle} onPress={() => setShowCompleted(v => !v)}>
                <View style={s.completedToggleLeft}>
                  <View style={[s.sectionDot, { backgroundColor: C['text-tertiary'] }]} />
                  <Text style={s.sectionLabel}>{t('updates.section_completed')} · {completed.length}</Text>
                </View>
                {showCompleted
                  ? <CaretUp size={14} color={C['text-secondary']} weight="regular" />
                  : <CaretDown size={14} color={C['text-secondary']} weight="regular" />}
              </Pressable>
              {showCompleted && completed.map((train) => (
                <LiveTrainCard key={train.train_id} train={train} onPress={() => onTrainPress(train.train_number)} />
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

function SectionHeader({ dotColor, label, count }: { dotColor: string; label: string; count: number }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionDot, { backgroundColor: dotColor }]} />
      <Text style={s.sectionLabel}>{label} · {count}</Text>
    </View>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  statLine: {
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: C['text-primary'],
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    color: C['text-tertiary'],
    marginBottom: 10,
  },
  chipsWrap: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing['space-2'],
    marginBottom: Spacing['space-2'],
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: C['text-secondary'],
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing['space-2'],
    marginTop: Spacing['space-2'],
    marginBottom: Spacing['space-2'],
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  completedToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
