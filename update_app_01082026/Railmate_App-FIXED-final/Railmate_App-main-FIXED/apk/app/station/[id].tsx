import { Redirect, useLocalSearchParams } from 'expo-router';

export default function StationByIdRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/station-information?id=${id ?? ''}` as any} />;
}
