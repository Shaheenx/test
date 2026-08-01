// app/profile-edit.tsx
import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'phosphor-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { base64ToUint8Array } from '../utils/base64';
import { compressImage } from '../utils/imageCompression';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar/Avatar';
import { logger } from '../lib/logger';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

// Decodes a JWT payload for local debugging only — never use this to
// "verify" a token; it does no signature check. Handles base64url (JWTs
// use '-'/'_' and no padding) and falls back to atob if Buffer isn't
// available in the RN runtime.
function decodeBase64Json(padded: string) {
  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    if (typeof atob !== 'undefined') {
	  return JSON.parse(atob(padded));
    }
    // @ts-ignore - atob exists on Hermes even without Buffer
    return JSON.parse(atob(padded));
  } catch (e) {
    logger.warn('JWT decode failed', { error: e });
    return null;
  }
}

export default function ProfileEditScreen() {
  const colors = useThemeColors();
  const C = colors;
  const pe = useMemo(() => createPe(colors), [colors]);
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const { data: s1 } = await supabase.auth.getSession();
    logger.log('after picker — session check', { expiresAt: s1.session?.expires_at, now: Math.floor(Date.now() / 1000) });

    const imageUri = result.assets[0].uri;
    setIsUploadingImage(true);

    try {
      const filePath = `${user?.id}/avatar.jpg`;

      // Resize + compress before touching FileSystem/base64 at all — smaller
      // input means less time spent reading/encoding too, not just a smaller upload.
      const compressedUri = await compressImage(imageUri);

      const fileInfo = await FileSystem.getInfoAsync(compressedUri);
      if (!fileInfo.exists) throw new Error('Selected photo not found');

      const base64 = await FileSystem.readAsStringAsync(compressedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteArray = base64ToUint8Array(base64);

      const { data: s2 } = await supabase.auth.getSession();
      logger.log('before upload — session check', { expiresAt: s2.session?.expires_at, now: Math.floor(Date.now() / 1000) });

      const token = s2.session?.access_token;
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          logger.log('JWT decoded', { role: payload.role, sub: payload.sub });
        } else {
          logger.warn('JWT present but could not be decoded — check token format');
        }
      } else {
        logger.warn('No access_token on session — request will hit Storage as anon');
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, byteArray, { contentType: 'image/jpeg', upsert: true });

      if (error) logger.error('avatar upload error', error);
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(freshUrl);

      const { data: savedUser, error: saveError } = await supabase
        .from('users')
        .update({ avatar_url: freshUrl })
        .eq('id', user?.id)
        .select()
        .single();

      if (saveError) throw saveError;
      if (savedUser) setUser(savedUser);

      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to upload photo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <SafeAreaView style={pe.root}>
      <View style={pe.header}>
        <TouchableOpacity style={pe.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={C['text-primary']} />
        </TouchableOpacity>
        <View>
          <Text style={pe.title}>Edit Profile</Text>
          <Text style={pe.subtitle}>Update your personal information</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pe.scroll}>
        <View style={pe.avatarSection}>
          <Avatar uri={avatarUrl} name={displayName || 'User'} size={100} />
          <TouchableOpacity
            style={pe.changePhotoBtn}
            onPress={handlePickImage}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <Text style={pe.changePhotoText}>Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={pe.card}>
          <Text style={pe.label}>Display Name *</Text>
          <TextInput
            style={pe.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={C['text-tertiary']}
            maxLength={50}
          />
        </View>

        <View style={pe.card}>
          <Text style={pe.label}>Phone Number</Text>
          <View style={pe.phoneRow}>
            <Text style={pe.phonePrefix}>+880</Text>
            <TextInput
              style={[pe.input, { flex: 1 }]}
              value={phone.replace('+880', '')}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '');
                setPhone(cleaned ? `+880${cleaned}` : '');
              }}
              placeholder="1712345678"
              placeholderTextColor={C['text-tertiary']}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <View style={pe.card}>
          <Text style={pe.label}>Email</Text>
          <Text style={pe.readonlyText}>{user?.email ?? 'Not set'}</Text>
          <Text style={pe.hint}>Email cannot be changed</Text>
        </View>

        <TouchableOpacity
          style={[pe.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={C['bg-base']} />
          ) : (
            <Text style={pe.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createPe = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'], width: '100%' },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-4'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  subtitle: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  avatarSection: { alignItems: 'center', gap: Spacing['space-3'], paddingVertical: Spacing['space-4'] },
  changePhotoBtn: { backgroundColor: C['primary-subtle'], borderRadius: Radius['radius-md'], paddingHorizontal: Spacing['space-4'], paddingVertical: Spacing['space-2'], borderWidth: 1, borderColor: C.primary, minWidth: 120, alignItems: 'center' },
  changePhotoText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  card: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-2'] },
  label: { ...Typography['body-sm'], fontWeight: '600', color: C['text-secondary'] },
  input: { backgroundColor: C['bg-overlay'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-3'], ...Typography.body, color: C['text-primary'] },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['space-2'] },
  phonePrefix: { ...Typography.body, fontWeight: '600', color: C['text-primary'], paddingHorizontal: Spacing['space-3'] },
  readonlyText: { ...Typography.body, color: C['text-secondary'], paddingVertical: Spacing['space-2'] },
  hint: { ...Typography.caption, color: C['text-tertiary'], marginTop: 2 },
  saveBtn: { backgroundColor: C.primary, borderRadius: Radius['radius-lg'], paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { ...Typography.h4, fontWeight: '700', color: C['bg-base'] },
});