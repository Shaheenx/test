// hooks/useCommunityReports.ts
//
// TanStack Query v5 hooks for community reports.
// Handles fetching, voting (with optimistic updates), and submission.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCommunityReports,
  getUserVotesForReports,
  searchStations,
  searchTrains,
  submitReport,
  uploadReportPhoto,
  voteOnReport,
  getReportComments,
  addReportComment,
  getReportVerifiers,
  getDelayStatusForTrains,
  type ReportComment,
  type TrainDelayStatus,
} from '../api/community';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type {
  CommunityReport,
  ReportFilter,
  ReportSubmitData,
  VoteType,
  ReportVerifier,
} from '../types/report.types';

// ─── Query key factory ────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['community_reports'] as const,
  filtered: (filter: ReportFilter) =>
    [...communityKeys.all, filter] as const,
  comments: (reportId: string) => ['report_comments', reportId] as const,
  trains: (query: string) => ['trains_search', query] as const,
  stations: (query: string) => ['stations_search', query] as const,
  popularTrains: ['trains_popular'] as const,
};

// ─── Feed query ───────────────────────────────────────────────────────────────

export function useCommunityReports(filter?: ReportFilter) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: communityKeys.filtered(filter ?? null),
    queryFn: async (): Promise<CommunityReport[]> => {
      const reports = await getCommunityReports(filter);

      if (user?.id && reports.length > 0) {
        const ids = reports.map((r) => r.id);
        const votesMap = await getUserVotesForReports(user.id, ids);
        return reports.map((r) => ({
          ...r,
          current_user_vote: votesMap[r.id] ?? null,
        }));
      }

      return reports;
    },
    staleTime: 30_000,
  });
}

// ─── Vote mutation (with optimistic update) ───────────────────────────────────

interface VoteVariables {
  reportId: string;
  voteType: VoteType;
  existingVote: VoteType | null;
  activeFilter: ReportFilter;
}

export function useVoteReport() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ reportId, voteType, existingVote }: VoteVariables) => {
      if (!user?.id) throw new Error('Not authenticated');
      return voteOnReport(reportId, user.id, voteType, existingVote);
    },

    onMutate: async ({ reportId, voteType, existingVote, activeFilter }) => {
      const queryKey = communityKeys.filtered(activeFilter);
      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<CommunityReport[]>(queryKey);

      queryClient.setQueryData<CommunityReport[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((report) => {
          if (report.id !== reportId) return report;

          const isToggleOff = existingVote === voteType;
          const wasConfirm = existingVote === 'CONFIRM';
          const wasDispute = existingVote === 'DISPUTE';

          let verificationCount = report.verification_count;
          let disputeCount = report.dispute_count;

          if (isToggleOff) {
            if (voteType === 'CONFIRM') verificationCount -= 1;
            else disputeCount -= 1;
          } else {
            if (voteType === 'CONFIRM') {
              verificationCount += 1;
              if (wasDispute) disputeCount -= 1;
            } else {
              disputeCount += 1;
              if (wasConfirm) verificationCount -= 1;
            }
          }

          return {
            ...report,
            verification_count: Math.max(0, verificationCount),
            dispute_count: Math.max(0, disputeCount),
            current_user_vote: isToggleOff ? null : voteType,
          };
        });
      });

      return { previousData, queryKey };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },

    onSettled: (_data, _err, { activeFilter }) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.filtered(activeFilter),
      });
    },
  });
}

// ─── Submit report mutation ───────────────────────────────────────────────────

interface SubmitReportVariables {
  data: ReportSubmitData;
  photoUri?: string;
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ data, photoUri }: SubmitReportVariables) => {
      if (!user?.id) throw new Error('Not authenticated');

      let photo_url: string | undefined;
      if (photoUri) {
        photo_url = await uploadReportPhoto(user.id, photoUri);
      }

      return submitReport({ ...data, user_id: user.id, photo_url });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

// ─── Comments queries ─────────────────────────────────────────────────────────

export function useReportComments(reportId: string) {
  return useQuery({
    queryKey: communityKeys.comments(reportId),
    queryFn: () => getReportComments(reportId),
    enabled: !!reportId,
    staleTime: 15_000,
  });
}

export function useAddComment(reportId: string, activeFilter: ReportFilter) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (body: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      return addReportComment(reportId, user.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.comments(reportId),
      });
      queryClient.invalidateQueries({
        queryKey: communityKeys.filtered(activeFilter),
      });
    },
  });
}

/**
 * Real, per-report list of CONFIRM voters — powers the "Verified by" avatar
 * stack and "User Confirmations" checkmarks on the Report Detail screen.
 */
export function useReportVerifiers(reportId: string) {
  return useQuery<ReportVerifier[]>({
    queryKey: ['report_verifiers', reportId],
    queryFn: () => getReportVerifiers(reportId),
    enabled: !!reportId,
    staleTime: 30_000,
  });
}

// ─── Train / Station search hooks (for submit sheet selectors) ────────────────

export function useTrainSearch(query: string) {
  return useQuery({
    queryKey: communityKeys.trains(query),
    queryFn: () => searchTrains(query),
    enabled: query.length >= 1,
    staleTime: 60_000,
  });
}

// Popular trains for the quick-pick row in submit-report.tsx Step 1.
// Implemented directly via supabase rather than api/community to avoid
// adding a function to community.ts for a single static query.
export function usePopularTrains() {
  return useQuery({
    queryKey: communityKeys.popularTrains,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trains')
        .select('id, number, name_en, name_bn')
        .order('number')
        .limit(6);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        number: string;
        name_en: string;
        name_bn: string | null;
      }[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useStationSearch(query: string) {
  return useQuery({
    queryKey: communityKeys.stations(query),
    queryFn: () => searchStations(query),
    enabled: query.length >= 1,
    staleTime: 60_000,
  });
}

// Re-export ReportComment type for consumers
export type { ReportComment };

/**
 * Batched delay-status lookup for a list of search-result trains.
 */
export function useTrainDelayStatus(trainNumbers: string[], journeyDate: string) {
  return useQuery<Map<string, TrainDelayStatus>>({
    queryKey: ['train_delay_status', trainNumbers.slice().sort(), journeyDate],
    queryFn: () => getDelayStatusForTrains(trainNumbers, journeyDate),
    enabled: trainNumbers.length > 0 && !!journeyDate,
    staleTime: 60_000,
  });
}
