import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, ImageSourcePropType, Linking, Image as RNImage,
} from 'react-native';
// TASK 1 FIX: this screen reads avatarUrl from the same store that
// profile-edit.tsx updates after a successful upload. That data flow was
// already correct — the break was in rendering. Core RN <Image> on Android
// can keep showing a previously-loaded bitmap for a URL it has already
// seen, even with the ?t=timestamp cache-buster already appended upstream.
// expo-image with cachePolicy="none" fixes that for the same reason it
// fixes it in components/ui/Avatar/Avatar.tsx — see that file for the full
// investigation notes. The app logo just above stays on RN's core Image
// (RNImage) since it's a static bundled asset, not user content, and
// caching it is fine.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell, Gear, Question, Info, Suitcase, BookmarkSimple, MapTrifold,
  CreditCard, ShieldCheck, ArrowRight, PencilSimple,
  SignOut, Crown,
} from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';
const logoImg: ImageSourcePropType = require('../../assets/images/logo.png');

export default function ProfileScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { user, isGuest, signOut, displayName, avatarUrl } = useAuth();
  const { data: profile } = useUserProfile();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login' as any);
        },
      },
    ]);
  };

  if (isGuest) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.guestWrap}>
          <Text style={s.guestTitle}>Create an account</Text>
          <Text style={s.guestSub}>Sign in to track your trips, save routes, and join the community.</Text>
          <Pressable style={s.guestBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={s.guestBtnText}>Sign In / Sign Up</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const trustScore = profile?.trust_score ?? 0;
  const trustLabel =
    trustScore >= 4.0 ? 'Trusted Traveler'
      : trustScore >= 2.5 ? 'Regular Traveler'
      : 'New Traveler';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header row */}
        <View style={s.topBar}>
          <View style={s.brandRow}>
            <View style={s.brandIcon}>
              <RNImage source={logoImg} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </View>
            <View>
              <Text style={s.brandName}>RailMate</Text>
              <Text style={s.brandSub}>Bangladesh</Text>
            </View>
          </View>
          <View style={s.topActions}>
            <Pressable style={s.iconBtn} onPress={() => router.push('/notifications' as any)}>
              <Bell size={20} color={C['text-primary']} />
            </Pressable>
            <Pressable style={s.iconBtn} onPress={() => router.push('/settings' as any)}>
              <Gear size={20} color={C['text-primary']} />
            </Pressable>
          </View>
        </View>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} cachePolicy="none" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarInitial}>
                  {(displayName || 'T').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable
              style={s.editAvatarBtn}
              onPress={() => router.push('/profile-edit' as any)}
            >
              <PencilSimple size={12} color={C['text-inverse']} weight="bold" />
            </Pressable>
          </View>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.profileName}>{displayName}</Text>
              {trustScore >= 4.0 && (
                <View style={s.verifiedDot}>
                  <Text style={{ fontSize: 12 }}>✓</Text>
                </View>
              )}
            </View>
            {user?.email ? (
              <Text style={s.profileContact}>{user.email}</Text>
            ) : null}
            {user?.phone ? (
              <Text style={s.profileContact}>{user.phone}</Text>
            ) : null}
            <Pressable style={s.trustBadge} onPress={() => router.push('/badges-reputation' as any)}>
              <Text style={s.trustIcon}>✦</Text>
              <Text style={s.trustLabel}>{trustLabel}</Text>
              <ArrowRight size={12} color={C.primary} />
            </Pressable>
          </View>

          {/* XP / level card */}
          <View style={s.xpCard}>
            <Crown size={14} color={C.primary} weight="fill" />
            <Text style={s.xpLevel}>{trustLabel}</Text>
            <View style={s.xpBar}>
              <View style={[s.xpFill, { width: `${Math.min((trustScore / 5) * 100, 100)}%` }]} />
            </View>
            <Text style={s.xpText}>{trustScore.toFixed(1)} / 5.0 Trust Score</Text>
          </View>
        </View>

        {/* Privacy banner */}
        <View style={s.privacyBanner}>
          <ShieldCheck size={22} color={C.primary} weight="fill" />
          <View style={{ flex: 1 }}>
            <Text style={s.privacyTitle}>আপনার তথ্য নিরাপদ এবং গোপনীয়</Text>
            <Text style={s.privacySub}>RailMate কখনই আপনার ব্যক্তিগত তথ্য শেয়ার করে না।</Text>
          </View>
          <Pressable onPress={() => router.push('/privacy' as any)}>
            <Text style={s.privacyLink}>View Privacy</Text>
          </Pressable>
        </View>

        {/* My Activity */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>My Activity</Text>
            <Pressable onPress={() => router.push('/coming-soon?feature=My+Activity' as any)}>
              <Text style={s.viewAll}>View All →</Text>
            </Pressable>
          </View>
          <View style={s.statsGrid}>
            <Pressable onPress={() => router.push('/coming-soon?feature=My+Activity' as any)}><StatTile icon="🚆" value={profile?.report_count ?? 0} label="Trips Completed" color="#4EA8E0" /></Pressable>
            <Pressable onPress={() => router.push('/coming-soon?feature=My+Activity' as any)}><StatTile icon="💬" value={profile?.report_count ?? 0} label="Reports Submitted" color={C.primary} /></Pressable>
            <Pressable onPress={() => router.push('/coming-soon?feature=My+Activity' as any)}><StatTile icon="⭐" value={profile?.helpful_vote_count ?? 0} label="Helpful Votes" color="#F5A623" /></Pressable>
            <Pressable onPress={() => router.push('/coming-soon?feature=My+Activity' as any)}><StatTile icon="🏅" value={0} label="Badges Earned" color="#9B59B6" /></Pressable>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          <MenuItem icon={<Suitcase size={20} color={C.primary} />} label="My Trips" sub="View and manage your trips" onPress={() => router.push('/coming-soon?feature=My+Trips' as any)} />
          <MenuItem icon={<BookmarkSimple size={20} color={C.primary} />} label="Saved Routes" sub="Your frequently used routes" onPress={() => router.push('/saved-routes' as any)} />
          <MenuItem icon={<Bell size={20} color={C.primary} />} label="Reminders & Alerts" sub="Manage your journey alerts" onPress={() => router.push('/notifications' as any)} />
          <MenuItem icon={<CreditCard size={20} color={C.primary} />} label="Payments & Tickets" sub="Book via Bangladesh Railway website" onPress={() => Linking.openURL('https://eticket.railway.gov.bd/')} />
          <MenuItem icon={<MapTrifold size={20} color={C.primary} />} label="Bookmarks" sub="Saved trains, stations and info" onPress={() => router.push('/coming-soon?feature=Bookmarks' as any)} />
          <MenuItem icon={<Gear size={20} color={C.primary} />} label="Settings" sub="App preferences and notifications" onPress={() => router.push('/settings' as any)} />
          <MenuItem icon={<Question size={20} color={C.primary} />} label="Help & Support" sub="FAQs, guides and contact support" onPress={() => router.push('/coming-soon?feature=Help+%26+Support' as any)} />
          <MenuItem icon={<Info size={20} color={C.primary} />} label="About RailMate" sub="Version 1.0.0" onPress={() => router.push('/coming-soon?feature=About+RailMate' as any)} last />
        </View>

        {/* Community CTA */}
        <View style={s.communityBanner}>
          <Text style={s.communityIcon}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.communityTitle}>Together, We Travel Better</Text>
            <Text style={s.communitySub}>Your updates help thousands of travelers every day.</Text>
          </View>
          <Pressable style={s.communityBtn} onPress={() => router.push('/(tabs)/community' as any)}>
            <Text style={s.communityBtnText}>Go to Community</Text>
            <ArrowRight size={14} color={C['text-inverse']} />
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable style={s.signOutBtn} onPress={handleSignOut}>
          <SignOut size={18} color={C.danger} />
          <Text style={s.signOutText}>Log Out</Text>
          <ArrowRight size={16} color={C.danger} />
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={s.statTile}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onPress: () => void;
  last?: boolean;
}

function MenuItem({ icon, label, sub, onPress, last }: MenuItemProps) {
  return (
    <Pressable
      style={[s.menuItem, !last && s.menuItemBorder]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
    >
      <View style={s.menuIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={s.menuSub}>{sub}</Text>
      </View>
      <ArrowRight size={16} color={C['text-tertiary']} />
    </Pressable>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: C['bg-base'] },
  scroll:         { paddingBottom: 20 },
  // Guest
  guestWrap:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  guestTitle:     { fontSize: 22, fontWeight: '700', color: C['text-primary'], textAlign: 'center' },
  guestSub:       { fontSize: 14, color: C['text-secondary'], textAlign: 'center', lineHeight: 22 },
  guestBtn:       { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  guestBtnText:   { fontSize: 15, fontWeight: '700', color: C['text-inverse'] },
  // Top bar
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  brandRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon:      { width: 44, height: 44, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  brandIconText:  { fontSize: 18 },
  brandName:      { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  brandSub:       { fontSize: 11, color: C.primary },
  topActions:     { flexDirection: 'row', gap: 8 },
  iconBtn:        { width: 36, height: 36, backgroundColor: C['bg-card'], borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  // Profile card
  profileCard:    { marginHorizontal: 16, backgroundColor: C['bg-card'], borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: C.primary },
  avatarFallback: { backgroundColor: C['bg-overlay'], alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 28, fontWeight: '700', color: C['text-primary'] },
  editAvatarBtn:  { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, backgroundColor: C.primary, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C['bg-card'] },
  profileInfo:    { flex: 1, gap: 3 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName:    { fontSize: 17, fontWeight: '700', color: C['text-primary'] },
  verifiedDot:    { width: 18, height: 18, backgroundColor: C.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  profileContact: { fontSize: 12, color: C['text-secondary'] },
  trustBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,168,89,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4 },
  trustIcon:      { fontSize: 10, color: C.primary },
  trustLabel:     { fontSize: 11, fontWeight: '600', color: C.primary },
  xpCard:         { backgroundColor: C['bg-overlay'], borderRadius: 12, padding: 10, minWidth: 90, alignItems: 'center', gap: 2 },
  xpLevel:        { fontSize: 12, fontWeight: '700', color: C.primary },
  xpSub:          { fontSize: 10, color: C['text-secondary'] },
  xpBar:          { width: '100%', height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  xpFill:         { height: 4, backgroundColor: C.primary, borderRadius: 2 },
  xpText:         { fontSize: 9, color: C['text-secondary'] },
  // Privacy banner
  privacyBanner:  { marginHorizontal: 16, backgroundColor: 'rgba(0,168,89,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,168,89,0.2)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  privacyTitle:   { fontSize: 13, fontWeight: '600', color: C['text-primary'], marginBottom: 2 },
  privacySub:     { fontSize: 11, color: C['text-secondary'] },
  privacyLink:    { fontSize: 11, fontWeight: '600', color: C.primary },
  // My Activity
  section:        { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  viewAll:        { fontSize: 13, color: C.primary },
  statsGrid:      { flexDirection: 'row', gap: 8 },
  statTile:       { flex: 1, backgroundColor: C['bg-card'], borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 2 },
  statValue:      { fontSize: 22, fontWeight: '700' },
  statLabel:      { fontSize: 10, color: C['text-secondary'], textAlign: 'center' },
  // Menu
  menuCard:       { marginHorizontal: 16, backgroundColor: C['bg-card'], borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIconWrap:   { width: 36, height: 36, backgroundColor: 'rgba(0,168,89,0.1)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel:      { fontSize: 14, fontWeight: '600', color: C['text-primary'] },
  menuSub:        { fontSize: 11, color: C['text-secondary'], marginTop: 1 },
  // Community banner
  communityBanner:{ marginHorizontal: 16, backgroundColor: 'rgba(0,168,89,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,168,89,0.2)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  communityIcon:  { fontSize: 32 },
  communityTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 2 },
  communitySub:   { fontSize: 11, color: C['text-secondary'] },
  communityBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  communityBtnText:{ fontSize: 12, fontWeight: '700', color: C['text-inverse'] },
  // Sign out
  signOutBtn:     { marginHorizontal: 16, backgroundColor: 'rgba(232,57,75,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,57,75,0.2)', paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  signOutText:    { flex: 1, fontSize: 14, fontWeight: '600', color: C.danger },
});
