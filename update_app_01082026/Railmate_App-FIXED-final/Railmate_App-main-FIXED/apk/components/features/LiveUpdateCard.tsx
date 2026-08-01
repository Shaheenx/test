import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { AppText } from '../ui/AppText';
import { StatusPill } from '../ui/StatusPill';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type StatusType = 'delay' | 'crowding' | 'onTime' | 'platform' | 'halted' | 'warning';
type StatusPillType = 'delay' | 'onTime' | 'warning' | 'crowding';

interface LiveUpdate {
  train_name: string;
  train_number: string;
  route_from: string;
  route_to: string;
  status_type: StatusType;
  status_label: string;
  description?: string;
  image_url?: string;
  delay_minutes?: number;
  reported_at: string;
  reporter_count: number;
  reporter_avatars?: string[];
  stops?: { name: string; passed: boolean }[];
}

interface LiveUpdateCardProps {
  update: LiveUpdate;
  onPress?: () => void;
}

/**
 * LiveUpdateCard - Compact live update card for feed
 * Shows train, status, and reporter info
 */
export const LiveUpdateCard: React.FC<LiveUpdateCardProps> = ({ update, onPress }) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const borderColor = getBorderColorForStatus(update.status_type);

  // Type guard to ensure we only pass valid types to StatusPill
  const isPillType = (type: StatusType): type is StatusPillType => {
    return ['delay', 'onTime', 'warning', 'crowding'].includes(type);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      {/* Left: Image with status overlay */}
      {update.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: update.image_url }}
            style={[styles.image, { borderColor }]}
          />
          {update.delay_minutes && (
            <View style={styles.delayBadge}>
              <AppText variant="labelSm" color="#FFF">
                {update.delay_minutes}m
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Middle: Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <AppText variant="h4" numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1 }}>
            {update.train_name}
          </AppText>
          <AppText variant="mono" color={C['text-tertiary']}>
            #{update.train_number}
          </AppText>
        </View>

        <AppText variant="caption" color={C['text-secondary']} numberOfLines={1}>
          {update.route_from} → {update.route_to}
        </AppText>

        {isPillType(update.status_type) && (
          <StatusPill type={update.status_type} label={update.status_label} style={styles.status} />
        )}

        {update.description && (
          <AppText variant="caption" color={C['text-secondary']} numberOfLines={1}>
            {update.description}
          </AppText>
        )}

        {/* Progress dots for stops */}
        {update.stops && update.stops.length > 0 && (
          <View style={styles.stopsRow}>
            {update.stops.map((stop, idx) => (
              <View
                key={idx}
                style={[
                  styles.stopDot,
                  stop.passed ? styles.stopDotPassed : styles.stopDotAhead,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Right: Reporter info */}
      <View style={styles.reporterInfo}>
        <AppText variant="caption" color={C['text-tertiary']} align="right">
          {update.reported_at}
        </AppText>
        {update.reporter_avatars && update.reporter_avatars.length > 0 && (
          <View style={styles.avatarStack}>
            {update.reporter_avatars.slice(0, 3).map((avatar, idx) => {
              if (typeof avatar !== 'string' || !avatar) return null;
              return (
                <Image
                  key={idx}
                  source={{ uri: avatar }}
                  style={[styles.avatar, { marginLeft: idx > 0 ? -8 : 0 }]}
                />
              );
            })}
            {update.reporter_count > 3 && (
              <View style={[styles.avatar, styles.avatarMore, { marginLeft: -8 }]}>
                <AppText variant="labelSm" color="#FFF">
                  +{update.reporter_count - 3}
                </AppText>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

function getBorderColorForStatus(type: StatusType): string {
  switch (type) {
    case 'delay':
    case 'halted':
      return C.danger;
    case 'onTime':
      return C.success;
    case 'crowding':
    case 'platform':
      return C.accent;
    default:
      return C.border;
  }
}

const createStyles = (C: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-md'],
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
  },
  delayBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    backgroundColor: C.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    marginTop: 2,
  },
  stopsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stopDotPassed: {
    backgroundColor: C.primary,
  },
  stopDotAhead: {
    backgroundColor: C['border-strong'],
  },
  reporterInfo: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C['bg-card'],
  },
  avatarMore: {
    backgroundColor: C['bg-overlay'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
