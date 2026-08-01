import { supabase } from '../lib/supabase';
import type { Alert, AlertType } from '../types/database.types';
import { canPerformAction } from '../lib/featureGates';

/**
 * Get all active alerts for a user
 */
export async function getAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      train:trains(id, number, name_en, name_bn),
      from_station:stations!from_station_id(id, code, name_en, name_bn, division, zone, is_major),
      to_station:stations!to_station_id(id, code, name_en, name_bn, division, zone, is_major)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((alert) => ({
    ...alert,
    train: Array.isArray(alert.train) ? alert.train[0] : alert.train,
    from_station: Array.isArray(alert.from_station)
      ? alert.from_station[0]
      : alert.from_station,
    to_station: Array.isArray(alert.to_station)
      ? alert.to_station[0]
      : alert.to_station,
  })) as Alert[];
}

/**
 * Create a new alert
 * FREE TIER LIMIT: max 1 alert per day
 */
export async function createAlert(
  payload: {
    user_id: string;
    train_id?: string | null;
    train_number?: string | null;
    from_station_id?: string | null;
    to_station_id?: string | null;
    alert_type: AlertType;
    journey_date: string;
    notify_before_mins?: number | null;
  },
  isPremium: boolean
): Promise<Alert> {
  // Check daily alert count for free users
  if (!isPremium) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { count, error: countError } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.user_id)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${tomorrow}T00:00:00`);

    if (countError) throw new Error(countError.message);

    if (!canPerformAction('dailyAlerts', count ?? 0, isPremium)) {
      throw new Error('DAILY_ALERT_LIMIT_REACHED');
    }
  }

  // Insert new alert
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: payload.user_id,
      train_id: payload.train_id ?? null,
      train_number: payload.train_number ?? null,
      from_station_id: payload.from_station_id ?? null,
      to_station_id: payload.to_station_id ?? null,
      alert_type: payload.alert_type,
      journey_date: payload.journey_date,
      notify_before_mins: payload.notify_before_mins ?? null,
      is_active: true,
      triggered_at: null,
    })
    .select(`
      *,
      train:trains(id, number, name_en, name_bn),
      from_station:stations!from_station_id(*),
      to_station:stations!to_station_id(*)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    train: Array.isArray(data.train) ? data.train[0] : data.train,
    from_station: Array.isArray(data.from_station)
      ? data.from_station[0]
      : data.from_station,
    to_station: Array.isArray(data.to_station) ? data.to_station[0] : data.to_station,
  } as Alert;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId); // Ensure user owns this alert

  if (error) throw new Error(error.message);
}

/**
 * Mark an alert as triggered
 */
export async function markAlertTriggered(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({
      triggered_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
