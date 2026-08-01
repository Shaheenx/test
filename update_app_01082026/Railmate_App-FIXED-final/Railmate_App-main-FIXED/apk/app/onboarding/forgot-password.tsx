import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useTranslation } from '../../i18n';
import {
  useRequestPasswordReset,
  useVerifyResetOtp,
  useUpdatePasswordAfterReset,
} from '../../hooks/usePasswordReset';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const { t, isBengali } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestReset = useRequestPasswordReset();
  const verifyOtp = useVerifyResetOtp();
  const updatePassword = useUpdatePasswordAfterReset();

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendCode = async () => {
    setErrorMessage(null);
    if (!isValidEmail(email)) {
      setErrorMessage(t('passwordReset.errorInvalidEmail'));
      return;
    }
    try {
      await requestReset.mutateAsync(email);
      startCooldown();
      setStep('otp');
    } catch (err: any) {
      setErrorMessage(err?.message || t('passwordReset.errorGeneric'));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage(null);
    try {
      await requestReset.mutateAsync(email);
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err?.message || t('passwordReset.errorGeneric'));
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (otp.trim().length !== 6) {
      setErrorMessage(t('passwordReset.errorInvalidOtp'));
      return;
    }
    try {
      await verifyOtp.mutateAsync({ email, token: otp.trim() });
      setStep('newPassword');
    } catch (err: any) {
      setErrorMessage(err?.message || t('passwordReset.errorInvalidOtp'));
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    if (newPassword.length < 8) {
      setErrorMessage(t('passwordReset.errorPasswordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t('passwordReset.errorPasswordMismatch'));
      return;
    }
    try {
      await updatePassword.mutateAsync(newPassword);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || t('passwordReset.errorGeneric'));
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={C['text-primary']} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isBengali ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step indicator */}
          <View style={s.stepRow}>
            {(['email', 'otp', 'newPassword', 'success'] as Step[]).map((st, i) => (
              <View key={st} style={[s.stepDot,
                step === st && s.stepDotActive,
                (['email', 'otp', 'newPassword', 'success'].indexOf(step) > i) && s.stepDotDone,
              ]} />
            ))}
          </View>

          {step === 'email' && (
            <>
              <Text style={s.title}>{t('passwordReset.forgotTitle')}</Text>
              <Text style={s.subtitle}>{t('passwordReset.forgotSubtitle')}</Text>

              <Text style={s.label}>{t('passwordReset.emailLabel')}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('passwordReset.emailPlaceholder')}
                placeholderTextColor={C['text-tertiary']}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {errorMessage ? <Text style={s.error}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[s.button, requestReset.isPending && s.buttonDisabled]}
                onPress={handleSendCode}
                disabled={requestReset.isPending}
              >
                {requestReset.isPending ? (
                  <ActivityIndicator color={C['text-inverse']} />
                ) : (
                  <Text style={s.buttonText}>{t('passwordReset.sendCodeButton')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={s.title}>{t('passwordReset.verifyTitle')}</Text>
              <Text style={s.subtitle}>{t('passwordReset.verifySubtitle', { email })}</Text>

              <Text style={s.label}>{t('passwordReset.codeLabel')}</Text>
              <TextInput
                style={[s.input, s.otpInput]}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={C['text-tertiary']}
                keyboardType="number-pad"
                maxLength={6}
              />

              {errorMessage ? <Text style={s.error}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[s.button, verifyOtp.isPending && s.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={verifyOtp.isPending}
              >
                {verifyOtp.isPending ? (
                  <ActivityIndicator color={C['text-inverse']} />
                ) : (
                  <Text style={s.buttonText}>{t('passwordReset.verifyButton')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} disabled={cooldown > 0} style={s.ghostButton}>
                <Text style={[s.ghostButtonText, cooldown > 0 && { color: C['text-tertiary'] }]}>
                  {cooldown > 0
                    ? t('passwordReset.resendIn', { seconds: String(cooldown) })
                    : t('passwordReset.resendCode')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('email')} style={s.ghostButton}>
                <Text style={s.ghostButtonTextSecondary}>{email}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <Text style={s.title}>{t('passwordReset.resetTitle')}</Text>
              <Text style={s.subtitle}>{t('passwordReset.resetSubtitle')}</Text>

              <Text style={s.label}>{t('passwordReset.newPasswordLabel')}</Text>
              <TextInput
                style={s.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor={C['text-tertiary']}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={s.label}>{t('passwordReset.confirmPasswordLabel')}</Text>
              <TextInput
                style={s.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={C['text-tertiary']}
                secureTextEntry
                autoCapitalize="none"
              />

              {errorMessage ? <Text style={s.error}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[s.button, updatePassword.isPending && s.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={updatePassword.isPending}
              >
                {updatePassword.isPending ? (
                  <ActivityIndicator color={C['text-inverse']} />
                ) : (
                  <Text style={s.buttonText}>{t('passwordReset.resetButton')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Text style={{ fontSize: 40 }}>✓</Text>
              </View>
              <Text style={s.title}>{t('passwordReset.successMessage')}</Text>
              <TouchableOpacity style={s.button} onPress={handleContinue}>
                <Text style={s.buttonText}>
                  {isBengali ? 'চালিয়ে যান' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step !== 'success' && (
            <TouchableOpacity onPress={() => router.back()} style={s.ghostButton}>
              <Text style={s.ghostButtonTextSecondary}>{t('passwordReset.backToLogin')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: C['bg-base'] },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:       { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  stepRow:       { flexDirection: 'row', gap: 8, marginBottom: 32, justifyContent: 'center' },
  stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  stepDotActive: { width: 24, backgroundColor: C.primary, borderRadius: 4 },
  stepDotDone:   { backgroundColor: C['primary-dim'] },
  container:     { flexGrow: 1, padding: 24 },
  title:         { fontSize: 24, fontWeight: '700', color: C['text-primary'], marginBottom: 8 },
  subtitle:      { fontSize: 14, color: C['text-secondary'], marginBottom: 24, lineHeight: 22 },
  label:         { fontSize: 14, fontWeight: '500', color: C['text-secondary'], marginBottom: 8 },
  input:         { height: 50, backgroundColor: C['bg-card'], borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: C['text-primary'], marginBottom: 16 },
  otpInput:      { fontSize: 22, letterSpacing: 10, textAlign: 'center' },
  error:         { color: C.danger, fontSize: 13, marginBottom: 12 },
  button:        { height: 50, backgroundColor: C.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled:{ opacity: 0.6 },
  buttonText:    { color: C['text-inverse'], fontSize: 15, fontWeight: '700' },
  ghostButton:   { marginTop: 20, alignItems: 'center' },
  ghostButtonText:          { color: C.primary, fontSize: 14, fontWeight: '600' },
  ghostButtonTextSecondary: { color: C['text-secondary'], fontSize: 14 },
  successWrap:   { alignItems: 'center', gap: 16, paddingTop: 40 },
  successIcon:   { width: 80, height: 80, backgroundColor: 'rgba(0,168,89,0.1)', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});
