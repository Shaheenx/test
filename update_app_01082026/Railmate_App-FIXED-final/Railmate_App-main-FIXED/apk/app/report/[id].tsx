import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ReportByIdRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/report-detail?id=${id ?? ''}` as any} />;
}
