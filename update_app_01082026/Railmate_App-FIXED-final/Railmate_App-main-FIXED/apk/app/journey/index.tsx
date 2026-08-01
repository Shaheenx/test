import { Redirect } from 'expo-router';
export default function JourneyRedirect() {
  return <Redirect href={'/journey-tools' as any} />;
}
