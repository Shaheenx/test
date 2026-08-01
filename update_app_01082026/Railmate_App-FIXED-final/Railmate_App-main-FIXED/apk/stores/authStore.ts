import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  language_pref?: string;
  theme_pref?: string;
  is_premium?: boolean;
  premium_expires_at?: string | null;
  is_trusted?: boolean;
  trust_score?: number;
  report_count?: number;
  helpful_vote_count?: number;
  push_token?: string | null;
  created_at?: string;
}

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  // isAuthenticated is derived purely from whether a valid session exists,
  // not from whether the user profile has been loaded — prevents dual-setter
  // race conditions between setUser and setSession.
  isAuthenticated: boolean;
  isGuest: boolean;
  isPremium: boolean;
  setUser: (user: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setGuest: (val: boolean) => void;
  setPremium: (val: boolean) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isGuest: false,
      isPremium: false,

      // Session is the source of truth for authentication.
      setSession: (session) =>
        set({ session, isAuthenticated: !!session?.access_token }),

      // Setting user does NOT change isAuthenticated — only setSession does.
      setUser: (user) => set({
        user,
        isPremium: user?.is_premium ?? false,
      }),

      setGuest: (val) => set({ isGuest: val }),

      setPremium: (val) => set({ isPremium: val }),

      clearAuth: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isGuest: false,
          isPremium: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'railmate-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        // Rehydrate as false — initialize() will set the correct value after
        // verifying the session with Supabase on next app launch.
        isAuthenticated: false,
        isGuest: state.isGuest,
        isPremium: state.isPremium,
      }),
    }
  )
);
