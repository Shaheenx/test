import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, MagnifyingGlass, BellSimple, UsersThree, User } from 'phosphor-react-native';

import { useThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../i18n';

const TAB_BAR_HEIGHT = 60;

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors['primary'],
        tabBarInactiveTintColor: colors['text-tertiary'],
        tabBarStyle: {
          backgroundColor: colors['bg-elevated'],
          borderTopWidth: 1,
          borderTopColor: colors['border'],
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search'),
          tabBarIcon: ({ color, focused }) => (
            <MagnifyingGlass size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="live-updates"
        options={{
          title: t('nav.live_updates'),
          tabBarIcon: ({ color, focused }) => (
            <BellSimple size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('nav.community'),
          tabBarIcon: ({ color, focused }) => (
            <UsersThree size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
