import { supabase } from '../lib/supabase';
import type { SavedRoute } from '../types/database.types';
import { canPerformAction } from '../lib/featureGates';

/**
 * Get all saved routes for a user
 */
export async function getSavedRoutes(userId: string): Promise<SavedRoute[]> {
  const { data, error } = await supabase
    .from('saved_routes')
    .select(`
      *,
      from_station:stations!from_station_id(id, code, name_en, name_bn, division, zone, is_major),
      to_station:stations!to_station_id(id, code, name_en, name_bn, division, zone, is_major)
    `)
    .eq('user_id', userId)
    .order('last_searched_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((route) => ({
    ...route,
    from_station: Array.isArray(route.from_station)
      ? route.from_station[0]
      : route.from_station,
    to_station: Array.isArray(route.to_station)
      ? route.to_station[0]
      : route.to_station,
  })) as SavedRoute[];
}

/**
 * Save a new route for a user
 * FREE TIER LIMIT: max 3 saved routes
 */
export async function saveRoute(
  userId: string,
  fromStationId: string,
  toStationId: string,
  label: string | null,
  isPremium: boolean
): Promise<SavedRoute> {
  // Check current count
  const { count, error: countError } = await supabase
    .from('saved_routes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw new Error(countError.message);

  // Check limit
  if (!canPerformAction('savedRoutes', count ?? 0, isPremium)) {
    throw new Error('FREE_TIER_LIMIT_REACHED');
  }

  // Check if route already exists
  const { data: existing } = await supabase
    .from('saved_routes')
    .select('id')
    .eq('user_id', userId)
    .eq('from_station_id', fromStationId)
    .eq('to_station_id', toStationId)
    .maybeSingle();

  if (existing) {
    throw new Error('ROUTE_ALREADY_SAVED');
  }

  // Insert new route
  const { data, error } = await supabase
    .from('saved_routes')
    .insert({
      user_id: userId,
      from_station_id: fromStationId,
      to_station_id: toStationId,
      label,
      last_searched_at: new Date().toISOString(),
    })
    .select(`
      *,
      from_station:stations!from_station_id(*),
      to_station:stations!to_station_id(*)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    from_station: Array.isArray(data.from_station)
      ? data.from_station[0]
      : data.from_station,
    to_station: Array.isArray(data.to_station) ? data.to_station[0] : data.to_station,
  } as SavedRoute;
}

/**
 * Delete a saved route
 */
export async function deleteRoute(routeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_routes')
    .delete()
    .eq('id', routeId)
    .eq('user_id', userId); // Ensure user owns this route

  if (error) throw new Error(error.message);
}

/**
 * Update last_searched_at timestamp for a route
 */
export async function updateRouteLastSearched(
  routeId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_routes')
    .update({ last_searched_at: new Date().toISOString() })
    .eq('id', routeId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
