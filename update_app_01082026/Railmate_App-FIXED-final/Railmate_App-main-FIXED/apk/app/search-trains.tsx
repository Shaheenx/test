// app/search-trains.tsx — Search Trains Screen

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, ArrowsDownUp, CalendarBlank, Seat, ClockCounterClockwise, BookmarkSimple, CaretRight } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants';
import { useSearchStore } from '../stores/searchStore';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useTranslation } from '../i18n';
import { StationSelector } from '../components/features/StationSelector/StationSelector';
import { Station } from '../types/station.types';
import { useThemeColors, ThemeColors } from '../hooks/useThemeColors';

export default function SearchTrainsScreen() {
  const colors = useThemeColors();
  const C = colors;
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { t, isBengali } = useTranslation();
  const { fromStation, toStation, date, setFromStation, setToStation, setDate, swapStations } = useSearchStore();
  const { recentSearches, addRecentSearch, clearAll } = useRecentSearches();
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchError, setSearchError] = useState('');

  const formatDateDisplay = (isoDate: string) => {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-BD', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSearch = async () => {
    if (!fromStation || !toStation) {
      setSearchError(t('search.select_stations'));
      return;
    }
    setSearchError('');
    await addRecentSearch(
      { id: fromStation.id, name_en: fromStation.name_en, name_bn: fromStation.name_bn, code: fromStation.code },
      { id: toStation.id, name_en: toStation.name_en, name_bn: toStation.name_bn, code: toStation.code },
      date,
      null,
    );
    router.push({
      pathname: '/search-results' as any,
      params: {
        from_station_id: fromStation.id,
        to_station_id: toStation.id,
        date,
        from_name: isBengali ? fromStation.name_bn : fromStation.name_en,
        to_name: isBengali ? toStation.name_bn : toStation.name_en,
      },
    });
  };

  const handleRecentTap = (item: typeof recentSearches[0]) => {
    setFromStation({ id: item.fromStation.id, code: item.fromStation.code, name_en: item.fromStation.name_en, name_bn: item.fromStation.name_bn, division: null, zone: null, is_major: false });
    setToStation({ id: item.toStation.id, code: item.toStation.code, name_en: item.toStation.name_en, name_bn: item.toStation.name_bn, division: null, zone: null, is_major: false });
    setDate(item.date);
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ArrowLeft size={18} color={C['text-primary']} /></TouchableOpacity>
        <Text style={s.title}>Search Trains</Text>
        <TouchableOpacity style={s.recentBtn}>
          <Text style={s.recentBtnText}>Recent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Search Form */}
        <View style={s.formCard}>

          {/* From */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowFromPicker(true)}>
            <View style={[s.fieldDot, { backgroundColor: C.primary }]} />
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>From</Text>
              <Text style={s.fieldValue}>
                {fromStation ? (isBengali ? fromStation.name_bn : fromStation.name_en) : t('search.placeholder_from')}
              </Text>
              <Text style={s.fieldSub}>{fromStation?.division ?? fromStation?.code ?? ''}</Text>
            </View>
            <TouchableOpacity style={s.clearBtn} onPress={() => setFromStation(null)}>
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
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowToPicker(true)}>
            <View style={[s.fieldDot, { backgroundColor: C['text-secondary'] }]} />
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>To</Text>
              <Text style={s.fieldValue}>
                {toStation ? (isBengali ? toStation.name_bn : toStation.name_en) : t('search.placeholder_to')}
              </Text>
              <Text style={s.fieldSub}>{toStation?.division ?? toStation?.code ?? ''}</Text>
            </View>
            <TouchableOpacity style={s.clearBtn} onPress={() => setToStation(null)}>
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
              <Text style={s.fieldLabel}>Date of Journey</Text>
              <Text style={s.fieldValue}>{formatDateDisplay(date)}</Text>
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
          <Text style={s.searchBtnText}>Search Trains</Text>
        </TouchableOpacity>

        {/* Search Error */}
        {searchError !== '' && (
          <Text style={{ color: C.danger, ...Typography['body-sm'] }}>{searchError}</Text>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={s.recentSection}>
            <View style={s.recentHeader}>
              <Text style={s.recentTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearAll}><Text style={s.clearAll}>Clear All</Text></TouchableOpacity>
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
                  <Text style={s.recentMeta}>{formatDateDisplay(item.date)}</Text>
                </View>
                <BookmarkSimple size={18} color={C['text-tertiary']} />
                <CaretRight size={16} color={C['text-tertiary']} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Explore Banner */}
        <View style={s.exploreBanner}>
          <View style={s.exploreImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.exploreTitleBn}>ট্রেন খুঁজতে সহায়তা লাগছে?</Text>
            <Text style={s.exploreSub}>Use our Station Guide or Route Map to plan your journey better.</Text>
          </View>
          <TouchableOpacity style={s.exploreBtn}>
            <Text style={s.exploreBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* From Station Picker Modal */}
      <Modal visible={showFromPicker} animationType="slide" onRequestClose={() => setShowFromPicker(false)}>
        <View style={{ flex: 1, backgroundColor: '#080D17' }}>
          <StationSelector
            onSelect={(station: Station) => { setFromStation(station); setShowFromPicker(false); }}
            onClose={() => setShowFromPicker(false)}
            isBengali={isBengali}
          />
        </View>
      </Modal>

      {/* To Station Picker Modal */}
      <Modal visible={showToPicker} animationType="slide" onRequestClose={() => setShowToPicker(false)}>
        <View style={{ flex: 1, backgroundColor: '#080D17' }}>
          <StationSelector
            onSelect={(station: Station) => { setToStation(station); setShowToPicker(false); }}
            onClose={() => setShowToPicker(false)}
            isBengali={isBengali}
          />
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate.toISOString().split('T')[0]);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createS = (C: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C['bg-base'] },
  scroll: { padding: Spacing['space-5'], gap: Spacing['space-5'], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['space-5'], paddingVertical: Spacing['space-3'] },
  backBtn: { width: 32, height: 32, backgroundColor: C['bg-overlay'], borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C['text-primary'] },
  recentBtn: { backgroundColor: C['primary-subtle'], borderRadius: 16, paddingHorizontal: Spacing['space-3'], paddingVertical: 6, borderWidth: 1, borderColor: C.primary },
  recentBtnText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  formCard: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing['space-5'], gap: Spacing['space-3'] },
  fieldDot: { width: 20, height: 20, borderRadius: 10 },
  fieldIcon: { width: 20, height: 20, borderRadius: 6 },
  fieldContent: { flex: 1, gap: 2 },
  fieldLabel: { ...Typography.caption, color: C['text-secondary'] },
  fieldValue: { ...Typography.h4, fontWeight: '600', color: C['text-primary'] },
  fieldSub: { ...Typography['body-sm'], color: C.primary },
  clearBtn: { width: 24, height: 24, backgroundColor: C['bg-overlay'], borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clearDot: { width: 8, height: 8, backgroundColor: C['text-secondary'], borderRadius: 4 },
  swapWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['space-5'] },
  swapLine: { flex: 1, height: 1, backgroundColor: C.border },
  swapBtn: { width: 36, height: 36, backgroundColor: C['bg-overlay'], borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  swapIcon: { fontSize: 16, color: C.primary },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: Spacing['space-5'] },
  chevron: { width: 20, height: 20, backgroundColor: C['bg-overlay'], borderRadius: 4 },
  searchBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  searchBtnText: { ...Typography.h4, fontWeight: '700', color: C['bg-base'] },
  recentSection: { gap: Spacing['space-3'] },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { ...Typography.h4, fontWeight: '700', color: C['text-primary'] },
  clearAll: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C['bg-card'], borderRadius: Radius['radius-md'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], gap: Spacing['space-3'] },
  recentIcon: { width: 20, height: 20, backgroundColor: C['bg-overlay'], borderRadius: 10 },
  recentRoute: { ...Typography.body, fontWeight: '600', color: C['text-primary'] },
  recentMeta: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  bookmarkIcon: { width: 20, height: 20, backgroundColor: C['primary-subtle'], borderRadius: 4 },
  exploreBanner: { backgroundColor: C['bg-card'], borderRadius: Radius['radius-lg'], borderWidth: 1, borderColor: C.border, padding: Spacing['space-4'], flexDirection: 'row', alignItems: 'center', gap: Spacing['space-3'] },
  exploreImg: { width: 56, height: 56, backgroundColor: C['bg-overlay'], borderRadius: 10 },
  exploreTitleBn: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
  exploreSub: { ...Typography['body-sm'], color: C['text-secondary'], marginTop: 2 },
  exploreBtn: { backgroundColor: C['primary-subtle'], borderRadius: 10, paddingHorizontal: Spacing['space-3'], paddingVertical: Spacing['space-2'], borderWidth: 1, borderColor: C.primary },
  exploreBtnText: { ...Typography['body-sm'], fontWeight: '600', color: C.primary },
});
