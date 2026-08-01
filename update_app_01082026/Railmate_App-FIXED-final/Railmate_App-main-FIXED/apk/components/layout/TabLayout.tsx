import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from './BottomNav';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type TabId = 'home' | 'search' | 'live' | 'community' | 'profile';

interface TabLayoutProps {
  activeTab: TabId;
  onTabPress: (tab: TabId) => void;
  children: React.ReactNode;
}

/**
 * TabLayout - Wraps content with BottomNav
 * Provides correct padding so content doesn't hide behind nav
 */
export const TabLayout: React.FC<TabLayoutProps> = ({
  activeTab,
  onTabPress,
  children,
}) => {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 60 + insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingBottom: bottomNavHeight }]}>
        {children}
      </View>
      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C['bg-base'],
  },
  content: {
    flex: 1,
  },
});
