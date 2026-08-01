import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CommunityReport } from '../types/database.types';

/**
 * Subscribe to real-time community report updates
 * Only use this in the Live Updates tab, not on every screen
 *
 * Listens for INSERT and UPDATE events on community_reports table
 * Filters for ACTIVE and VERIFIED status only
 * Updates TanStack Query cache automatically
 */
export function useRealtimeReports() {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Subscribe to community_reports changes
    const channel = supabase
      .channel('community_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_reports',
          filter: 'status=in.(ACTIVE,VERIFIED)',
        },
        (payload) => {
          const newReport = payload.new as CommunityReport;

          // Add to live-updates cache
          queryClient.setQueryData<CommunityReport[]>(
            ['live-updates'],
            (old) => {
              if (!old) return [newReport];
              return [newReport, ...old];
            }
          );

          // Add to train-specific reports cache
          if (newReport.train_id && newReport.created_at) {
            const date = newReport.created_at.split('T')[0];
            queryClient.setQueryData<CommunityReport[]>(
              ['reports', newReport.train_id, date],
              (old) => {
                if (!old) return [newReport];
                return [newReport, ...old];
              }
            );
          }

          // Invalidate to trigger refetch with joined data
          queryClient.invalidateQueries({ queryKey: ['live-updates'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_reports',
          filter: 'status=in.(ACTIVE,VERIFIED)',
        },
        (payload) => {
          const updatedReport = payload.new as CommunityReport;

          // Update in live-updates cache
          queryClient.setQueryData<CommunityReport[]>(
            ['live-updates'],
            (old) => {
              if (!old) return [updatedReport];
              return old.map((report) =>
                report.id === updatedReport.id ? updatedReport : report
              );
            }
          );

          // Update in train-specific cache
          if (updatedReport.train_id && updatedReport.created_at) {
            const date = updatedReport.created_at.split('T')[0];
            queryClient.setQueryData<CommunityReport[]>(
              ['reports', updatedReport.train_id, date],
              (old) => {
                if (!old) return [updatedReport];
                return old.map((report) =>
                  report.id === updatedReport.id ? updatedReport : report
                );
              }
            );
          }

          // Invalidate to trigger refetch with joined data
          queryClient.invalidateQueries({ queryKey: ['live-updates'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [queryClient]);

  return { isSubscribed };
}
