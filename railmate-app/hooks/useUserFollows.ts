// hooks/useUserFollows.ts
//
// TanStack Query hooks for the Follow feature (Task 3). Matches the
// query-key-factory + optimistic-mutation style already used in
// hooks/useCommunityReports.ts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export const followKeys = {
  all: ['user_follows'] as const,
  isFollowing: (followerId?: string, followedId?: string) =>
    [...followKeys.all, 'is_following', followerId, followedId] as const,
  followingIds: (followerId?: string) =>
    [...followKeys.all, 'following_ids', followerId] as const,
};

// ─── Is the current user following this profile? ──────────────────────────────

export function useIsFollowing(followedId: string | undefined) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: followKeys.isFollowing(user?.id, followedId),
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !followedId) return false;
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('followed_id', followedId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!followedId,
    staleTime: 15_000,
  });
}

// ─── All ids the current user follows (used to filter the "Following" tab) ────

export function useFollowingIds() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: followKeys.followingIds(user?.id),
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.followed_id as string);
    },
    enabled: !!user?.id,
    staleTime: 15_000,
  });
}

// ─── Follow / Unfollow mutation ────────────────────────────────────────────────

interface ToggleFollowVariables {
  followedId: string;
  isCurrentlyFollowing: boolean;
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ followedId, isCurrentlyFollowing }: ToggleFollowVariables) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', followedId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, followed_id: followedId });
        if (error) throw error;
      }
    },
    // Optimistic update, matching the pattern in useVoteReport (useCommunityReports.ts)
    onMutate: async ({ followedId, isCurrentlyFollowing }) => {
      const key = followKeys.isFollowing(user?.id, followedId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<boolean>(key);
      queryClient.setQueryData(key, !isCurrentlyFollowing);
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, { followedId }) => {
      queryClient.invalidateQueries({ queryKey: followKeys.isFollowing(user?.id, followedId) });
      queryClient.invalidateQueries({ queryKey: followKeys.followingIds(user?.id) });
    },
  });
}
