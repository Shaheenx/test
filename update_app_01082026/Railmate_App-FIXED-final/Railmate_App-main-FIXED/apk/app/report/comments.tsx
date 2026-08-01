import { Redirect, useLocalSearchParams } from 'expo-router';
export default function ReportCommentsRedirect() {
  const { report_id } = useLocalSearchParams<{ report_id: string }>();
  return <Redirect href={`/comments-discussion?report_id=${report_id ?? ''}` as any} />;
}
