// app/onboarding.tsx
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../constants';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

const { width: W } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  titleHighlight?: string;
  subtitle: string;
  illustration: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to ',
    titleHighlight: 'RailMate Bangladesh',
    subtitle: 'Your all-in-one companion for smarter, safer and easier train journeys across Bangladesh.',
    illustration: 'hero',
  },
  {
    id: '2',
    title: 'Real-time Train\nUpdates',
    subtitle: 'Get live running status, delays, platform changes and station updates in real-time.',
    illustration: 'live',
  },
  {
    id: '3',
    title: 'Power of\nCommunity',
    subtitle: 'Share and discover real experiences from fellow travelers. Together, we make every journey better.',
    illustration: 'community',
  },
  {
    id: '4',
    title: 'Everything You Need,\nAll in One Place',
    subtitle: "From seat availability to station info, we've got all the essential features to plan your perfect journey.",
    illustration: 'features',
  },
  {
    id: '5',
    title: 'Safe. Reliable.\nMade for Bangladesh.',
    subtitle: 'Built for Bangladeshi travelers, by people who care about better train journeys.',
    illustration: 'safe',
  },
];

function SlideIllustration({ type }: { type: string }) {
  // In production: replace with actual Lottie animations or SVG illustrations
  const configs: Record<string, { bg: string; icon: string }> = {
    hero:      { bg: C['primary-subtle'], icon: '🚂' },
    live:      { bg: C['info-subtle'],  icon: '📡' },
    community: { bg: C['info-subtle'], icon: '👥' },
    features:  { bg: C['accent-subtle'], icon: '⚡' },
    safe:      { bg: C['primary-subtle'], icon: '🛡️' },
  };
  const cfg = configs[type] ?? { bg: C['bg-overlay'], icon: '🚆' };
  return (
    <View style={[il.container, { backgroundColor: cfg.bg }]}>
      <Text style={il.emoji}>{cfg.icon}</Text>
    </View>
  );
}
const createIl = (C: ThemeColors) => StyleSheet.create({
  container: { width: '100%', height: 280, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['space-5'] },
  emoji: { fontSize: 80 },
});

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const C = colors;
  const il = useMemo(() => createIl(colors), [colors]);
  const ob = useMemo(() => createOb(colors), [colors]);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const isLast = currentIndex === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = () => router.replace('/(tabs)');

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={ob.slide}>
      <SlideIllustration type={item.illustration} />
      <View style={ob.textBlock}>
        <Text style={ob.slideTitle}>
          {item.title}
          {item.titleHighlight && <Text style={ob.highlight}>{item.titleHighlight}</Text>}
        </Text>
        <Text style={ob.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={ob.root}>
      {/* Header: Logo + Skip */}
      <View style={ob.header}>
        <View style={ob.logoRow}>
          <View style={ob.logoIcon} />
          <View>
            <View style={ob.brandRow}>
              <Text style={ob.brandWhite}>Rail</Text>
              <Text style={ob.brandGreen}>Mate</Text>
            </View>
            <Text style={ob.brandSub}>Bangladesh</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={ob.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      />

      {/* Footer: dots + button */}
      <View style={ob.footer}>
        {/* Dot indicators */}
        <View style={ob.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[ob.dot, i === currentIndex && ob.dotActive]} />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={ob.nextBtn} onPress={handleNext}>
          <Text style={ob.nextBtnText}>{isLast ? 'Get Started' : 'Next  ›'}</Text>
        </TouchableOpacity>

        {/* Log in link on last slide */}
        {isLast && (
          <View style={ob.loginRow}>
            <Text style={ob.loginText}>Already have an account?  </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
              <Text style={ob.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createOb = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B12' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['space-6'], paddingVertical: Spacing['space-4'] },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  logoIcon: { width: 44, height: 44, backgroundColor: C.primary, borderRadius: 12 },
  brandRow: { flexDirection: 'row' },
  brandWhite: { fontSize: 20, fontWeight: '800', color: C['text-primary'] },
  brandGreen: { fontSize: 20, fontWeight: '800', color: C.primary },
  brandSub: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 1 },
  skipText: { ...Typography.body, fontWeight: '600', color: C['text-secondary'] },
  slide: { width: W, paddingHorizontal: Spacing['space-6'], paddingTop: Spacing['space-3'] },
  textBlock: { gap: Spacing['space-3'], paddingTop: Spacing['space-4'] },
  slideTitle: { fontSize: 26, fontWeight: '800', color: C['text-primary'], lineHeight: 34 },
  highlight: { color: C.primary },
  slideSubtitle: { ...Typography.body, color: C['text-secondary'], lineHeight: 22 },
  footer: { paddingHorizontal: Spacing['space-6'], paddingBottom: Spacing['space-8'], gap: Spacing['space-5'] },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing['space-2'] },
  dot: { width: 8, height: 8, backgroundColor: C['bg-overlay'], borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: C.primary, borderRadius: 4 },
  nextBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  nextBtnText: { ...Typography.h4, fontWeight: '700', color: C['bg-base'] },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { ...Typography.body, color: C['text-secondary'] },
  loginLink: { ...Typography.body, fontWeight: '700', color: C.primary },
});
