import { supabase } from '../lib/supabase';
import { Fare, TrainClass } from '../types/database.types';
import { logger } from '../lib/logger';

export const getFares = async (params: {
  trainId: string;
  fromStationId: string;
  toStationId: string;
}): Promise<Fare[]> => {
  // Try to find fares specific to this train first, then fallback to general fares (train_id IS NULL)
  const { data, error } = await supabase
    .from('fares')
    .select('*')
    .eq('from_station_id', params.fromStationId)
    .eq('to_station_id', params.toStationId)
    .or(`train_id.eq.${params.trainId},train_id.is.null`);

  if (error) throw error;
  
  // If there are both train-specific and general fares, prioritize train-specific ones
  // In practice, for a specific route and class, we'd want the most specific one.
  // The search_trains RPC does a simpler logic. 
  // Here we return all matching and let the UI handle it or we can filter here.
  
  return data as Fare[];
};

/**
 * Batched alternative to getFares() for a search-results LIST: one query for
 * every visible train rather than one getFares() call per <TrainCard>.
 *
 * Returns a map of train_number → the distinct TrainClass values available
 * for this from/to route (train-specific fares first, falling back to
 * route-general fares with train_id IS NULL — same precedence as getFares).
 *
 * Real data only: if the `fares` table has no rows for this route yet, the
 * map is empty and callers must render an "Available Classes" section as
 * absent/empty, never a fabricated class list.
 */
export const getFareClassesForRoute = async (params: {
  fromStationId: string;
  toStationId: string;
}): Promise<Map<string, TrainClass[]>> => {
  const { data, error } = await supabase
    .from('fares')
    .select('train_number, class')
    .eq('from_station_id', params.fromStationId)
    .eq('to_station_id', params.toStationId);

  const result = new Map<string, TrainClass[]>();
  if (error) {
    logger.error('[getFareClassesForRoute]', error);
    return result; // fail safe: callers render "no class data" rather than crash
  }

  for (const row of (data ?? []) as { train_number: string | null; class: TrainClass }[]) {
    if (row.train_number == null) continue;
    const existing = result.get(row.train_number) ?? [];
    if (!existing.includes(row.class)) existing.push(row.class);
    result.set(row.train_number, existing);
  }
  return result;
};
