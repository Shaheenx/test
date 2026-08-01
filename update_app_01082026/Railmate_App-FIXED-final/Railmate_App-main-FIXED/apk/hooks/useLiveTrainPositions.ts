import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LiveTrainPosition } from '../types/liveTracking.types';
import { logger } from '../lib/logger';

export function useLiveTrainPositions(journeyDate: string) {
  return useQuery<LiveTrainPosition[]>({
    queryKey: ['live_train_positions', journeyDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_live_train_positions', {
        p_journey_date: journeyDate,
      });
      if (error) {
        logger.error('[useLiveTrainPositions]', error);
        throw error;
      }
      return (data ?? []) as LiveTrainPosition[];
    },
    staleTime: 3 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
}

/**
 * Computes a live progress_pct (0–100) for a given train position.
 * Accepts `now` as a parameter (instead of calling Date.now() internally)
 * to allow deterministic testing.
 */
export function useComputedProgress(
  train: LiveTrainPosition,
  now: number,
): number {
  const dep =
    new Date(train.scheduled_departure).getTime() +
    train.estimated_delay_minutes * 60000;
  const arr =
    new Date(train.scheduled_arrival).getTime() +
    train.estimated_delay_minutes * 60000;
  return Math.max(0, Math.min(100, ((now - dep) / (arr - dep)) * 100));
}
