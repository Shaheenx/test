import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BookmarkSimple, Clock, ArrowRight } from 'phosphor-react-native';
import { AppText } from '../ui/AppText';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface SavedRouteCardProps {
  from_en: string;
  from_bn: string;
  to_en: string;
  to_bn: string;
  last_viewed?: string;
  onPress: () => void;
  onUnsave?: () => void;
}

/**
 * SavedRouteCard - Fixed-width card showing saved route
 * Used in horizontal scroll list
 */
export const SavedRouteCard: React.FC<SavedRouteCardProps> = ({
  from_en,
  from_bn,
  to_en,
  to_bn,
  last_viewed,
  onPress,
  onUnsave: _onUnsave,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      {/* Bookmark icon */}
      <View style={styles.bookmarkContainer}>
        <BookmarkSimple size={18} color={C.primary} weight="fill" />
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.station}>
          <AppText variant="h4" numberOfLines={1}>
            {from_en}
          </AppText>
          <AppText variant="bengaliSm" numberOfLines={1}>
            {from_bn}
          </AppText>
        </View>

        <ArrowRight size={16} color={C['text-secondary']} weight="bold" />

        <View style={styles.station}>
          <AppText variant="h4" numberOfLines={1}>
            {to_en}
          </AppText>
          <AppText variant="bengaliSm" numberOfLines={1}>
            {to_bn}
          </AppText>
        </View>
      </View>

      {/* Last viewed */}
      {last_viewed && (
        <View style={styles.footer}>
          <Clock size={12} color={C['text-tertiary']} />
          <AppText variant="caption" color={C['text-tertiary']}>
            Last viewed: {last_viewed}
          </AppText>
        </View>
      )}
    </Pressable>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-md'],
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    position: 'relative',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  bookmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  routeRow: {
    gap: 8,
    marginBottom: 12,
    paddingRight: 24, // Space for bookmark
  },
  station: {
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
