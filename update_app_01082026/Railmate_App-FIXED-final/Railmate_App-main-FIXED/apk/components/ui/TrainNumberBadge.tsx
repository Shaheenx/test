import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface TrainNumberBadgeProps {
  number: string;
  style?: ViewStyle;
}

/**
 * TrainNumberBadge - Displays train number with # prefix
 * Used in train cards and train detail screens
 */
export const TrainNumberBadge: React.FC<TrainNumberBadgeProps> = ({ number, style }) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <AppText variant="labelLg" color={C.primary}>
        #{number}
      </AppText>
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: C['bg-card'],
    borderRadius: Radius['radius-sm'],
    borderWidth: 1,
    borderColor: C.primary,
    alignSelf: 'flex-start',
  },
});
