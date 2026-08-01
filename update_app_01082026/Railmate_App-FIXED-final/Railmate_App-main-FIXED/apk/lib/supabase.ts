import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Fall back to harmless placeholder values so the app (and static export)
// doesn't crash when EXPO_PUBLIC_SUPABASE_* env vars aren't set at build time.
// Real values should still be provided via .env / hosting provider env vars.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// React Native suspends JS timers while backgrounded, so autoRefreshToken's
// internal setTimeout doesn't fire off-screen — the token can go stale
// during any backgrounding (e.g. the OS image picker) and the first
// request on return fails RLS with an expired JWT. Drive refresh off
// AppState explicitly instead of relying on the timer alone.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});