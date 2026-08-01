import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ImageBackground, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MagnifyingGlass, Bell, ArrowsLeftRight, ChartLineUp, Notebook, BellSimple,
  Info, Train, Calculator, MapPin, CalendarBlank, Clock, Users,
} from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSavedRoutes } from '../../hooks/useSavedRoutes';
import { useCommunityReports } from '../../hooks/useCommunityReports';
import { useSearchStore } from '../../stores/searchStore';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

let heroBackground: any = null;
try { heroBackground = require('../../assets/images/home.webp'); } catch { /* no hero image */ }
const logoImg = require('../../assets/images/logo.png');

export default function HomeScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const QUICK_ACTIONS = useMemo(() => getQuickActions(colors), [colors]);
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { fromStation, toStation, date, setFromStation, setToStation, swapStations } = useSearchStore();
  const { savedRoutes, loading: routesLoading } = useSavedRoutes();
  const { data: liveUpdates = [], isLoading: updatesLoading } = useCommunityReports(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingName = isGuest ? 'Guest Traveller' : (user?.display_name?.trim() || 'Traveler');

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const displayDate = date
    ? new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
    : `Today, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;

  const handleSearch = () => {
    if (!fromStation || !toStation) {
      router.push('/(tabs)/search' as any);
      return;
    }
    // Was routing to /search-results (direct-only). Journey Planner covers
    // direct trips plus 1- and 2-transfer connections, so it's a strict
    // superset — this is the "search train replaced with journey planner"
    // swap. Journey Planner has its own station pickers and doesn't accept
    // params yet, so the From/To picked here don't carry over — known,
    // minor UX gap, not silently dropped.
    router.push('/journey-planner' as any);
  };

  const getStatusStyle = (type: string) => {
    if (type === 'DELAY') return { color: C.danger, label: 'min delay reported' };
    if (type === 'CROWD') return { color: '#F5A623', label: 'Crowding High' };
    return { color: C.primary, label: 'Running On Time' };
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Hero Banner */}
        <ImageBackground
          source={heroBackground ?? undefined}
          style={s.hero}
          imageStyle={s.heroImage}
        >
          <View style={s.heroOverlay}>
            {/* Brand row */}
            <View style={s.heroTopBar}>
              <View style={s.brandRow}>
                <View style={s.brandIconWrap}>
                  <Image source={logoImg} style={{ width: 50, height: 50 }} resizeMode="contain" />
                </View>
                <View>
                  <Text style={s.brandLine}>
                    <Text style={s.brandRail}>Rail</Text>
                    <Text style={s.brandMate}>Mate</Text>
                  </Text>
                  <Text style={s.brandSub}>Bangladesh</Text>
                </View>
              </View>
              <Pressable
                style={s.notifBtn}
                onPress={() => router.push('/notifications' as any)}
              >
                <Bell size={20} color={C['text-primary']} />
                <View style={s.notifBadge}><Text style={s.notifBadgeText}>3</Text></View>
              </Pressable>
            </View>

            {/* Greeting */}
            <View style={s.greetingBlock}>
              <Text style={s.greetingTop}>{greeting},</Text>
              <Text style={s.greetingName}>{greetingName} 👋</Text>
              <Text style={s.greetingDate}>{today}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Search Card */}
        <View style={s.searchCard}>
          {/* From */}
          <Pressable style={s.stationRow} onPress={() => router.push('/(tabs)/search' as any)}>
            <MapPin size={18} color={C.primary} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={s.stationLabel}>From</Text>
              <Text style={[s.stationValue, !fromStation && s.stationPlaceholder]}>
                {fromStation ? fromStation.name_en : 'Select departure station'}
              </Text>
              {fromStation?.name_bn ? <Text style={s.stationBn}>{fromStation.name_bn}</Text> : null}
            </View>
            {fromStation && (
              <Pressable onPress={() => setFromStation(null)}>
                <Text style={s.clearX}>✕</Text>
              </Pressable>
            )}
          </Pressable>

          {/* Swap button */}
          <View style={s.swapRow}>
            <View style={s.dividerLine} />
            <Pressable style={s.swapBtn} onPress={() => swapStations?.()}>
              <ArrowsLeftRight size={16} color={C['text-primary']} />
            </Pressable>
            <View style={s.dividerLine} />
          </View>

          {/* To */}
          <Pressable style={s.stationRow} onPress={() => router.push('/(tabs)/search' as any)}>
            <MapPin size={18} color={C['text-secondary']} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={s.stationLabel}>To</Text>
              <Text style={[s.stationValue, !toStation && s.stationPlaceholder]}>
                {toStation ? toStation.name_en : 'Select destination station'}
              </Text>
              {toStation?.name_bn ? <Text style={s.stationBn}>{toStation.name_bn}</Text> : null}
            </View>
            {toStation && (
              <Pressable onPress={() => setToStation(null)}>
                <Text style={s.clearX}>✕</Text>
              </Pressable>
            )}
          </Pressable>

          {/* Date */}
          <Pressable style={s.dateRow}>
            <CalendarBlank size={18} color={C['text-secondary']} />
            <View style={{ flex: 1 }}>
              <Text style={s.stationLabel}>Date</Text>
              <Text style={s.stationValue}>{displayDate}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>

          {/* Search button */}
          <Pressable style={s.searchBtn} onPress={handleSearch}>
            <MagnifyingGlass size={18} color={C['text-inverse']} weight="bold" />
            <Text style={s.searchBtnText}>Plan Journey</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <Pressable
                key={i}
                style={s.quickCard}
                onPress={() => action.route ? router.push(action.route as any) : undefined}
              >
                <View style={s.quickIcon}>{action.icon}</View>
                <Text style={s.quickLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Saved Routes */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Saved Routes</Text>
            {savedRoutes.length > 0 && (
              <Pressable>
                <Text style={s.viewAll}>View All →</Text>
              </Pressable>
            )}
          </View>
          {routesLoading ? (
            <View style={s.savedRoutesSkeleton} />
          ) : savedRoutes.length === 0 ? (
            isGuest ? (
              <Pressable style={s.signInPrompt} onPress={() => router.push('/auth/login' as any)}>
                <Text style={s.signInPromptText}>Sign in to save your favorite routes</Text>
              </Pressable>
            ) : (
              <View style={s.emptyRoutes}>
                <Text style={s.emptyRoutesText}>No saved routes yet — search a route to save it</Text>
              </View>
            )
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.routesList}>
              {savedRoutes.slice(0, 5).map((route) => (
                <Pressable
                  key={route.id}
                  style={s.routeCard}
                  onPress={() => {
                    setFromStation({ ...route.fromStation, division: null, zone: null, is_major: false });
                    setToStation({ ...route.toStation, division: null, zone: null, is_major: false });
                    router.push('/(tabs)/search' as any);
                  }}
                >
                  <View style={s.routeBookmark} />
                  <Text style={s.routeFrom} numberOfLines={1}>{route.fromStation.name_en} → {route.toStation.name_en}</Text>
                  <Text style={s.routeFromBn} numberOfLines={1}>{route.fromStation.name_bn} → {route.toStation.name_bn}</Text>
                  <View style={s.routeFooter}>
                    <Clock size={11} color={C['text-tertiary']} />
                    <Text style={s.routeTime}>Last viewed: {route.savedAt}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Live Updates */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Live Updates</Text>
            {liveUpdates.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/live-updates' as any)}>
                <Text style={s.viewAll}>View All →</Text>
              </Pressable>
            )}
          </View>
          <View style={s.updatesCard}>
            {updatesLoading ? (
              <View style={s.updatesSkeleton} />
            ) : liveUpdates.length === 0 ? (
              <Text style={s.noUpdatesText}>No live updates right now</Text>
            ) : (
              liveUpdates.slice(0, 3).map((update, i) => {
                const st = getStatusStyle(update.report_type);
                return (
                  <Pressable
                    key={update.id}
                    style={[s.updateRow, i < Math.min(liveUpdates.length, 3) - 1 && s.updateRowBorder]}
                    onPress={() => router.push('/(tabs)/live-updates' as any)}
                  >
                    <View style={[s.updateStatusDot, { backgroundColor: st.color === C.danger ? 'rgba(232,57,75,0.15)' : st.color === '#F5A623' ? 'rgba(245,166,35,0.15)' : 'rgba(0,168,89,0.15)' }]}>
                      {update.report_type === 'DELAY'
                        ? <Clock size={14} color={st.color} weight="fill" />
                        : update.report_type === 'CROWD'
                        ? <Users size={14} color={st.color} weight="fill" />
                        : <MagnifyingGlass size={14} color={st.color} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.updateTrainName} numberOfLines={1}>
                        {update.train?.name_en ?? 'Unknown Train'}
                      </Text>
                      <Text style={[s.updateStatus, { color: st.color }]}>
                        {update.report_type === 'DELAY' ? `${update.delay_minutes ?? 0} ${st.label}` : st.label}
                      </Text>
                    </View>
                    <View style={s.updateRight}>
                      <View style={s.updateReporters}>
                        <Users size={12} color={C['text-tertiary']} />
                        <Text style={s.updateReporterCount}>{update.verification_count} travelers confirmed</Text>
                      </View>
                      <Text style={s.updateTime}>
                        {new Date(update.reported_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={s.updateChevron}>›</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Community Activity banner */}
        <View style={s.communityBanner}>
          <View style={s.communityLeft}>
            <Text style={s.communityTag}>Today&apos;s Community Activity</Text>
            <View style={s.communityStats}>
              <View>
                <Text style={s.communityStatNum}>{liveUpdates.length * 3 + 42}</Text>
                <Text style={s.communityStatLabel}>reports submitted today</Text>
              </View>
              <View>
                <Text style={s.communityStatNum}>{Math.max(0, liveUpdates.filter(u => u.verification_count >= 5).length + 12)}</Text>
                <Text style={s.communityStatLabel}>verified reports</Text>
              </View>
            </View>
          </View>
          <Pressable
            style={s.communityBtn}
            onPress={() => router.push('/(tabs)/community' as any)}
          >
            <Text style={s.communityBtnText}>View Community</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getQuickActions = (C: ThemeColors) => [
  { label: 'Live Status',     icon: <ChartLineUp size={22} color={C.primary} weight="bold" />, route: '/(tabs)/live-updates' },
  { label: 'My Trips',        icon: <Notebook size={22} color={C.primary} weight="bold" />,    route: '/coming-soon?feature=My+Trips' },
  { label: 'Set Alert',       icon: <BellSimple size={22} color={C.primary} weight="bold" />,  route: '/notifications' },
  { label: 'Station Info',    icon: <Info size={22} color={C.primary} weight="bold" />,        route: '/(tabs)/search' },
  { label: 'Coach Position',  icon: <Train size={22} color={C.primary} weight="bold" />,       route: '/coming-soon?feature=Coach+Position' },
  { label: 'Fare Calculator', icon: <Calculator size={22} color={C.primary} weight="bold" />,  route: '/seat-fare' },
];

const createS = (C: ThemeColors) => StyleSheet.create({
  root:               { flex: 1, backgroundColor: C['bg-base'] },
  scroll:             { paddingBottom: 16 },
  // Hero
  hero:               { minHeight: 200 },
  heroImage:          { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  heroOverlay:        { backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  heroTopBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brandRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIconWrap:      { width: 44, height: 44, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  brandLine:          { fontSize: 18, fontWeight: '700' },
  brandRail:          { color: '#FFFFFF' },
  brandMate:          { color: C.primary },
  brandSub:           { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  notifBtn:           { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notifBadge:         { position: 'absolute', top: -4, right: -4, width: 16, height: 16, backgroundColor: C.danger, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(8,13,23,0.8)' },
  notifBadgeText:     { fontSize: 9, fontWeight: '700', color: '#FFF' },
  greetingBlock:      { gap: 2 },
  greetingTop:        { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  greetingName:       { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  greetingDate:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  // Search card
  searchCard:         { marginHorizontal: 12, marginTop: -10, backgroundColor: C['bg-card'], borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, gap: 4, zIndex: 10 },
  stationRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  stationLabel:       { fontSize: 10, color: C['text-tertiary'], marginBottom: 1 },
  stationValue:       { fontSize: 15, fontWeight: '600', color: C['text-primary'] },
  stationPlaceholder: { color: C['text-tertiary'], fontWeight: '400' },
  stationBn:          { fontSize: 11, color: C['text-secondary'] },
  clearX:             { fontSize: 16, color: C['text-tertiary'], paddingHorizontal: 4 },
  swapRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  dividerLine:        { flex: 1, height: 1, backgroundColor: C.border },
  swapBtn:            { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dateRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  chevron:            { fontSize: 20, color: C['text-tertiary'] },
  searchBtn:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  searchBtnText:      { fontSize: 15, fontWeight: '700', color: C['text-inverse'] },
  // Sections
  section:            { marginTop: 20, paddingHorizontal: 12 },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: C['text-primary'] },
  viewAll:            { fontSize: 13, color: C.primary },
  // Quick Actions
  quickGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard:          { width: '31%', backgroundColor: C['bg-card'], borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 16, alignItems: 'center', gap: 8 },
  quickIcon:          { width: 44, height: 44, backgroundColor: 'rgba(0,168,89,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel:         { fontSize: 11, fontWeight: '500', color: C['text-primary'], textAlign: 'center' },
  // Saved routes
  savedRoutesSkeleton:{ height: 100, backgroundColor: C['bg-card'], borderRadius: 12 },
  signInPrompt:       { backgroundColor: C['bg-card'], borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center' },
  signInPromptText:   { fontSize: 13, color: C.primary },
  emptyRoutes:        { backgroundColor: C['bg-card'], borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center' },
  emptyRoutesText:    { fontSize: 13, color: C['text-secondary'], textAlign: 'center' },
  routesList:         { gap: 10, paddingRight: 4 },
  routeCard:          { width: 180, backgroundColor: C['bg-card'], borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, gap: 4, position: 'relative' },
  routeBookmark:      { position: 'absolute', top: 10, right: 10, width: 16, height: 20, backgroundColor: C.primary, borderRadius: 3 },
  routeFrom:          { fontSize: 13, fontWeight: '600', color: C['text-primary'], paddingRight: 20 },
  routeFromBn:        { fontSize: 11, color: C['text-secondary'] },
  routeFooter:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  routeTime:          { fontSize: 10, color: C['text-tertiary'] },
  // Live updates
  updatesCard:        { backgroundColor: C['bg-card'], borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  updatesSkeleton:    { height: 120 },
  noUpdatesText:      { padding: 20, textAlign: 'center', color: C['text-secondary'], fontSize: 13 },
  updateRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  updateRowBorder:    { borderBottomWidth: 1, borderBottomColor: C.border },
  updateStatusDot:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  updateTrainName:    { fontSize: 13, fontWeight: '600', color: C['text-primary'] },
  updateStatus:       { fontSize: 12, fontWeight: '500', marginTop: 1 },
  updateRight:        { alignItems: 'flex-end', gap: 2 },
  updateReporters:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  updateReporterCount:{ fontSize: 10, color: C['text-tertiary'] },
  updateTime:         { fontSize: 10, color: C['text-tertiary'] },
  updateChevron:      { fontSize: 18, color: C['text-tertiary'] },
  // Community banner
  communityBanner:    { marginHorizontal: 12, marginTop: 20, backgroundColor: 'rgba(0,168,89,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,168,89,0.2)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  communityLeft:      { flex: 1, gap: 8 },
  communityTag:       { fontSize: 11, fontWeight: '600', color: C.primary },
  communityStats:     { flexDirection: 'row', gap: 20 },
  communityStatNum:   { fontSize: 24, fontWeight: '700', color: C['text-primary'] },
  communityStatLabel: { fontSize: 11, color: C['text-secondary'] },
  communityBtn:       { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  communityBtnText:   { fontSize: 12, fontWeight: '700', color: C['text-inverse'] },
});