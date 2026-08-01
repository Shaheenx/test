import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

/**
 * ScreenHeader - Reusable screen header with back button
 * Used in stack screens
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightContent,
  transparent = false,
  style,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <View
      style={[
        styles.container,
        transparent ? styles.transparent : styles.opaque,
        style,
      ]}
    >
      {/* Back button */}
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <CaretLeft size={20} color={C['text-primary']} weight="bold" />
        </Pressable>
      )}

      {/* Title */}
      {title && (
        <View style={styles.titleContainer}>
          <AppText variant="h3" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color={C['text-secondary']}>
              {subtitle}
            </AppText>
          )}
        </View>
      )}

      {/* Right content */}
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  opaque: {
    backgroundColor: C['bg-elevated'],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C['bg-card'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.6,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  rightContent: {
    marginLeft: 'auto',
  },
});
