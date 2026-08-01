import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

/**
 * SkeletonReportCard - Loading placeholder matching CommunityReportCard layout
 */
export const SkeletonReportCard: React.FC = () => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      {/* Header with avatar */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} radius={4} />
          <Skeleton width={180} height={12} radius={4} style={styles.spacing} />
        </View>
      </View>

      {/* Report type header */}
      <Skeleton width="80%" height={18} radius={4} style={styles.spacing} />

      {/* Description */}
      <Skeleton width="100%" height={14} radius={4} />
      <Skeleton width="90%" height={14} radius={4} style={styles.spacing} />

      {/* Confirmation row */}
      <Skeleton width={150} height={12} radius={4} style={styles.spacing} />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Action bar */}
      <View style={styles.actions}>
        <Skeleton width={60} height={14} radius={4} />
        <Skeleton width={80} height={14} radius={4} />
        <Skeleton width={60} height={14} radius={4} />
      </View>
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-md'],
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  spacing: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
