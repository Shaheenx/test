import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ImageBackground, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefsStore } from '../../stores/prefsStore';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

// On-image text — always white since it sits on a dark gradient overlay.
const OI = { headline: '#FFFFFF', sub: '#B0C4D8' };
const PRIMARY = '#00A859';
const TOTAL_SLIDES = 5; // welcome + 3 features + permissions

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { setLanguage } = usePrefsStore();
  const s = useMemo(() => createStyles(colors), [colors]);

  const handleGetStarted = () => {
    setLanguage('en');
    router.push('/onboarding/features' as any);
  };

  const handleBengali = () => {
    setLanguage('bn');
    router.push('/onboarding/features' as any);
  };

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={s.bg}
        resizeMode="cover"
      >
        {/* Dark gradient overlay for text legibility */}
        <View style={s.overlay} />

        {/* Hero text */}
        <View style={s.hero}>
          <Text style={s.headline}>
            {'Travel Smarter.\nTravel '}
            <Text style={{ color: PRIMARY }}>RailMate.</Text>
          </Text>
          <Text style={s.sub}>
            Your all-in-one railway companion{'\n'}for Bangladesh.
          </Text>
        </View>

        {/* CTAs */}
        <View style={[s.ctas, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={s.primaryBtn} onPress={handleGetStarted}>
            <Text style={s.primaryBtnText}>Get Started  →</Text>
          </Pressable>
          <Pressable style={s.secondaryBtn} onPress={handleBengali}>
            <Text style={s.secondaryBtnText}>Continue in বাংলা</Text>
          </Pressable>

          {/* Pagination dots — slide 1 of 5 */}
          <View style={s.dots}>
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
            ))}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: '#080D17' },
    bg:      { flex: 1, justifyContent: 'flex-end' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,13,23,0.72)' },

    // Hero
    hero:      { paddingHorizontal: 28, marginBottom: 32 },
    headline:  {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 36, lineHeight: 46, color: OI.headline,
      textAlign: 'center', marginBottom: 14,
    },
    sub:       {
      fontFamily: 'Inter_400Regular',
      fontSize: 16, lineHeight: 26, color: OI.sub,
      textAlign: 'center',
    },

    // CTAs
    ctas:       { paddingHorizontal: 24, gap: 12 },
    primaryBtn: {
      backgroundColor: PRIMARY, borderRadius: 56,
      paddingVertical: 17, alignItems: 'center',
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
    },
    primaryBtnText: {
      fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF',
    },
    secondaryBtn: {
      borderWidth: 1.5, borderColor: PRIMARY,
      borderRadius: 56, paddingVertical: 16, alignItems: 'center',
    },
    secondaryBtnText: {
      fontFamily: 'Inter_600SemiBold', fontSize: 16, color: PRIMARY,
    },

    // Dots
    dots:     { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 8 },
    dot:      { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.25)' },
    dotActive:{ width: 22, backgroundColor: PRIMARY },
  });
