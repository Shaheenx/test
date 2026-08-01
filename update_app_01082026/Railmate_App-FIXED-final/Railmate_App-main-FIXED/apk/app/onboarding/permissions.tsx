import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellSimple, MapPin, CheckCircle, Circle } from 'phosphor-react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

const PRIMARY = '#00A859';

export default function PermissionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [notifGranted, setNotifGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [_loading, setLoading] = useState(false);

  const handleNotifications = async () => {
    // Was setNotifGranted(true) with zero API call — the checkmark was always
    // fake regardless of actual OS permission state. This is the real prompt.
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let granted = existingStatus === 'granted';
    if (!granted) {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    }
    setNotifGranted(granted);
  };

  const handleContinue = async () => {
    setLoading(true);
    if (!notifGranted) await handleNotifications();
    setLoading(false);
    router.push('/onboarding/auth');
  };

  return (
    <View style={s.root}>
      <View style={[s.content, { paddingTop: insets.top + 32 }]}>
        <View style={s.topIcon}><BellSimple size={48} color={PRIMARY} weight="duotone" /></View>
        <Text style={s.title}>Stay Informed</Text>
        <Text style={s.sub}>Enable these to get the most out of RailMate.</Text>

        <Pressable style={s.permCard} onPress={handleNotifications}>
          <View style={[s.permIcon, { backgroundColor: 'rgba(0,168,89,0.12)' }]}>
            <BellSimple size={24} color={PRIMARY} weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.permTitle}>Journey Alerts & Delays</Text>
            <Text style={s.permDesc}>Get notified before departure and when delays are reported.</Text>
          </View>
          {notifGranted ? <CheckCircle size={24} color={PRIMARY} weight="fill" /> : <Circle size={24} color={colors['border-strong']} />}
        </Pressable>

        <Pressable style={s.permCard} onPress={async () => {
          const { status } = await Location.requestForegroundPermissionsAsync();
          setLocationGranted(status === 'granted');
        }}>
          <View style={[s.permIcon, { backgroundColor: 'rgba(78,168,224,0.12)' }]}>
            <MapPin size={24} color="#4EA8E0" weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.permTitle}>Nearby Stations</Text>
            <Text style={s.permDesc}>Optional — find stations near you instantly.</Text>
          </View>
          {locationGranted
            ? <CheckCircle size={24} color={PRIMARY} weight="fill" />
            : <View style={s.optionalBadge}><Text style={s.optionalText}>Optional</Text></View>}
        </Pressable>
      </View>

      {/* Pagination dots — slide 5 of 5 */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, paddingBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === 4 ? 22 : 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: i === 4 ? '#00A859' : colors['border'],
            }}
          />
        ))}
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={s.allowBtn} onPress={handleContinue}>
          <Text style={s.allowText}>{notifGranted ? 'Continue' : 'Allow Notifications'}</Text>
        </Pressable>
        <Pressable style={s.laterBtn} onPress={() => router.push('/onboarding/auth')}>
          <Text style={s.laterText}>Maybe Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors['bg-base'], paddingHorizontal: 24 },
  content:      { flex: 1 },
  topIcon:      { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(0,168,89,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title:        { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: colors['text-primary'], marginBottom: 12 },
  sub:          { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors['text-secondary'], marginBottom: 40, lineHeight: 26 },
  permCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors['bg-card'], borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14, gap: 16 },
  permIcon:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  permTitle:    { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors['text-primary'], marginBottom: 4 },
  permDesc:     { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors['text-secondary'], lineHeight: 20 },
  optionalBadge:{ backgroundColor: colors.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  optionalText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors['text-tertiary'] },
  footer:       { gap: 12 },
  allowBtn:     { backgroundColor: '#00A859', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  allowText:    { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#fff' },
  laterBtn:     { alignItems: 'center', paddingVertical: 14 },
  laterText:    { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors['text-tertiary'] },
});
