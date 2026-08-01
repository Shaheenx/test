import React, { useEffect, useState } from 'react';
import '../global.css';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_600SemiBold,
} from '@expo-google-fonts/noto-sans-bengali';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { queryClient } from '../lib/queryClient';
import { initSentry, setSentryUser, Sentry } from '../lib/sentry';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppSplash } from '../components/AppSplash';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { usePrefsStore } from '../stores/prefsStore';
import { useThemeColors, useResolvedTheme } from '../hooks/useThemeColors';
import { getThemeVars } from '../lib/themeVars';

// Keep the native splash visible until fonts + auth are ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Must run before the first render, not inside an effect — a crash during
// the very first render pass would otherwise never get reported.
initSentry();

function RootLayout() {
  const { initialize, isAuthenticated, isLoading } = useAuth();
  const { isGuest, user } = useAuthStore();
  const { theme: themePref, hasFinishedOnboarding } = usePrefsStore();
  const router = useRouter();
  const segments = useSegments();

  const resolvedTheme = useResolvedTheme();
  const colors = useThemeColors();

  let themeVars: object = {};
  try {
    themeVars = getThemeVars(resolvedTheme);
  } catch {
    themeVars = {};
  }

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    NotoSansBengali_400Regular,
    NotoSansBengali_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    nativewindColorScheme.set(themePref === 'system' ? 'system' : resolvedTheme);
  }, [themePref, resolvedTheme]);

  const authInitStarted = React.useRef(false);
  // Guarantees AppSplash is visible for a minimum time regardless of how
  // fast/slow the real auth check resolves — fixes the inconsistency
  // between first-time users (instant, no session) and returning users
  // (slower, validates a real session over the network).
  const MIN_SPLASH_MS = 600;
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    SplashScreen.hideAsync().catch(() => {});
    if (!authInitStarted.current) {
      authInitStarted.current = true;
      initialize().catch(() => {
        // Auth init failed — proceed anyway; nav guard will redirect
      });
      const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_MS);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError, initialize]);
  
  useEffect(() => {
    if (isLoading) return;
    setSentryUser(isAuthenticated ? (user?.id ?? null) : null);
  }, [isAuthenticated, isLoading, user?.id]);

  useEffect(() => {
    if (isLoading) return;
    const seg0 = segments[0] as string | undefined;
    const inAuthGroup       = seg0 === 'auth';
    const inOnboardingGroup = seg0 === 'onboarding';

    if (!hasFinishedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding/welcome' as any);
      return;
    }
    if ((isAuthenticated || isGuest) && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
    if (!isAuthenticated && !isGuest && !inAuthGroup && !inOnboardingGroup && hasFinishedOnboarding) {
      router.replace('/auth/login' as any);
      return;
    }
  }, [isLoading, isAuthenticated, isGuest, hasFinishedOnboarding, segments, router]);

  if (!fontsLoaded && !fontError) return null;

  // Gated on both auth loading AND the minimum splash timer — whichever
  // finishes last wins. Guarantees every user sees the same full-bleed
  // splash duration, not a coin flip based on network speed.
  if (isLoading || !minDurationElapsed) return <AppSplash />;

  return (
    <SafeAreaProvider>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <View style={[{ flex: 1, backgroundColor: colors['bg-base'] }, themeVars as any]}>
        <Slot />
      </View>
    </QueryClientProvider>
    </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);