import { useQuery } from '@tanstack/react-query';
import { searchTrains } from '../api/trains';
import { getFareClassesForRoute } from '../api/fares';
import { TrainClass } from '../types/database.types';

export const useSearchTrains = (params: {
  fromStationId: string | undefined;
  toStationId:   string | undefined;
  date:          string;
}) =>
  useQuery({
    queryKey: ['trains', 'search', params],
    queryFn: () => searchTrains({
      fromStationId: params.fromStationId!,
      toStationId:   params.toStationId!,
      date:          params.date,
    }),
    enabled: !!(params.fromStationId && params.toStationId && params.date),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });

/**
 * One batched query for every train card on a results screen, instead of
 * one getFares() call per card. See getFareClassesForRoute in api/fares.ts.
 */
export const useFareClassesForRoute = (params: {
  fromStationId: string | undefined;
  toStationId:   string | undefined;
}) =>
  useQuery<Map<string, TrainClass[]>>({
    queryKey: ['fares', 'classes', params.fromStationId, params.toStationId],
    queryFn: () => getFareClassesForRoute({
      fromStationId: params.fromStationId!,
      toStationId:   params.toStationId!,
    }),
    enabled: !!(params.fromStationId && params.toStationId),
    staleTime: 5 * 60 * 1000,
  });
