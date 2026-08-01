/**
 * RailMate Bangladesh — Journey Planner
 * ---------------------------------------
 * Multi-transfer route search (direct / 1-transfer / 2-transfer) for
 * connections not covered by the direct search screen.
 *
 * REWRITTEN 2026-07-19: the previous version of this file was web JSX
 * (<div>, className) left over from an earlier prototyping pass for a
 * Next.js web app. It could not render in this Expo/React Native app
 * at all. This version uses React Native primitives and the app's
 * existing design tokens / StationSelector / i18n, matching the
 * patterns already used in app/search-trains.tsx.
 *
 * Data: RouteEngine + railmateData.ts (PDF-verified topology — see
 * that file's header for provenance). Station picking uses the live
 * Supabase-backed StationSelector, same as the main search screen.
 * Route computation itself is a static snapshot and will drift from
 * Supabase over time — acceptable for now, flagged for future work
 * to move onto a live query (see railmateData.ts header).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowsDownUp, ArrowRight, MapPin, Warning } from 'phosphor-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants';
import { useTranslation } from '../../i18n';
import { StationSelector } from '../../components/features/StationSelector/StationSelector';
import type { Station as AppStation } from '../../types/station.types';
import { RouteEngine } from './routeEngine';
import type {
  JourneyResult,
  OneTransferJourney,
  TwoTransferJourney,
  JourneyLeg,
  ConfidenceLevel,
} from './routeEngine';
import { STATIONS, TRAINS, STOP_SEQUENCES } from './railmateData';

// Engine built once at module load — not per-render.
const engine = new RouteEngine(STOP_SEQUENCES, TRAINS, STATIONS);

const CONF_COLOR: Record<ConfidenceLevel, string> = {
  medium: Colors.dark.success,
  'low-medium': Colors.dark.info,
  low: Colors.dark.accent,
};

function ConfidencePill({ level, label }: { level: ConfidenceLevel; label: string }) {
  return (
    <View style={[s.pill, { backgroundColor: CONF_COLOR[level] + '20', borderColor: CONF_COLOR[level] + '40' }]}>
      <Text style={[s.pillText, { color: CONF_COLOR[level] }]}>{label}</Text>
    </View>
  );
}

function TrainChips({ trains }: { trains: { number: number; name: string }[] }) {
  return (
    <View style={s.chipRow}>
      {trains.slice(0, 3).map((t) => (
        <View key={t.number} style={s.chip}>
          <Text style={s.chipText}>#{t.number} {t.name}</Text>
        </View>
      ))}
      {trains.length > 3 && (
        <View style={s.chip}><Text style={s.chipText}>+{trains.length - 3} more</Text></View>
      )}
    </View>
  );
}

function LegRow({ leg, step }: { leg: JourneyLeg; step: number }) {
  return (
    <View style={s.legRow}>
      <View style={s.legNum}><Text style={s.legNumText}>{step}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={s.legRoute}>
          <Text style={s.legRouteText}>{leg.fromName}</Text>
          <ArrowRight size={12} color={Colors.dark['text-tertiary']} weight="bold" />
          <Text style={s.legRouteText}>{leg.toName}</Text>
        </View>
        <TrainChips trains={leg.trains} />
      </View>
    </View>
  );
}

function TransferBadge({ stationName }: { stationName: string }) {
  return (
    <View style={s.transferRow}>
      <ArrowsDownUp size={13} color={Colors.dark['text-secondary']} />
      <Text style={s.transferText}>Change at <Text style={{ fontWeight: '600', color: Colors.dark['text-primary'] }}>{stationName}</Text></Text>
    </View>
  );
}

function Disclaimer({ note }: { note: string }) {
  return (
    <View style={s.disclaimer}>
      <Warning size={14} color={Colors.dark.accent} style={{ marginTop: 1 }} />
      <Text style={s.disclaimerText}>
        <Text style={{ fontWeight: '600', color: Colors.dark.accent }}>Schedules may change. </Text>
        {note} Verify at eticket.railway.gov.bd before travel.
      </Text>
    </View>
  );
}

function ResultCard({ result }: { result: JourneyResult }) {
  if (result.type === 'not_found') {
    return (
      <View style={s.card}>
        <View style={[s.typePill, { backgroundColor: Colors.dark['bg-overlay'] }]}>
          <Text style={[s.typePillText, { color: Colors.dark['text-secondary'] }]}>No route found</Text>
        </View>
        <Text style={s.notFoundText}>{result.reason}</Text>
        {result.suggestions.map((sugg, i) => (
          <View key={i} style={s.suggestionRow}>
            <Text style={s.suggestionArrow}>→</Text>
            <Text style={s.suggestionText}>{sugg}</Text>
          </View>
        ))}
      </View>
    );
  }

  const typeLabel = result.type === 'direct' ? 'Direct route' : result.type === 'one_transfer' ? '1 transfer' : '2 transfers';
  const typeColor = result.type === 'direct' ? Colors.dark.success : result.type === 'one_transfer' ? Colors.dark.info : Colors.dark.accent;
  const confLabel = result.overallConfidence === 'medium' ? 'Verified schedule' : result.overallConfidence === 'low-medium' ? 'Partially verified' : 'Limited data';

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.typePill, { backgroundColor: typeColor + '20' }]}>
          <Text style={[s.typePillText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
        <ConfidencePill level={result.overallConfidence} label={confLabel} />
      </View>

      <LegRow leg={result.legs[0]} step={1} />

      {result.type === 'one_transfer' && (
        <>
          <TransferBadge stationName={(result as OneTransferJourney).transferStation.nameEn} />
          <LegRow leg={result.legs[1]} step={2} />
        </>
      )}

      {result.type === 'two_transfer' && (
        <>
          <TransferBadge stationName={(result as TwoTransferJourney).transferStation1.nameEn} />
          <LegRow leg={result.legs[1]} step={2} />
          <TransferBadge stationName={(result as TwoTransferJourney).transferStation2.nameEn} />
          <LegRow leg={result.legs[2]} step={3} />
        </>
      )}

      <Disclaimer note={result.dataNote} />
    </View>
  );
}

export default function JourneyPlanner() {
  const router = useRouter();
  const { t } = useTranslation();

  const [origin, setOrigin] = useState<AppStation | null>(null);
  const [dest, setDest] = useState<AppStation | null>(null);
  const [result, setResult] = useState<JourneyResult | null>(null);
  const [pickerOpen, setPickerOpen] = useState<'from' | 'to' | null>(null);

  const handleSearch = useCallback(() => {
    if (!origin || !dest) return;
    setResult(engine.find(origin.code, dest.code));
  }, [origin, dest]);

  const handleSwap = useCallback(() => {
    setOrigin(dest);
    setDest(origin);
    setResult(null);
  }, [origin, dest]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.dark['text-primary']} />
        </TouchableOpacity>
        <Text style={s.title}>Journey Planner</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Find a route with transfers, even when no direct train exists</Text>

        <View style={s.formCard}>
          <TouchableOpacity style={s.fieldRow} onPress={() => setPickerOpen('from')}>
            <MapPin size={16} color={Colors.dark.primary} />
            <View style={{ flex: 1, marginLeft: Spacing['space-3'] }}>
              <Text style={s.fieldLabel}>From</Text>
              <Text style={s.fieldValue}>{origin ? origin.name_en : 'Select origin…'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.swapBtn} onPress={handleSwap} disabled={!origin && !dest}>
            <ArrowsDownUp size={16} color={Colors.dark['text-secondary']} />
          </TouchableOpacity>

          <TouchableOpacity style={s.fieldRow} onPress={() => setPickerOpen('to')}>
            <MapPin size={16} color={Colors.dark.accent} />
            <View style={{ flex: 1, marginLeft: Spacing['space-3'] }}>
              <Text style={s.fieldLabel}>To</Text>
              <Text style={s.fieldValue}>{dest ? dest.name_en : 'Select destination…'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.searchBtn, (!origin || !dest) && s.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={!origin || !dest}
          >
            <Text style={s.searchBtnText}>Find routes</Text>
          </TouchableOpacity>
        </View>

        {result && <ResultCard result={result} />}
      </ScrollView>

      <Modal visible={pickerOpen !== null} animationType="slide" onRequestClose={() => setPickerOpen(null)}>
        <StationSelector
          onSelect={(station) => {
            if (pickerOpen === 'from') setOrigin(station);
            else setDest(station);
            setResult(null);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark['bg-base'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['space-4'], paddingVertical: Spacing['space-3'],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius['radius-md'], backgroundColor: Colors.dark['bg-card'],
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h4, color: Colors.dark['text-primary'], fontWeight: '600' },
  scroll: { padding: Spacing['space-4'], gap: Spacing['space-4'] },
  subtitle: { ...Typography['body-sm'], color: Colors.dark['text-secondary'] },
  formCard: {
    backgroundColor: Colors.dark['bg-card'], borderRadius: Radius['radius-lg'],
    borderWidth: 1, borderColor: Colors.dark.border, padding: Spacing['space-4'], gap: Spacing['space-3'],
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark['bg-overlay'], borderRadius: Radius['radius-md'],
    paddingHorizontal: Spacing['space-3'], paddingVertical: Spacing['space-3'],
  },
  fieldLabel: { ...Typography['body-sm'], color: Colors.dark['text-tertiary'], marginBottom: 2 },
  fieldValue: { ...Typography.body, color: Colors.dark['text-primary'] },
  swapBtn: {
    alignSelf: 'center', width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.dark['bg-overlay'], alignItems: 'center', justifyContent: 'center',
  },
  searchBtn: {
    backgroundColor: Colors.dark.primary, borderRadius: Radius['radius-md'],
    paddingVertical: Spacing['space-3'], alignItems: 'center', marginTop: Spacing['space-1'],
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: { ...Typography.body, color: Colors.dark['text-inverse'], fontWeight: '600' },

  card: {
    backgroundColor: Colors.dark['bg-card'], borderRadius: Radius['radius-lg'],
    borderWidth: 1, borderColor: Colors.dark.border, padding: Spacing['space-4'], gap: Spacing['space-2'],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['space-2'] },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius['radius-full'] },
  typePillText: { ...Typography['body-sm'], fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius['radius-full'], borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '600' },

  legRow: { flexDirection: 'row', gap: Spacing['space-3'] },
  legNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.dark['bg-overlay'],
    alignItems: 'center', justifyContent: 'center',
  },
  legNumText: { fontSize: 11, fontWeight: '600', color: Colors.dark['text-secondary'] },
  legRoute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legRouteText: { ...Typography.body, color: Colors.dark['text-primary'], fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 2 },
  chip: {
    backgroundColor: Colors.dark['bg-overlay'], borderRadius: Radius['radius-sm'],
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.dark.border,
  },
  chipText: { fontSize: 11, color: Colors.dark['text-primary'] },

  transferRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 34, marginVertical: 2 },
  transferText: { ...Typography['body-sm'], color: Colors.dark['text-secondary'] },

  disclaimer: {
    flexDirection: 'row', gap: 8, backgroundColor: Colors.dark['accent-subtle'],
    borderWidth: 1, borderColor: Colors.dark.accent + '30', borderRadius: Radius['radius-md'],
    padding: Spacing['space-3'], marginTop: Spacing['space-2'],
  },
  disclaimerText: { ...Typography['body-sm'], color: Colors.dark['text-secondary'], flex: 1, lineHeight: 18 },

  notFoundText: { ...Typography.body, color: Colors.dark['text-secondary'] },
  suggestionRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  suggestionArrow: { color: Colors.dark['text-tertiary'] },
  suggestionText: { ...Typography['body-sm'], color: Colors.dark['text-secondary'], flex: 1 },
});
