import { supabase } from '../lib/supabase';
import type { Station, TrainSearchResult, TrainDetailWithStops } from '../types/database.types';
import { logger } from '../lib/logger';

/**
 * TIER 1 / TIER 2 TRAIN SEARCH (mobile)
 * ───────────────────────────────────────────────────────────────────────────
 * Mirrors railmate-website/lib/train-search.ts exactly — same join keys
 * (UUID origin_id/destination_id/station_id), same truth standard, same
 * result shape. Both clients query the canonical schema in
 * migrations/001_initial_schema.sql.
 *
 * Tier 1 — route existence: trains.origin_id / destination_id matched
 *          against the searched stations' UUIDs. Works for ALL trains in
 *          the `trains` table, no verified timetable required.
 * Tier 2 — verified timetable: only added when train_stops has a row for
 *          both stations with correct sequence ordering. Never estimated,
 *          never interpolated.
 *
 * Hard rule: a train is never omitted for lack of Tier 2 data, and a time
 * is never shown unless it came from a real train_stops row.
 */

// ─── Station lookup ─────────────────────────────────────────────────────────

export async function getStationsByIds(
  fromStationId: string,
  toStationId:   string
): Promise<{ from: Station; to: Station } | null> {
  const { data, error } = await supabase
    .from('stations')
    .select('id, code, name_en, name_bn, division, zone, is_major, latitude, longitude')
    .in('id', [fromStationId, toStationId]);

  if (error || !data || data.length < 2) return null;

  const from = (data as Station[]).find((s) => s.id === fromStationId);
  const to   = (data as Station[]).find((s) => s.id === toStationId);
  if (!from || !to) return null;

  return { from, to };
}

// ─── Tier 1: route existence ────────────────────────────────────────────────

interface RouteTrain {
  id:            string; // UUID
  number:        string;
  name_en:       string;
  type:          string;
  days_of_week:  number[];
  is_active:     boolean;
}

async function getTrainsForRoute(
  fromStationId: string,
  toStationId: string
): Promise<RouteTrain[]> {
  // Tier 1a: exact origin→destination match
  const { data: exactMatch, error: exactErr } = await supabase
    .from('trains')
    .select('id, number, name_en, type, days_of_week, is_active')
    .eq('origin_id', fromStationId)
    .eq('destination_id', toStationId)
    .eq('is_active', true);

  if (exactErr) {
    return [];
  }

  // Tier 1b: trains that stop at BOTH stations (via train_stops)
  const { data: fromStops } = await supabase
    .from('train_stops')
    .select('train_id, sequence')
    .eq('station_id', fromStationId);

  const { data: toStops } = await supabase
    .from('train_stops')
    .select('train_id, sequence')
    .eq('station_id', toStationId);

  const throughTrainIds: string[] = [];
  if (fromStops && toStops) {
    const toStopMap = new Map(toStops.map(s => [s.train_id, s.sequence]));
    for (const f of fromStops) {
      const toSeq = toStopMap.get(f.train_id);
      if (toSeq !== undefined && f.sequence < toSeq) {
        throughTrainIds.push(f.train_id);
      }
    }
  }

  let throughTrains: RouteTrain[] = [];
  if (throughTrainIds.length > 0) {
    const { data: tt } = await supabase
      .from('trains')
      .select('id, number, name_en, type, days_of_week, is_active')
      .in('id', throughTrainIds)
      .eq('is_active', true);
    throughTrains = (tt ?? []) as RouteTrain[];
  }

  // Merge, deduplicate by id
  const allTrains = [...(exactMatch ?? []) as RouteTrain[], ...throughTrains];
  const seen = new Set<string>();
  return allTrains.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
}

// ─── Tier 2: verified timetable enrichment ──────────────────────────────────

interface StopTiming {
  departure_time: string | null;
  arrival_time:   string | null;
}

async function getVerifiedTimings(
  trainIds:      string[],
  fromStationId: string,
  toStationId:   string
): Promise<Map<string, StopTiming>> {
  const result = new Map<string, StopTiming>();
  if (!trainIds.length) return result;

  const { data: fromStops, error: fromErr } = await supabase
    .from('train_stops')
    .select('train_id, sequence, departure_time')
    .eq('station_id', fromStationId)
    .in('train_id', trainIds);

  if (fromErr) {
    logger.error('[getVerifiedTimings] from query failed', fromErr);
    return result; // fail safe: Tier 1 results remain valid without enrichment
  }
  if (!fromStops?.length) return result;

  const { data: toStops, error: toErr } = await supabase
    .from('train_stops')
    .select('train_id, sequence, arrival_time')
    .eq('station_id', toStationId)
    .in('train_id', trainIds);

  if (toErr) {
    logger.error('[getVerifiedTimings] to query failed', toErr);
    return result;
  }
  if (!toStops?.length) return result;

  for (const toStop of toStops as any[]) {
    const fromStop = (fromStops as any[]).find(
      (f) => f.train_id === toStop.train_id && f.sequence < toStop.sequence
    );
    if (fromStop) {
      result.set(toStop.train_id, {
        departure_time: fromStop.departure_time,
        arrival_time:   toStop.arrival_time,
      });
    }
  }
  return result;
}

// ─── Combined search ─────────────────────────────────────────────────────────

/**
 * Tier 1 + Tier 2 combined search, by station UUID (mobile's station picker
 * already deals in the same UUIDs the rest of the schema uses).
 *
 * Returns [] ONLY when no train in the `trains` table operates this route,
 * or every matching train is off on this specific day of week — the only
 * two conditions under which the UI may say "No trains found."
 */
export const searchTrains = async (params: {
  fromStationId: string;
  toStationId:   string;
  date:          string; // "YYYY-MM-DD"
}): Promise<TrainSearchResult[]> => {
  const route = await getStationsByIds(params.fromStationId, params.toStationId);
  if (!route) return [];

  const routeTrains = await getTrainsForRoute(route.from.id, route.to.id);
  if (!routeTrains.length) return [];

  // Day-of-week filter (INCLUSION list, Sunday=0 — Part 07 §7.2).
  const dayNumber = new Date(params.date + 'T00:00:00').getDay();
  const runningTrains = routeTrains.filter(
    (t) => Array.isArray(t.days_of_week) && t.days_of_week.includes(dayNumber)
  );
  if (!runningTrains.length) return [];

  const trainIds = runningTrains.map((t) => t.id);
  const timings = await getVerifiedTimings(trainIds, route.from.id, route.to.id);

  const results: TrainSearchResult[] = runningTrains.map((train) => {
    const timing = timings.get(train.id);

    if (timing?.departure_time && timing?.arrival_time) {
      const depart = timing.departure_time.slice(0, 5);
      const arrive = timing.arrival_time.slice(0, 5);
      const [dh, dm] = depart.split(':').map(Number);
      const [ah, am] = arrive.split(':').map(Number);
      const departMins = dh * 60 + dm;
      const arriveMins = ah * 60 + am;
      const duration = arriveMins >= departMins
        ? arriveMins - departMins
        : (24 * 60 - departMins) + arriveMins;

      return {
        verified:         true,
        train_id:         train.id,
        train_number:     train.number,
        train_name_en:    train.name_en,
        train_type:       train.type ?? '',
        departure_time:   depart,
        arrival_time:     arrive,
        duration_minutes: duration,
        days_of_week:     Array.isArray(train.days_of_week) ? train.days_of_week : [],
      };
    }

    // No verified Tier 2 data — Tier 1 result only, no fabricated times.
    return {
      verified:      false,
      train_id:      train.id,
      train_number:  train.number,
      train_name_en: train.name_en,
      train_type:    train.type ?? '',
      days_of_week:  Array.isArray(train.days_of_week) ? train.days_of_week : [],
    };
  });

  return results.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.verified && b.verified) return a.departure_time.localeCompare(b.departure_time);
    return a.train_number.localeCompare(b.train_number, undefined, { numeric: true });
  });
};

// ─── Train detail with full stop list (Tier 2 only) ─────────────────────────

/**
 * Full intermediate-stop timeline for a single train, looked up by train
 * number (the display key, e.g. "735") since that's what TrainCard
 * navigates with. This is ONLY meaningful when the train has verified
 * train_stops data — callers MUST check `stops.length > 0` before
 * rendering a timeline; an empty array here means "not verified yet," not
 * "this train has no stops."
 */
export const getTrainWithStops = async (trainNumber: string): Promise<TrainDetailWithStops | null> => {
  const { data: train, error: trainError } = await supabase
    .from('trains')
    .select('id, number, name_en, name_bn, type, days_of_week, origin_id, destination_id, is_active')
    .eq('number', trainNumber)
    .single();

  if (trainError || !train) {
    logger.error('[getTrainWithStops] train query failed', trainError);
    return null;
  }

  const { data: stops, error: stopsError } = await supabase
    .from('train_stops')
    .select('id, train_id, station_id, sequence, arrival_time, departure_time, halt_minutes')
    .eq('train_id', (train as any).id)
    .order('sequence', { ascending: true });

  const [originRes, destRes] = await Promise.all([
    supabase.from('stations').select('id, code, name_en, name_bn, division, zone, is_major, latitude, longitude').eq('id', (train as any).origin_id).maybeSingle(),
    supabase.from('stations').select('id, code, name_en, name_bn, division, zone, is_major, latitude, longitude').eq('id', (train as any).destination_id).maybeSingle(),
  ]);
  const origin = (originRes.data ?? null) as Station | null;
  const destination = (destRes.data ?? null) as Station | null;

  if (stopsError) {
    logger.error('[getTrainWithStops] stops query failed', stopsError);
    // Train metadata is still valid even if stops fail to load — return it
    // with an empty stop list rather than failing the whole detail screen.
    return { ...(train as any), stops: [], origin, destination };
  }

  if (!stops?.length) {
    // No verified timetable for this train yet — not an error.
    return { ...(train as any), stops: [], origin, destination };
  }

  // Join station details for each stop
  const stationIds = [...new Set((stops as any[]).map((s) => s.station_id))];
  const { data: stationRows, error: stationErr } = await supabase
    .from('stations')
    .select('id, code, name_en, name_bn, division, zone, is_major, latitude, longitude')
    .in('id', stationIds);

  if (stationErr) {
    logger.error('[getTrainWithStops] station join failed', stationErr);
    return { ...(train as any), stops: [], origin, destination };
  }

  const stationById = new Map((stationRows as Station[]).map((s) => [s.id, s]));
  const stopsWithStation = (stops as any[])
    .map((stop) => {
      const station = stationById.get(stop.station_id);
      if (!station) return null;
      return { ...stop, station };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return { ...(train as any), stops: stopsWithStation, origin, destination };
};
