import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, User } from 'phosphor-react-native';
import { useAuthStore } from '../../stores/authStore';
import { usePrefsStore } from '../../stores/prefsStore';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

let getStartedBg: any = null;
try { getStartedBg = require('../../assets/images/get_started.jpg'); } catch { /* no asset */ }

const PRIMARY = '#00A859';

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const { setGuest } = useAuthStore();
  const { finishOnboarding } = usePrefsStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(colors), [colors]);

  const handleGuest = () => { setGuest(true); finishOnboarding(); router.replace('/(tabs)'); };

  // Phone/Google must also mark onboarding as finished before leaving this
  // screen — otherwise the root layout guard sees hasFinishedOnboarding still
  // false and bounces the user straight back to /onboarding/welcome right
  // after they complete OTP verification or registration.
  const handlePhoneOrGoogle = () => {
    finishOnboarding();
    router.push('/auth');
  };

  return (
    <ImageBackground
      source={getStartedBg ?? undefined}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Dark overlay so content stays readable over photo */}
      <View style={[s.overlay, getStartedBg ? { backgroundColor: 'rgba(8,13,23,0.72)' } : { backgroundColor: 'transparent' }]} />
    <View style={[s.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={s.content}>
        <Text style={s.title}>Get Started</Text>
        <Text style={s.sub}>Join thousands of smart travelers.</Text>

        <View style={s.statsRow}>
          {[['50K+', 'Travelers'], ['98%', 'Accuracy'], ['4.8★', 'Rating']].map(([val, label]) => (
            <View key={label} style={s.stat}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Pressable style={s.phoneBtn} onPress={handlePhoneOrGoogle}>
          <Phone size={20} color="#fff" weight="fill" />
          <Text style={s.phoneText}>Continue with Phone or Email</Text>
        </Pressable>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <Pressable style={s.guestBtn} onPress={handleGuest}>
          <User size={18} color={colors['text-secondary']} />
          <Text style={s.guestText}>Browse as Guest</Text>
        </Pressable>

        {/* Forgot password link */}
        <Pressable style={s.forgotBtn} onPress={() => router.push('/onboarding/forgot-password' as any)}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </Pressable>
      </View>

      <Text style={s.terms}>
        By continuing you agree to our <Text style={{ color: PRIMARY }}>Terms of Service</Text>{' '}and{' '}<Text style={{ color: PRIMARY }}>Privacy Policy</Text>
      </Text>
    </View>
    </ImageBackground>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  root:       { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 24 },
  content:    { flex: 1 },
  title:      { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: colors['text-primary'], marginBottom: 12 },
  sub:        { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors['text-secondary'], marginBottom: 40 },
  statsRow:   { flexDirection: 'row', backgroundColor: colors['bg-card'], borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 40 },
  stat:       { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statVal:    { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: PRIMARY },
  statLabel:  { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors['text-secondary'], marginTop: 4 },
  phoneBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 18, marginBottom: 24 },
  phoneText:  { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  divider:    { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: colors.border },
  dividerText:{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors['text-tertiary'], paddingHorizontal: 16 },
  guestBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  guestText:  { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors['text-secondary'] },
  terms:      { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors['text-tertiary'], textAlign: 'center', lineHeight: 20 },
  forgotBtn:  { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  forgotText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: PRIMARY },
});
