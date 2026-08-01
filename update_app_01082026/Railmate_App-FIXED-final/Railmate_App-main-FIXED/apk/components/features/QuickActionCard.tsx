import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { Radius } from '../../constants/radius';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  style?: any;
}

/**
 * QuickActionCard - Single action card for quick actions grid
 * Shows icon in circle and label below
 */
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  label,
  onPress,
  style,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <AppText variant="label" color={C['text-secondary']} align="center" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: C['bg-card'],
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius['radius-lg'],
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,168,89,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 10,
  },
});
