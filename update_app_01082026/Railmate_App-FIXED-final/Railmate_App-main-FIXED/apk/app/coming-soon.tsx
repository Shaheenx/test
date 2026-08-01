import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Rocket } from 'phosphor-react-native';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');
// Sized past the screen diagonal so the rotated band clears both corners —
// fixed angle, not per-device trig, this is a placeholder screen, not worth the precision.
const RIBBON_WIDTH = Math.sqrt(width ** 2 + height ** 2) * 1.3;

export default function ComingSoonScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  // Defensive: some nav calls encode spaces as "+" (form-encoding convention),
  // which query parsers do NOT auto-decode. Handle it here regardless of caller.
  const featureName = (feature ?? 'This feature').replace(/\+/g, ' ');

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Diagonal watermark — sits behind header + body, bottom-right to top-left */}
      <View style={s.watermarkClip} pointerEvents="none">
        <View style={s.watermarkBand}>
          <Text style={s.watermarkText} numberOfLines={1}>
            {Array.from({ length: 6 }).map(() => 'COMING SOON').join('   •   ')}
          </Text>
        </View>
      </View>

      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={C['text-primary']} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{featureName}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Rocket size={48} color={C.primary} weight="fill" />
        </View>
        <Text style={s.title}>Coming Soon</Text>
        <Text style={s.sub}>
          {featureName} is under development and will be available in an upcoming update.
        </Text>
        <Pressable style={s.btn} onPress={() => router.back()}>
          <Text style={s.btnText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:      { flex: 1, backgroundColor: C['bg-base'] },

  watermarkClip: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermarkBand: {
    width: RIBBON_WIDTH,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    transform: [{ rotate: '-35deg' }],
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    color: C['text-secondary'],
    textTransform: 'uppercase',
    opacity: 0.35,
  },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:   { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '700', color: C['text-primary'], flex: 1, textAlign: 'center', marginHorizontal: 8 },
  body:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  iconWrap:  { width: 88, height: 88, backgroundColor: 'rgba(0,168,89,0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: '700', color: C['text-primary'] },
  sub:       { fontSize: 15, color: C['text-secondary'], textAlign: 'center', lineHeight: 24 },
  btn:       { marginTop: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText:   { fontSize: 15, fontWeight: '700', color: C['text-inverse'] },
});