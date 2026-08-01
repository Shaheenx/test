import { Redirect } from 'expo-router';
export default function ReportSubmitRedirect() {
  return <Redirect href={'/submit-report' as any} />;
}
