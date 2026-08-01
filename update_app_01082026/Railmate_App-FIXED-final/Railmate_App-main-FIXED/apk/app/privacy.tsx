// app/privacy.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, ArrowSquareOut } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useTranslation } from '../i18n';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

const PRIVACY_POLICY_URL = 'https://privacy.railmatebd.com';

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={C['text-primary']} weight="regular" />
        </TouchableOpacity>
        <Text style={s.title}>{t('privacy.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.body}>
        <View style={s.iconCircle}>
          <ShieldCheck size={32} color={C.primary} weight="regular" />
        </View>
        <Text style={s.heading}>{t('privacy.heading')}</Text>
        <Text style={s.description}>{t('privacy.description')}</Text>

        <TouchableOpacity
          style={s.openBtn}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        >
          <Text style={s.openBtnText}>{t('privacy.open_policy')}</Text>
          <ArrowSquareOut size={16} color={C['bg-base']} weight="regular" />
        </TouchableOpacity>

        <Text style={s.urlHint}>{PRIVACY_POLICY_URL}</Text>
      </View>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['space-5'],
    paddingVertical: Spacing['space-3'],
  },
  backBtn: {
    width: 32, height: 32,
    backgroundColor: C['bg-overlay'],
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['space-8'],
    gap: Spacing['space-3'],
  },
  iconCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: C['primary-subtle'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['space-2'],
  },
  heading: {
    ...Typography.h2,
    color: C['text-primary'],
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: C['text-secondary'],
    textAlign: 'center',
    lineHeight: 22,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['space-2'],
    backgroundColor: C.primary,
    borderRadius: Radius['radius-md'],
    paddingHorizontal: Spacing['space-6'],
    paddingVertical: Spacing['space-3'],
    marginTop: Spacing['space-4'],
  },
  openBtnText: {
    ...Typography.body,
    fontWeight: '700',
    color: C['bg-base'],
  },
  urlHint: {
    ...Typography.caption,
    color: C['text-tertiary'],
    marginTop: Spacing['space-2'],
  },
});
