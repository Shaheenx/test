import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'phosphor-react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { usePrefsStore } from '../../stores/prefsStore';
import { supabase } from '../../lib/supabase';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

export default function RegisterScreen() {
  const { t, locale } = useTranslation();
  const isBengali = locale === 'bn';
  const router = useRouter();
  const { register, user } = useAuth();
  const { finishOnboarding } = usePrefsStore();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [email, setEmail]             = useState(user?.email ?? '');
  const [avatarUri, setAvatarUri]     = useState<string | null>(user?.avatar_url ?? null);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fontFamily = isBengali
    ? { r: 'NotoSansBengali_400Regular', b: 'NotoSansBengali_600SemiBold' }
    : { r: 'Inter_400Regular', b: 'Inter_600SemiBold' };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('', t('auth.permission_message')); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]?.uri) setAvatarUri(res.assets[0].uri);
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      setUploading(true);
      const blob = await (await fetch(uri)).blob();
      const buf  = await new Response(blob).arrayBuffer();
      const path = `${user.id}/profile.jpg`;
      const { error: e } = await supabase.storage.from('avatars').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
      if (e) { setError(e.message); return null; }
      return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    } catch (ex) { setError(String(ex)); return null; }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!displayName.trim()) { setError(t('auth.name_required') || 'Name is required'); return; }
    setSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri && !avatarUri.startsWith('http')) {
        const u = await uploadAvatar(avatarUri); if (u) avatarUrl = u;
      } else if (avatarUri) avatarUrl = avatarUri;
      const { error: e } = await register(displayName.trim(), avatarUrl);
      if (e) { setError(e); setSubmitting(false); return; }
      // Defensive: guarantees the root layout guard never bounces the user
      // back to onboarding right after registration completes.
      finishOnboarding();
      router.replace('/(tabs)');
    } catch (ex) { setError(String(ex)); setSubmitting(false); }
  };

  return (
    <ScreenWrapper withPadding={false}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[s.page, { paddingTop: insets.top + 24 }]}>
          <Text style={[s.title, { fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('auth.register_title')}</Text>

          <Pressable onPress={pickImage} disabled={uploading} style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
                : <Camera size={32} color={colors['text-secondary']} />}
            </View>
            <Text style={[s.avatarLabel, { fontFamily: fontFamily.r, color: colors.primary }]}>{t('auth.add_photo')}</Text>
          </Pressable>

          <View style={{ marginBottom: 16 }}>
            <Text style={[s.label, { fontFamily: fontFamily.r }]}>{t('auth.display_name')}</Text>
            <Input value={displayName} onChangeText={setDisplayName} placeholder={t('auth.display_name_placeholder')} isBengali={isBengali} />
          </View>
          {!user?.email && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[s.label, { fontFamily: fontFamily.r }]}>{t('auth.email_optional')}</Text>
              <Input value={email} onChangeText={setEmail} placeholder={t('auth.email_placeholder')} keyboardType="email-address" autoCapitalize="none" isBengali={isBengali} />
            </View>
          )}
          {!!error && <Text style={[s.error, { fontFamily: fontFamily.r }]}>{error}</Text>}

          <View style={{ flex: 1, minHeight: 40 }} />
          <View style={{ width: '100%', marginBottom: 16 }}>
            <Button label={t('auth.create_account')} onPress={handleSubmit} loading={submitting || uploading} isBengali={isBengali} style={{ width: '100%' }} />
          </View>
          <Pressable onPress={() => router.replace('/(tabs)')} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={[s.skip, { fontFamily: fontFamily.r }]}>{t('auth.skip')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page:        { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  title:       { fontSize: 28, color: colors['text-primary'], lineHeight: 36, marginBottom: 32 },
  avatarWrap:  { alignSelf: 'center', alignItems: 'center', marginBottom: 32 },
  avatarCircle:{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors['bg-card'], borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarLabel: { fontSize: 13, marginTop: 8 },
  label:       { fontSize: 12, color: colors['text-secondary'], marginBottom: 8, marginLeft: 2 },
  error:       { color: colors.danger, fontSize: 12, marginBottom: 12 },
  skip:        { fontSize: 13, color: colors['text-secondary'] },
});
