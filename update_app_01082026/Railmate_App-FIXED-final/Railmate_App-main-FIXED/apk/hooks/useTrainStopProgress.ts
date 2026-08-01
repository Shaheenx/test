import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface TrainStopProgress {
  station_id: string;
  station_name_en: string;
  sequence: number;
  estimated_arrival: string;
  estimated_departure: string;
  has_passed: boolean;
}

export function useTrainStopProgress(trainId: string | null, journeyDate: string) {
  return useQuery<TrainStopProgress[]>({
    queryKey: ['train_stop_progress', trainId, journeyDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_train_stop_progress', {
        p_train_id: trainId!,
        p_journey_date: journeyDate,
      });
      if (error) {
        logger.error('[useTrainStopProgress]', error);
        throw error;
      }
      return (data ?? []) as TrainStopProgress[];
    },
    enabled: !!trainId && !!journeyDate,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}
