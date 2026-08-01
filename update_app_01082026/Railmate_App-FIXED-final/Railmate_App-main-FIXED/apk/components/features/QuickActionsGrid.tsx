import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ChartLineUp,
  Notebook,
  Bell,
  Info,
  Train,
  Calculator,
} from 'phosphor-react-native';
import { QuickActionCard } from './QuickActionCard';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface QuickActionsGridProps {
  onLiveStatus?: () => void;
  onMyTrips?: () => void;
  onSetAlert?: () => void;
  onStationInfo?: () => void;
  onCoachPosition?: () => void;
  onFareCalculator?: () => void;
}

/**
 * QuickActionsGrid - 6 quick action cards in 2 rows of 3
 * Row 1: Live Status, My Trips, Set Alert
 * Row 2: Station Info, Coach Position, Fare Calculator
 */
export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onLiveStatus = () => {},
  onMyTrips = () => {},
  onSetAlert = () => {},
  onStationInfo = () => {},
  onCoachPosition = () => {},
  onFareCalculator = () => {},
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconColor = C.primary;
  const iconSize = 24;

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        <QuickActionCard
          icon={<ChartLineUp size={iconSize} color={iconColor} weight="bold" />}
          label="Live Status"
          onPress={onLiveStatus}
          style={styles.card}
        />
        <QuickActionCard
          icon={<Notebook size={iconSize} color={iconColor} weight="bold" />}
          label="My Trips"
          onPress={onMyTrips}
          style={styles.card}
        />
        <QuickActionCard
          icon={<Bell size={iconSize} color={iconColor} weight="bold" />}
          label="Set Alert"
          onPress={onSetAlert}
          style={styles.card}
        />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <QuickActionCard
          icon={<Info size={iconSize} color={iconColor} weight="bold" />}
          label="Station Info"
          onPress={onStationInfo}
          style={styles.card}
        />
        <QuickActionCard
          icon={<Train size={iconSize} color={iconColor} weight="bold" />}
          label="Coach Position"
          onPress={onCoachPosition}
          style={styles.card}
        />
        <QuickActionCard
          icon={<Calculator size={iconSize} color={iconColor} weight="bold" />}
          label="Fare Calculator"
          onPress={onFareCalculator}
          style={styles.card}
        />
      </View>
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
  },
});
