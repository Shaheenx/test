import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Catches unmatched routes (e.g. railmatebd:/// empty-path deep link) and
// redirects to home instead of showing the Expo Router 404 screen.
export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)');
  }, [router]);

  return null;
}
