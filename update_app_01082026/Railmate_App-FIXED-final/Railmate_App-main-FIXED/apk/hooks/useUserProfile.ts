import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/authStore';
import type { UserProfile } from '../types/database.types';

/**
 * Fetch user profile from public.users table
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserProfile | null;
}

/**
 * Hook to get current user's profile
 * Returns null for guest users
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user profile
 */
interface UpdateProfilePayload {
  display_name?: string;
  avatar_url?: string;
  language_pref?: 'en' | 'bn';
  theme_pref?: 'dark' | 'light' | 'system';
  push_token?: string | null;
}

async function updateUserProfile(
  userId: string,
  updates: UpdateProfilePayload
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserProfile;
}

/**
 * Hook to update user profile
 * Automatically invalidates profile cache and updates authStore
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (updates: UpdateProfilePayload) => {
      if (!user?.id) throw new Error('No user logged in');
      return updateUserProfile(user.id, updates);
    },
    onSuccess: (updatedProfile) => {
      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

      // Update authStore with new profile data
      setUser({
        ...user!,
        ...updatedProfile,
      });
    },
  });
}

/**
 * Increment report count (called after successful report submission)
 */
async function incrementReportCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_report_count', {
    user_id: userId,
  });

  if (error) throw new Error(error.message);
}

/**
 * Hook to increment user's report count
 */
export function useIncrementReportCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('No user logged in');
      return incrementReportCount(user.id);
    },
    onSuccess: () => {
      // Invalidate profile to refetch updated count
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}
