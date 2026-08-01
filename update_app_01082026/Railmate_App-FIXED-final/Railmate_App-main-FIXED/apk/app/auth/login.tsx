import React, { useMemo, useState } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet, Text, ImageBackground, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeSlash, EnvelopeSimple, ArrowRight, Globe, Lock } from 'phosphor-react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { usePrefsStore } from '../../stores/prefsStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

const logoImg = require('../../assets/images/logo.png');
const authBg = require('../../assets/images/auth-background.png');

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const { t, locale, setLocale } = useTranslation();
  const isBengali = locale === 'bn';
  const router = useRouter();
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const { setGuest } = useAuthStore();
  const { finishOnboarding } = usePrefsStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [authMode, setAuthMode]       = useState<AuthMode>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const toggleLanguage = () => setLocale(isBengali ? 'en' : 'bn');

  const validate = () => {
    if (!email.includes('@')) {
      return t('auth.invalid_email');
    }
    if (password.length < 6) {
      return t('passwordReset.errorPasswordLength');
    }
    if (authMode === 'signup' && password !== confirmPw) {
      return t('passwordReset.errorPasswordMismatch');
    }
    return null;
  };

  const handleContinue = async () => {
    const valErr = validate();
    if (valErr) { setError(valErr); return; }
    setError(null);
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        const { error: e } = await signInWithPassword(email, password);
        if (e) {
          const msg = e.toLowerCase();
          if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
            setError(t('passwordReset.errorInvalidOtp'));
          } else if (msg.includes('network') || msg.includes('fetch')) {
            setError(t('common.error'));
          } else {
            setError(t('error.generic'));
          }
          return;
        }
        finishOnboarding();
        router.replace('/(tabs)');
      } else {
        const { error: e, data } = await signUpWithPassword(email, password);
        if (e) {
          const msg = e.toLowerCase();
          if (msg.includes('already') || msg.includes('registered')) {
            setError(t('auth.email_exists'));
          } else {
            setError(e);
          }
          return;
        }
        // Supabase may require email confirmation — if session exists, go straight in
        if (data?.session) {
          finishOnboarding();
          router.replace('/auth/register' as any);
        } else {
          Alert.alert(
            t('auth.verify_email_title'),
            t('auth.verify_email_body'),
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/onboarding/forgot-password' as any);
  };

  const handleGuest = () => {
    setGuest(true);
    finishOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ScreenWrapper withPadding={false}>
      <ImageBackground source={authBg} style={{ flex: 1 }} resizeMode="cover">
        <View style={s.overlay} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.page, { paddingTop: insets.top + 16 }]}>

              {/* Language toggle */}
              <View style={s.topRow}>
                <Pressable onPress={toggleLanguage} style={s.langBtn}>
                  <Globe size={16} color={colors.primary} />
                  <Text style={[s.langText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                    {isBengali ? 'English' : 'বাংলা'}
                  </Text>
                </Pressable>
              </View>

              {/* Logo */}
              <View style={s.logoWrap}>
                <Image source={logoImg} style={s.logoImg} resizeMode="contain" />
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                  <Text style={[s.brand, { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' }]}>Rail</Text>
                  <Text style={[s.brand, { color: colors.primary }]}>Mate</Text>
                </View>
                <Text style={s.brandSub}>Bangladesh</Text>
              </View>

              {/* Login / Sign Up tabs */}
              <View style={s.authTabRow}>
                <Pressable
                  style={[s.authTab, authMode === 'login' && s.authTabActive]}
                  onPress={() => { setAuthMode('login'); setError(null); }}
                >
                  <Text style={[s.authTabText, authMode === 'login' && s.authTabTextActive, { fontFamily: 'Inter_600SemiBold' }]}>
                    {t('auth.login_tab')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.authTab, authMode === 'signup' && s.authTabActive]}
                  onPress={() => { setAuthMode('signup'); setError(null); }}
                >
                  <Text style={[s.authTabText, authMode === 'signup' && s.authTabTextActive, { fontFamily: 'Inter_600SemiBold' }]}>
                    {t('auth.signup_tab')}
                  </Text>
                </Pressable>
              </View>

              {/* Email */}
              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, { fontFamily: 'Inter_500Medium' }]}>{t('auth.email_label')}</Text>
                <View style={s.inputRow}>
                  <EnvelopeSimple size={18} color={colors['text-secondary']} style={s.inputIcon} />
                  <Input
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(null); }}
                    placeholder={isBengali ? 'আপনার@ইমেইল.কম' : 'your@email.com'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    isBengali={isBengali}
                    style={s.inputFlex}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, { fontFamily: 'Inter_500Medium' }]}>{t('auth.password_label')}</Text>
                <View style={s.inputRow}>
                  <Lock size={18} color={colors['text-secondary']} style={s.inputIcon} />
                  <Input
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    placeholder={t('auth.password_placeholder')}
                    secureTextEntry={!showPw}
                    isBengali={isBengali}
                    style={s.inputFlex}
                  />
                  <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                    {showPw
                      ? <EyeSlash size={18} color={colors['text-secondary']} />
                      : <Eye size={18} color={colors['text-secondary']} />
                    }
                  </Pressable>
                </View>
              </View>

              {/* Confirm password (signup only) */}
              {authMode === 'signup' && (
                <View style={s.inputGroup}>
                  <Text style={[s.inputLabel, { fontFamily: 'Inter_500Medium' }]}>{t('auth.confirm_password_label')}</Text>
                  <View style={s.inputRow}>
                    <Lock size={18} color={colors['text-secondary']} style={s.inputIcon} />
                    <Input
                      value={confirmPw}
                      onChangeText={(v) => { setConfirmPw(v); setError(null); }}
                      placeholder={t('auth.confirm_password_placeholder')}
                      secureTextEntry={!showConfirm}
                      isBengali={isBengali}
                      style={s.inputFlex}
                    />
                    <Pressable onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                      {showConfirm
                        ? <EyeSlash size={18} color={colors['text-secondary']} />
                        : <Eye size={18} color={colors['text-secondary']} />
                      }
                    </Pressable>
                  </View>
                </View>
              )}

              {!!error && <Text style={[s.errorText, { fontFamily: 'Inter_400Regular' }]}>{error}</Text>}

              {/* Forgot password (login mode only) */}
              {authMode === 'login' && (
                <Pressable onPress={handleForgotPassword} style={s.forgotBtn}>
                  <Text style={[s.forgotText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                    {t('passwordReset.forgotPassword')}
                  </Text>
                </Pressable>
              )}

              {/* CTA */}
              <View style={s.actions}>
                <Button
                  label={authMode === 'login' ? t('auth.login_btn') : t('auth.signup_btn')}
                  onPress={handleContinue}
                  loading={submitting}
                  icon={ArrowRight}
                  iconPosition="right"
                  size="lg"
                  isBengali={isBengali}
                  style={{ width: '100%' }}
                />

                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={[s.orText, { fontFamily: 'Inter_400Regular' }]}>{t('common.or')}</Text>
                  <View style={s.dividerLine} />
                </View>

                <Button
                  label={t('auth.guest')}
                  onPress={handleGuest}
                  variant="ghost"
                  size="lg"
                  isBengali={isBengali}
                  style={{ width: '100%' }}
                />
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </ScreenWrapper>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,13,23,0.30)' },
  page:             { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topRow:           { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  langBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
  langText:         { fontSize: 13 },
  logoWrap:         { alignItems: 'center', marginBottom: 28 },
  logoImg:          { width: 80, height: 80 },
  brand:            { fontSize: 26, lineHeight: 34 },
  brandSub:         { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  authTabRow:       { flexDirection: 'row', backgroundColor: colors['bg-card'], borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  authTab:          { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 9 },
  authTabActive:    { backgroundColor: colors.primary },
  authTabText:      { fontSize: 14, color: colors['text-secondary'] },
  authTabTextActive:{ color: '#FFFFFF' },
  inputGroup:       { marginBottom: 14 },
  inputLabel:       { fontSize: 12, color: colors['text-secondary'], marginBottom: 8 },
  inputRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors['bg-card'], borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 12, gap: 8 },
  inputIcon:        { flexShrink: 0 },
  inputFlex:        { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  eyeBtn:           { padding: 4 },
  errorText:        { color: colors.danger, fontSize: 12, marginBottom: 8 },
  forgotBtn:        { alignSelf: 'flex-end', marginBottom: 8, paddingVertical: 4 },
  forgotText:       { fontSize: 13 },
  actions:          { marginTop: 8 },
  divider:          { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: colors.border },
  orText:           { fontFamily: 'Inter_400Regular', color: colors['text-tertiary'], fontSize: 12, paddingHorizontal: 12 },
});
