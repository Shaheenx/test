import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { usePrefsStore } from '../../stores/prefsStore';
import { useAuthStore } from '../../stores/authStore';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button/Button';
import { Spacing } from '../../constants/spacing';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

export default function AuthScreen() {
  const colors = useThemeColors();
  const C = colors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { signInWithPhone, signInWithEmail } = useAuth();
  const { hasFinishedOnboarding, finishOnboarding } = usePrefsStore();
  const { setGuest } = useAuthStore();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'phone') {
        const { error: phoneError } = await signInWithPhone(input);
        if (phoneError) {
          setError(phoneError);
        } else {
          router.push({ pathname: '/auth/verify', params: { contact: input, type: 'phone' } } as any);
        }
      } else {
        const { error: emailError } = await signInWithEmail(input);
        if (emailError) {
          setError(emailError);
        } else {
          setError(null);
          // Show success message for email
          alert('Check your email for the sign-in link');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (!hasFinishedOnboarding) {
      // Reached from onboarding (via /onboarding/auth) — there's nothing
      // meaningful to "go back" to. Finish onboarding and enter the app,
      // same as the guest path on the other two auth screens.
      setGuest(true);
      finishOnboarding();
      router.replace('/(tabs)' as any);
    } else {
      // Reached mid-app from a sign-in-required prompt — just dismiss it.
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <AppText variant="displayMd" style={styles.title}>Welcome</AppText>
          <AppText variant="body" color={C['text-secondary']} style={styles.subtitle}>
            Sign in to access all features
          </AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="label" style={styles.label}>
            {mode === 'phone' ? 'Phone Number' : 'Email Address'}
          </AppText>
          <TextInput
            style={styles.input}
            placeholder={mode === 'phone' ? '+880 1712345678' : 'your@email.com'}
            placeholderTextColor={C['text-tertiary']}
            value={input}
            onChangeText={setInput}
            keyboardType={mode === 'phone' ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <AppText variant="caption" color={C.danger} style={styles.error}>
              {error}
            </AppText>
          )}

          <Button
            variant="primary"
            size="lg"
            label={loading ? 'Sending...' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            disabled={!input || loading}
            fullWidth
            style={styles.button}
          />

          <Button
            variant="ghost"
            size="md"
            label={mode === 'phone' ? 'Continue with Email' : 'Continue with Phone'}
            onPress={() => {
              setMode(mode === 'phone' ? 'email' : 'phone');
              setInput('');
              setError(null);
            }}
            fullWidth
          />

          <Button
            variant="ghost"
            size="md"
            label="Continue as Guest"
            onPress={handleGuest}
            fullWidth
            style={styles.guestButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (C: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C['bg-base'],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['space-6'],
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['space-8'],
  },
  title: {
    marginBottom: Spacing['space-2'],
  },
  subtitle: {
    marginBottom: Spacing['space-1'],
  },
  form: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing['space-2'],
  },
  input: {
    backgroundColor: C['bg-card'],
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    padding: Spacing['space-4'],
    color: C['text-primary'],
    fontSize: 16,
    marginBottom: Spacing['space-4'],
  },
  error: {
    marginBottom: Spacing['space-4'],
  },
  button: {
    marginBottom: Spacing['space-4'],
  },
  guestButton: {
    marginTop: Spacing['space-5'],
  },
});
