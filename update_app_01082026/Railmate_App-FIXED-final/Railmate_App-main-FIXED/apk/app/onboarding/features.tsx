// app/onboarding/features.tsx
import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, ScrollView, ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'phosphor-react-native';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from '../../i18n';

const { width } = Dimensions.get('window');
const PRIMARY = '#00A859';

const SLIDES_EN = [
  { image: require('../../assets/images/onboarding-1.png'), title: 'Search & Plan', desc: 'Find trains, schedules and fares instantly.' },
  { image: require('../../assets/images/onboarding-2.png'), title: 'Community Intelligence', desc: 'Passengers helping passengers travel smarter.' },
  { image: require('../../assets/images/onboarding-3.png'), title: 'Smart Alerts', desc: 'Never miss important journey updates.' },
];

const SLIDES_BN = [
  { image: require('../../assets/images/onboarding-1.png'), title: 'খুঁজুন ও পরিকল্পনা করুন', desc: 'তাৎক্ষণিকভাবে ট্রেন, সময়সূচি ও ভাড়া খুঁজুন।' },
  { image: require('../../assets/images/onboarding-2.png'), title: 'কমিউনিটি ইন্টেলিজেন্স', desc: 'যাত্রীরা যাত্রীদের সাহায্য করে স্মার্টভাবে যাত্রা করতে।' },
  { image: require('../../assets/images/onboarding-3.png'), title: 'স্মার্ট অ্যালার্ট', desc: 'গুরুত্বপূর্ণ যাত্রা আপডেট কখনো মিস করবেন না।' },
];

const TOTAL_SLIDES = 5;
const FEATURE_START_IDX = 1;

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { isBengali } = useTranslation();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const SLIDES = isBengali ? SLIDES_BN : SLIDES_EN;

  const handleScroll = (e: any) =>
    setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width));

  const handleNext = () => {
    if (activeIdx < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIdx + 1) * width, animated: true });
    } else {
      router.push('/onboarding/permissions' as any);
    }
  };

  const globalDotIdx = FEATURE_START_IDX + activeIdx;

  return (
    <View style={s.root}>
      <Pressable
        style={[s.skip, { top: insets.top + 12 }]}
        onPress={() => router.push('/onboarding/auth' as any)}
      >
        <Text style={s.skipText}>{isBengali ? 'এড়িয়ে যান' : 'Skip'}</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map(({ image, title, desc }, i) => (
          <ImageBackground key={i} source={image} style={[s.slide, { width }]} resizeMode="contain">
            {/* One consistent vignette for every slide. Dark top (skip button
                legibility) and dark bottom (text legibility), clear middle so
                the actual photo shows through — no per-slide special casing. */}
            <LinearGradient
              colors={[
                'rgba(8,13,23,0.65)',
                'rgba(8,13,23,0.05)',
                'rgba(8,13,23,0.05)',
                'rgba(8,13,23,0.85)',
              ]}
              locations={[0, 0.32, 0.55, 1]}
              style={s.gradientFill}
              pointerEvents="none"
            />
            <View style={s.slideContent}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.desc}>{desc}</Text>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      {/* Global 5-dot pagination */}
      <View style={s.dots}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === globalDotIdx && s.dotActive]}
          />
        ))}
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextText}>
            {activeIdx === SLIDES.length - 1
              ? (isBengali ? 'চালিয়ে যান' : 'Continue')
              : (isBengali ? 'পরবর্তী' : 'Next')}
          </Text>
          <ArrowRight size={18} color="#fff" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: '#080D17' },
    skip:    { position: 'absolute', right: 24, zIndex: 10 },
    skipText:{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors['text-tertiary'] },

    slide:        { flex: 1, justifyContent: 'flex-end' },
    // explicit inset object, not StyleSheet.absoluteFillObject — that caused
    // a TS error last round when spread into this style array, deliberately avoided here
    gradientFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    slideContent: { paddingHorizontal: 36, paddingBottom: 32, gap: 12 },
    title:   {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 30, color: '#FFFFFF',
      textAlign: 'center',
    },
    desc:    {
      fontFamily: 'Inter_400Regular',
      fontSize: 17, lineHeight: 28, color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
    },

    dots:    { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingVertical: 20 },
    dot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors['border'] },
    dotActive:{ width: 22, backgroundColor: PRIMARY, borderRadius: 3.5 },

    footer:  { paddingHorizontal: 24 },
    nextBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, backgroundColor: PRIMARY, borderRadius: 56, paddingVertical: 17,
    },
    nextText:{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  });