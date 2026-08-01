import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TrainSeatFareRedirect() {
  const params = useLocalSearchParams<{ trainId: string; trainNumber: string; trainName: string; from_station_id: string; to_station_id: string }>();
  const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v ?? '')}`).join('&');
  return <Redirect href={`/seat-fare?${query}` as any} />;
}
