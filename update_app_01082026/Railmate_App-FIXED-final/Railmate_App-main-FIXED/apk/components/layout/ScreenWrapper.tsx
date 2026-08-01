import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useThemeColors, useResolvedTheme } from '../../hooks/useThemeColors';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  withPadding?: boolean;
  bgColor?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  withPadding = true,
  bgColor,
  style,
  ...props
}) => {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const resolvedBg = bgColor ?? colors['bg-base'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: resolvedBg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View
        style={[
          styles.inner,
          { backgroundColor: resolvedBg },
          withPadding && styles.padding,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  inner:   { flex: 1, width: '100%' },
  padding: { paddingHorizontal: 20 },
});
