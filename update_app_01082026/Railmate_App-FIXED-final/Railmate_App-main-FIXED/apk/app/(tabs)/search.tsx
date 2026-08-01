// app/(tabs)/search.tsx — Search Tab

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { X, ArrowsDownUp, CalendarBlank, Seat, ClockCounterClockwise, BookmarkSimple, CaretRight, MapTrifold, MapPin, MagnifyingGlass } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants';
import { useSearchStore } from '../../stores/searchStore';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { useTranslation } from '../../i18n';
import { StationSelector } from '../../components/features/StationSelector/StationSelector';
import { Station } from '../../types/station.types';
import { useThemeColors, ThemeColors } from '../../hooks/useThemeColors';

export default function SearchTabScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { t, isBengali } = useTranslation();

  const {
    fromStation,
    toStation,
    date,
    setFromStation,
    setToStation,
    setDate,
    swapStations,
  } = useSearchStore();

  const { recentSearches, addRecentSearch, clearAll } = useRecentSearches();

  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchError, setSearchError] = useState('');

  // ── Station selection ────────────────────────────────────────────────────────

  const handleSelectFrom = useCallback((station: Station) => {
    setFromStation(station);
    setShowFromSelector(false);
    setSearchError('');
  }, [setFromStation]);

  const handleSelectTo = useCallback((station: Station) => {
    setToStation(station);
    setShowToSelector(false);
    setSearchError('');
  }, [setToStation]);

  // ── Date picker ──────────────────────────────────────────────────────────────

  const handleDateChange = useCallback((_event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS until dismissed
    if (selected) {
      setDate(selected.toISOString().split('T')[0]);
    }
  }, [setDate]);

  const dateObj = (() => {
    try { return new Date(date); } catch { return new Date(); }
  })();

  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ── Search handler ───────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    if (!fromStation || !toStation) {
      setSearchError(t('search.select_stations'));
      return;
    }
    setSearchError('');

    addRecentSearch(
      { id: fromStation.id, name_en: fromStation.name_en, name_bn: fromStation.name_bn, code: fromStation.code },
      { id: toStation.id, name_en: toStation.name_en, name_bn: toStation.name_bn, code: toStation.code },
      date,
      null,
    );

    router.push({
      pathname: '/search-results',
      params: {
        from_station_id: fromStation.id,
        to_station_id: toStation.id,
        date,
        from_name: fromStation.name_en,
        to_name: toStation.name_en,
      },
    } as any);
  }, [fromStation, toStation, date, addRecentSearch, router, t]);

  // ── Recent search tap ────────────────────────────────────────────────────────

  const handleRecentTap = useCallback((item: typeof recentSearches[number]) => {
    setFromStation({
      id: item.fromStation.id,
      code: item.fromStation.code,
      name_en: item.fromStation.name_en,
      name_bn: item.fromStation.name_bn,
      division: null,
      zone: null,
      is_major: false,
    });
    setToStation({
      id: item.toStation.id,
      code: item.toStation.code,
      name_en: item.toStation.name_en,
      name_bn: item.toStation.name_bn,
      division: null,
      zone: null,
      is_major: false,
    });
    setDate(item.date);

    router.push({
      pathname: '/search-results',
      params: {
        from_station_id: item.fromStation.id,
        to_station_id: item.toStation.id,
        date: item.date,
        from_name: item.fromStation.name_en,
        to_name: item.toStation.name_en,
      },
    } as any);
  }, [setFromStation, setToStation, setDate, router]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getFieldSub = (station: Station | null): string => {
    if (!station) return '';
    return station.division ?? station.code ?? '';
  };

  const formatRecentDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <MagnifyingGlass size={20} color={C.primary} weight="fill" />
          </View>
          <View>
            <Text style={s.title}>{t('search.title')}</Text>
            <Text style={s.headerSub}>{t('search.subtitle') || 'Find trains between stations'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.recentBtn}>
          <Text style={s.recentBtnText}>{t("search.recent")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Search Form */}
        <View style={s.formCard}>

          {/* From */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowFromSelector(true)}>
            <MapPin size={18} color={C.primary} weight="fill" />
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>{t('search.from')}</Text>
              <Text style={s.fieldValue}>
                {fromStation
                  ? (isBengali ? fromStation.name_bn : fromStation.name_en)
                  : t('search.placeholder_from')}
              </Text>
              {fromStation && (
                <Text style={s.fieldSub}>{getFieldSub(fromStation)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={s.clearBtn}
              onPress={() => setFromStation(null)}
            >
              <X size={12} color={C['text-secondary']} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Swap button */}
          <View style={s.swapWrapper}>
            <View style={s.swapLine} />
            <TouchableOpacity style={s.swapBtn} onPress={swapStations}>
              <ArrowsDownUp size={16} color={C.primary} weight="bold" />
            </TouchableOpacity>
          </View>

          {/* To */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowToSelector(true)}>
            <MapPin size={18} color={C['text-secondary']} weight="fill" />
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>{t('search.to')}</Text>
              <Text style={s.fieldValue}>
                {toStation
                  ? (isBengali ? toStation.name_bn : toStation.name_en)
                  : t('search.placeholder_to')}
              </Text>
              {toStation && (
                <Text style={s.fieldSub}>{getFieldSub(toStation)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={s.clearBtn}
              onPress={() => setToStation(null)}
            >
              <X size={12} color={C['text-secondary']} />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Date */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowDatePicker(true)}>
            <View style={[s.fieldIcon, { backgroundColor: C['bg-overlay'], alignItems: 'center', justifyContent: 'center' }]}>
              <CalendarBlank size={18} color={C['text-secondary']} />
            </View>
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>{t('search.date_of_journey')}</Text>
              <Text style={s.fieldValue}>{formattedDate}</Text>
            </View>
            <CaretRight size={16} color={C['text-tertiary']} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Class */}
          <TouchableOpacity style={s.fieldRow}>
            <View style={[s.fieldIcon, { backgroundColor: C['bg-overlay'], alignItems: 'center', justifyContent: 'center' }]}>
              <Seat size={18} color={C['text-secondary']} />
            </View>
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>Class (Optional)</Text>
              <Text style={s.fieldValue}>All Classes</Text>
              <Text style={s.fieldSub}>All Available Classes</Text>
            </View>
            <CaretRight size={16} color={C['text-tertiary']} />
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
          <Text style={s.searchBtnText}>{t('search.button')}</Text>
        </TouchableOpacity>

        {/* Validation error */}
        {!!searchError && (
          <Text style={s.errorText}>{searchError}</Text>
        )}

        {/* Recent Searches */}
        <View style={s.recentSection}>
          <View style={s.recentHeader}>
            <Text style={s.recentTitle}>{t('home.recent_searches')}</Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={s.clearAll}>Clear All</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.recentItem}
              onPress={() => handleRecentTap(item)}
            >
              <ClockCounterClockwise size={20} color={C['text-secondary']} />
              <View style={{ flex: 1 }}>
                <Text style={s.recentRoute}>
                  {isBengali ? item.fromStation.name_bn : item.fromStation.name_en}
                  {' → '}
                  {isBengali ? item.toStation.name_bn : item.toStation.name_en}
                </Text>
                <Text style={s.recentMeta}>
                  {formatRecentDate(item.date)}
                  {item.selectedClass ? ` • ${item.selectedClass}` : ' • All Classes'}
                </Text>
              </View>
              <BookmarkSimple size={18} color={C['text-tertiary']} />
              <CaretRight size={16} color={C['text-tertiary']} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Explore Banner */}
        <View style={s.exploreBanner}>
          <View style={[s.exploreImg, { alignItems: 'center', justifyContent: 'center' }]}>
            <MapTrifold size={24} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.exploreTitleBn}>ট্রেন খুঁজতে সহায়তা লাগছে?</Text>
            <Text style={s.exploreSub}>Use our Station Guide or Route Map to plan your journey better.</Text>
          </View>
          <TouchableOpacity style={s.exploreBtn}>
            <Text style={s.exploreBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── From Station Selector Modal ── */}
      <Modal
        visible={showFromSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFromSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#080D17' }}>
          <StationSelector
            onSelect={handleSelectFrom}
            onClose={() => setShowFromSelector(false)}
            isBengali={isBengali}
          />
        </View>
      </Modal>

      {/* ── To Station Selector Modal ── */}
      <Modal
        visible={showToSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowToSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#080D17' }}>
          <StationSelector
            onSelect={handleSelectTo}
            onClose={() => setShowToSelector(false)}
            isBengali={isBengali}
          />
        </View>
      </Modal>

      {/* ── Date Picker ── */}
      {showDatePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-5'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 38, height: 38, backgroundColor: 'rgba(0,168,89,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  headerSub: { fontSize: 11, color: C['text-secondary'] },
  recentBtn: { backgroundColor: C['primary-subtle'], borderRadius: 16, paddingHorizontal: Spacing['space-3'], paddingVertical: 6, borderWidth: 1, borderColor: C.primary },
  recentBtnText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  formCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing['space-5'], gap: Spacing['space-3'] },
  fieldIcon: { width: 20, height: 20, borderRadius: 6 },
  fieldContent: { flex: 1, gap: 2 },
  fieldLabel: { ...Typography.caption, color: C['text-secondary'] },
  fieldValue: { ...Typography.h4, fontWeight: '600', color: C['text-primary'] },
  fieldSub: { ...Typography['body-sm'], color: C.primary },
  clearBtn: { width: 24, height: 24, backgroundColor: C['bg-overlay'], borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  swapWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['space-5'] },
  swapLine: { flex: 1, height: 1, backgroundColor: C.border },
  swapBtn: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: Spacing['space-5'] },
  searchBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  searchBtnText: { ...Typography.h4, fontWeight: '700', color: C['bg-base'] },
  errorText: { ...Typography['body-sm'], color: C.danger, textAlign: 'center', marginTop: -Spacing['space-3'] },
  recentSection: { gap: Spacing['space-3'] },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  clearAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  recentRoute: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  recentMeta: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  exploreBanner: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  exploreImg: { width: 56, height: 56, backgroundColor: C['bg-overlay'], borderRadius: 10 },
  exploreTitleBn: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  exploreSub: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  exploreBtn: { backgroundColor: C['primary-subtle'], borderRadius: 10, paddingHorizontal: Spacing['space-3'], paddingVertical: Spacing['space-2'], borderWidth: 1, borderColor: C.primary },
  exploreBtnText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
});
