import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton - Animated loading placeholder
 * Shimmer effect using reanimated
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius = 10,
  style,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  skeleton: {
    backgroundColor: C['bg-overlay'],
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: C['border-strong'],
    opacity: 0.3,
  },
});
