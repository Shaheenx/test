import React, { useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  House,
  MagnifyingGlass,
  Pulse,
  Users,
  User,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '../ui/AppText';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type TabId = 'home' | 'search' | 'live' | 'community' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabPress: (tab: TabId) => void;
}

interface TabConfig {
  id: TabId;
  label: string;
  IconOutline: any;
  IconFilled: any;
}

const TABS: TabConfig[] = [
  {
    id: 'home',
    label: 'Home',
    IconOutline: House,
    IconFilled: House,
  },
  {
    id: 'search',
    label: 'Search',
    IconOutline: MagnifyingGlass,
    IconFilled: MagnifyingGlass,
  },
  {
    id: 'live',
    label: 'Live',
    IconOutline: Pulse,
    IconFilled: Pulse,
  },
  {
    id: 'community',
    label: 'Community',
    IconOutline: Users,
    IconFilled: Users,
  },
  {
    id: 'profile',
    label: 'Profile',
    IconOutline: User,
    IconFilled: User,
  },
];

/**
 * BottomNav - Main app navigation bar
 * Animated active indicator, haptic feedback
 */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleTabPress = (tabId: TabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(tabId);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => handleTabPress(tab.id)}
          colors={colors}
          styles={styles}
        />
      ))}
    </View>
  );
};

interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onPress, colors, styles }) => {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Scale animation on press
  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(0.9, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
    }
  }, [isActive, scale]);

  // Pulse animation for Live Updates tab when active
  useEffect(() => {
    if (isActive && tab.id === 'live') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isActive, tab.id, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: tab.id === 'live' ? pulseOpacity.value : 1,
  }));

  const Icon = isActive ? tab.IconFilled : tab.IconOutline;
  const iconWeight = isActive ? 'fill' : 'regular';
  const iconColor = isActive ? colors.primary : colors['text-tertiary'];
  const textColor = isActive ? colors.primary : colors['text-tertiary'];

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Icon size={24} color={iconColor} weight={iconWeight} />
        <AppText variant="labelSm" color={textColor}>
          {tab.label}
        </AppText>
        {isActive && <View style={styles.activeIndicator} />}
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C['bg-elevated'],
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 60,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.primary,
  },
});
