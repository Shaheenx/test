import { Redirect } from 'expo-router';
export default function BadgesRedirect() {
  return <Redirect href={'/badges-reputation' as any} />;
}
