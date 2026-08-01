import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Clock, Warning, CheckCircle, CalendarBlank, CaretRight } from 'phosphor-react-native';
import { TrainSearchResult, TrainClass } from '../../../types/train.types';
import { TrainDelayStatus } from '../../../api/community';
import { formatTime } from '../../../utils/formatTime';
import { formatDuration } from '../../../utils/formatDuration';
import { trainClassLabel } from '../../../utils/trainClassLabel';
import { useThemeColors, ThemeColors } from '../../../hooks/useThemeColors';
import { useTranslation } from '../../../i18n';
import { Spacing } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { Radius } from '../../../constants/radius';

interface TrainCardProps {
  train: TrainSearchResult;
  fromId?: string;
  toId?: string;
  /** Real, route-batched fare classes for this train_number — see
   *  useFareClassesForRoute. Undefined while loading; empty array means the
   *  `fares` table genuinely has no rows for this train+route yet. */
  availableClasses?: TrainClass[];
  /** Real, batched delay enrichment for this train_number on the searched
   *  date — see useTrainDelayStatus. Undefined = no community report found
   *  (render the verified/unverified badge only, never a fabricated status). */
  delayStatus?: TrainDelayStatus;
}

// days_of_week: canonical SMALLINT[] inclusion list (Sunday=0, Saturday=6)
// Matches the canonical schema in migrations/001_initial_schema.sql.
// The old schema used off_days text[] (exclusion, day names) — that column
// no longer exists.
const DAY_LABELS: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const TrainCard: React.FC<TrainCardProps> = ({
  train, fromId, toId, availableClasses, delayStatus,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () =>
    router.push({ pathname: '/train/[id]', params: { id: String(train.train_number), fromId, toId } });

  // days_of_week is an inclusion list: [0,1,2,3,4,5,6] = daily
  const daysOfWeek: number[] = train.days_of_week ?? ALL_DAYS;
  const isDaily = daysOfWeek.length === ALL_DAYS.length;
  const runsLabel = isDaily
    ? 'Daily'
    : daysOfWeek.map((d) => DAY_LABELS[d] ?? String(d)).join(', ');
  const offDays = ALL_DAYS.filter((d) => !daysOfWeek.includes(d));
  const offDayLabel = offDays.length === 0
    ? 'None'
    : offDays.map((d) => DAY_LABELS[d] ?? String(d)).join(', ');

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      {/* Top row: train number badge + type badge */}
      <View style={s.topRow}>
        <View style={s.numberBadge}>
          <Text style={s.numberBadgeText}>#{train.train_number}</Text>
        </View>
        {!!train.train_type && (
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>{train.train_type}</Text>
          </View>
        )}
      </View>

      {/* Name — Bengali name omitted: TrainSearchResult has no name_bn field
          (see delivery notes — not present anywhere in the trains schema). */}
      <Text style={s.trainName}>{train.train_name_en}</Text>

      {/* Status pill: community delay report takes priority over the
          verified/unverified badge when present; otherwise fall back to it. */}
      <View style={s.statusRow}>
        {delayStatus ? (
          <View style={[s.statusPill, { backgroundColor: colors['danger-subtle'] }]}>
            <Clock size={12} color={colors.danger} weight="fill" />
            <Text style={[s.statusPillText, { color: colors.danger }]}>
              {t('community.delay_report', { minutes: delayStatus.delayMinutes })}
            </Text>
          </View>
        ) : train.verified ? (
          <View style={[s.statusPill, { backgroundColor: colors['success-subtle'] }]}>
            <CheckCircle size={12} color={colors.success} weight="fill" />
            <Text style={[s.statusPillText, { color: colors.success }]}>{t('results.on_time')}</Text>
          </View>
        ) : (
          <View style={[s.statusPill, { backgroundColor: colors['accent-subtle'] }]}>
            <Warning size={12} color={colors.accent} weight="fill" />
            <Text style={[s.statusPillText, { color: colors.accent }]}>
              {t('results.schedule_being_verified')}
            </Text>
          </View>
        )}
      </View>

      {train.verified ? (
        /* ── Tier 2: verified timetable — real times only ── */
        <View style={s.timeRow}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={s.time}>{formatTime(train.departure_time)}</Text>
            <Text style={s.timeLabel}>{t('train.depart')}</Text>
          </View>
          <View style={s.durationCol}>
            <View style={s.durationLine} />
            <View style={s.durationBadge}>
              <Clock size={11} color={colors['text-tertiary']} />
              <Text style={s.durationText}>{formatDuration(train.duration_minutes)}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.time}>{formatTime(train.arrival_time)}</Text>
            <Text style={s.timeLabel}>{t('train.arrive')}</Text>
          </View>
        </View>
      ) : (
        /* ── Tier 1: route confirmed, no verified timing — never show a fake time ── */
        <View style={s.unverifiedRow}>
          <Clock size={14} color={colors['text-tertiary']} />
          <Text style={s.unverifiedText}>{t('results.schedule_being_verified')}</Text>
        </View>
      )}

      {/* Runs / Off day */}
      <Pressable style={s.runsRow} onPress={handlePress}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] }}>
          <CalendarBlank size={13} color={colors['text-tertiary']} />
          <Text style={s.runsText}>Runs: {runsLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] }}>
          <Clock size={13} color={colors['text-tertiary']} />
          <Text style={s.runsText}>Off Day: {offDayLabel}</Text>
        </View>
        <CaretRight size={13} color={colors['text-tertiary']} />
      </Pressable>

      {/* Available Classes — real data only; renders nothing extra when the
          fares table has no rows for this train+route yet (no fabricated
          "Seats Available" count — see delivery notes, no such field/table
          exists anywhere in the schema). */}
      {availableClasses && availableClasses.length > 0 && (
        <View style={s.classesSection}>
          <Text style={s.classesLabel}>Available Classes</Text>
          <View style={s.classesRow}>
            {availableClasses.map((cls) => (
              <View key={cls} style={s.classChip}>
                <Text style={s.classChipText}>{trainClassLabel(cls)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card:        { backgroundColor: colors['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: colors.border, marginBottom: Spacing['space-4'], padding: Spacing['space-5'] },
  pressed:     { opacity: 0.88 },

  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['space-3'] },
  numberBadge: { borderWidth: 1, borderColor: colors.primary, borderRadius: Radius['radius-sm'], paddingHorizontal: Spacing['space-2'], paddingVertical: 3 },
  numberBadgeText: { ...Typography['mono'], color: colors.primary },
  typeBadge:   { borderWidth: 1, borderColor: colors.primary, borderRadius: Radius['radius-sm'], paddingHorizontal: Spacing['space-2'], paddingVertical: 3 },
  typeBadgeText: { ...Typography['label'], color: colors.primary },

  trainName:   { ...Typography['h3'], color: colors['text-primary'], marginBottom: Spacing['space-2'] },

  statusRow:   { flexDirection: 'row', marginBottom: Spacing['space-3'] },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-1'], borderRadius: Radius['radius-sm'], paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  statusPillText: { ...Typography['label'] },

  timeRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing['space-3'] },
  time:        { ...Typography['display-lg'], fontSize: 28, lineHeight: 32, color: colors['text-primary'] },
  timeLabel:   { ...Typography['caption'], color: colors.primary, marginTop: 2 },
  durationCol: { flex: 1, alignItems: 'center', marginHorizontal: Spacing['space-3'] },
  durationLine:{ height: 1, backgroundColor: colors.border, width: '100%', marginBottom: Spacing['space-2'] },
  durationBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors['bg-elevated'], borderRadius: Radius['radius-full'], paddingVertical: 4, paddingHorizontal: Spacing['space-2'] },
  durationText:{ ...Typography['caption'], color: colors['text-secondary'] },

  unverifiedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'], marginBottom: Spacing['space-3'], paddingVertical: Spacing['space-3'], paddingHorizontal: Spacing['space-3'], backgroundColor: colors['bg-elevated'], borderRadius: Radius['radius-md'] },
  unverifiedText: { ...Typography['body-sm'], color: colors['text-secondary'] },

  runsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing['space-3'], borderTopWidth: 1, borderTopColor: colors.border },
  runsText:    { ...Typography['caption'], color: colors['text-tertiary'] },

  classesSection: { marginTop: Spacing['space-3'], paddingTop: Spacing['space-3'], borderTopWidth: 1, borderTopColor: colors.border },
  classesLabel:   { ...Typography['caption'], color: colors['text-tertiary'], marginBottom: Spacing['space-2'] },
  classesRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['space-2'] },
  classChip:      { borderWidth: 1, borderColor: colors.primary, borderRadius: Radius['radius-sm'], paddingHorizontal: Spacing['space-2'], paddingVertical: 4 },
  classChipText:  { ...Typography['label'], color: colors.primary },
});
