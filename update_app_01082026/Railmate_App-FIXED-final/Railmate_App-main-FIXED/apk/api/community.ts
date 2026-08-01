// api/community.ts
//
// All Supabase interactions for the Community feature.
// No business logic here — only data access.

import * as FileSystem from 'expo-file-system/legacy';
import { base64ToUint8Array } from '../utils/base64';
import { compressImage } from '../utils/imageCompression';


import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  CommunityReport,
  ReportFilter,
  ReportSubmitData,
  StationOption,
  TrainOption,
  VoteType,
  ReportVerifier,
} from '../types/report.types';

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * Fetch the latest 30 ACTIVE/VERIFIED reports, with optional filters.
 * ReportFilter is a discriminated object to keep the API extensible:
 *   { type: 'DELAY' }         — filter by report_type
 *   { userId: 'abc-123' }     — filter by author
 *   null                      — no filter (return all)
 */
export async function getCommunityReports(
  filter?: ReportFilter,
): Promise<CommunityReport[]> {
  let query = supabase
    .from('community_reports')
    .select(
      `
      id,
      user_id,
      train_id,
      station_id,
      report_type:category,
      description,
      delay_minutes,
      crowd_level,
      coach_number,
      condition_rating,
      condition_note,
      photo_url,
      reported_at:created_at,
      created_at,
      journey_date,
      status,
      helpful_count,
      comment_count,
	  verification_count,
	  dispute_count,
      user:users (
        id,
        display_name,
        avatar_url,
        trust_score
      ),
      train:trains (
        name_en,
        name_bn,
        number,
		origin:stations!trains_origin_id_fkey(name_en, name_bn),
		destination:stations!trains_destination_id_fkey(name_en, name_bn)
      ),
      station:stations (
        name_en,
        name_bn
      )
      `,
    )
    .in('status', ['ACTIVE', 'VERIFIED'])
    .order('created_at', { ascending: false })
    .limit(30);

  // Apply discriminated filter
  if (filter && 'type' in filter) {
    query = query.eq('category', filter.type);
  } else if (filter && 'userId' in filter) {
    query = query.eq('user_id', filter.userId);
  } else if (filter && 'userIds' in filter) {
    // Following tab: restrict to reports authored by followed users.
    // An empty array means "not following anyone" — .in() with an empty
    // array would match nothing anyway, but we short-circuit for clarity.
    query = filter.userIds.length > 0
      ? query.in('user_id', filter.userIds)
      : query.eq('user_id', '00000000-0000-0000-0000-000000000000');
  } else if (filter && 'status' in filter) {
    // Override the default .in('status', ['ACTIVE','VERIFIED']) with a single
    // status match. Re-build the query base without the default status filter.
    // The status filter is applied separately so we can show only VERIFIED rows.
    query = query.eq('status', filter.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`getCommunityReports: ${error.message}`);
  }

  return (data ?? []) as unknown as CommunityReport[];
}

// ─── User votes ───────────────────────────────────────────────────────────────

/**
 * Returns a map of reportId → VoteType for the given user + report IDs.
 * Used to hydrate current_user_vote after fetching the feed.
 */
export async function getUserVotesForReports(
  userId: string,
  reportIds: string[],
): Promise<Record<string, VoteType>> {
  const { data, error } = await supabase
    .from('report_votes')
    .select('report_id, vote_type')
    .eq('user_id', userId)
    .in('report_id', reportIds);

  if (error) {
    logger.error('getUserVotesForReports', error);
    return {};
  }

  const map: Record<string, VoteType> = {};
  (data ?? []).forEach((row: { report_id: string; vote_type: VoteType }) => {
    map[row.report_id] = row.vote_type;
  });
  return map;
}

// ─── Voting ───────────────────────────────────────────────────────────────────

/**
 * FIX: was `.upsert(..., { onConflict: 'report_id,user_id' })` — that compiles
 * to INSERT ... ON CONFLICT DO UPDATE, and `report_votes` intentionally only
 * has INSERT/DELETE/SELECT RLS policies (no UPDATE policy). A vote is 0-or-1
 * per (user, report) anyway, so delete-then-insert covers both "toggle off"
 * and "switch vote type" without ever touching the ON CONFLICT DO UPDATE
 * path — same root cause class as the earlier avatars-bucket upload bug,
 * fixed here by removing the dependency on upsert instead of adding another
 * RLS policy.
 *
 * Caller note: disable/debounce the Confirm/Dispute buttons while a vote is
 * in flight — this is now two round-trips (delete, then insert), so a rapid
 * double-tap could interleave two overlapping calls. That's a UI-level guard,
 * not something fixable from this function alone.
 */
export async function voteOnReport(
  reportId: string,
  userId: string,
  voteType: VoteType,
  existingVote: VoteType | null,
): Promise<void> {
  // Always clear any existing vote first — covers both "toggle off" and
  // "switch type" without relying on an UPDATE RLS policy.
  if (existingVote) {
    const { error: deleteError } = await supabase
      .from('report_votes')
      .delete()
      .match({ report_id: reportId, user_id: userId });
    if (deleteError) throw new Error(`voteOnReport (delete): ${deleteError.message}`);
  }

  // Toggling off (tapped the same vote type again) — nothing left to do.
  if (existingVote === voteType) return;

  const { error: insertError } = await supabase
    .from('report_votes')
    .insert({ report_id: reportId, user_id: userId, vote_type: voteType });
  if (insertError) throw new Error(`voteOnReport (insert): ${insertError.message}`);
}

// ─── Submit report ───────────────────────────────────────────────────────────

export async function submitReport(
  data: ReportSubmitData & { user_id: string; photo_url?: string },
): Promise<void> {
  const payload = {
    user_id: data.user_id,
    train_id: data.train_id ?? null,
    station_id: data.station_id ?? null,
    category: data.report_type,
    description: data.description ?? null,
    delay_minutes: data.delay_minutes ?? null,
    crowd_level: data.crowd_level ?? null,
    photo_url: data.photo_url ?? null,
    journey_date: data.journey_date ?? new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
  };

  logger.log('[submitReport] payload', payload);

  const { error } = await supabase.from('community_reports').insert(payload);

  if (error) {
    logger.error('[submitReport] error', error);
    throw new Error(`submitReport: ${error.message} (code: ${error.code})`);
  }
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

export async function uploadReportPhoto(
  userId: string,
  localUri: string,
): Promise<string> {
  const filename = `${userId}/${Date.now()}.jpg`;
  
  // Resize + compress before reading into bytes — same treatment as avatars.
  const compressedUri = await compressImage(localUri);

  const fileInfo = await FileSystem.getInfoAsync(compressedUri);
  if (!fileInfo.exists) throw new Error('Photo file not found');

  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Use the Hermes-safe decoder instead of atob()
  const byteArray = base64ToUint8Array(base64);

  const { error } = await supabase.storage
    .from('report-photos')
    .upload(filename, byteArray, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`uploadReportPhoto: ${error.message}`);

  return supabase.storage.from('report-photos').getPublicUrl(filename).data
    .publicUrl;
}

// ─── Train / station search (for submit sheet selectors) ─────────────────────

export async function searchTrains(query: string): Promise<TrainOption[]> {
  const { data, error } = await supabase
    .from('trains')
    .select('id, name_en, name_bn, number')
    .or(`name_en.ilike.%${query}%,name_bn.ilike.%${query}%,number.ilike.%${query}%`)
    .limit(20);

  if (error) throw new Error(`searchTrains: ${error.message}`);
  return (data ?? []) as TrainOption[];
}

export async function searchStations(query: string): Promise<StationOption[]> {
  const { data, error } = await supabase
    .from('stations')
    .select('id, name_en, name_bn, code')
    .or(`name_en.ilike.%${query}%,name_bn.ilike.%${query}%,code.ilike.%${query}%`)
    .limit(20);

  if (error) throw new Error(`searchStations: ${error.message}`);
  return (data ?? []) as StationOption[];
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    trust_score: number;
  };
}

export async function getReportComments(
  reportId: string,
): Promise<ReportComment[]> {
  const { data, error } = await supabase
    .from('report_comments')
    .select(
      `
      id,
      report_id,
      user_id,
      body,
      created_at,
      user:users (
        id,
        display_name,
        avatar_url,
        trust_score
      )
      `,
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getReportComments: ${error.message}`);
  return (data ?? []) as unknown as ReportComment[];
}

export async function addReportComment(
  reportId: string,
  userId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('report_comments').insert({
    report_id: reportId,
    user_id: userId,
    body: body.trim(),
  });
  if (error) throw new Error(`addReportComment: ${error.message}`);
}

// ─── Report verifiers ───────────────────────────────────────────────────────

/**
 * Real, per-report list of users who cast a CONFIRM vote — backs the
 * "Verified by" avatar stack and "User Confirmations" rows on the Report
 * Detail screen. Capped at 20 (the UI only ever shows a handful + "+N").
 */
export async function getReportVerifiers(
  reportId: string,
): Promise<ReportVerifier[]> {
  const { data, error } = await supabase
    .from('report_votes')
    .select(
      `
      user_id,
      voted_at:created_at,
      user:users (
        id,
        display_name,
        avatar_url
      )
      `,
    )
    .eq('report_id', reportId)
    .eq('vote_type', 'CONFIRM')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('getReportVerifiers', error);
    return [];
  }
  return (data ?? []) as unknown as ReportVerifier[];
}

// ─── Delay status enrichment for search results ──────────────────────────────

export interface TrainDelayStatus {
  delayMinutes: number;
  reportedAt: string;
}

/**
 * ⚠️ ARCHITECTURAL CAUTION — see delivery notes.
 *
 * community_reports.train_id is a UUID FK into a `trains` table reached via
 * the `community_reports_train_id_fkey` constraint. The Tier 1/Tier 2 train
 * search (api/trains.ts) was deliberately rebuilt against a *different*,
 * numeric-PK `trains` table after discovering the UUID-based schema in
 * migrations/001_initial_schema.sql was "never applied to production."
 * It is NOT confirmed whether the UUID `trains` table this query joins to
 * is the same physical table, a still-live legacy table, or absent entirely
 * in the production database.
 *
 * This function is written defensively: it never throws, and if the join
 * fails or the joined `trains.number` doesn't line up with real-world train
 * numbers, it simply returns an empty map — callers render no delay pill
 * rather than a wrong one. Bridging is attempted via `trains.number` (the
 * real-world train number), NOT via UUID id, since `number` is the one
 * field both the Tier 1/2 schema and this join claim to share.
 */
export async function getDelayStatusForTrains(
  trainNumbers: string[],
  journeyDate: string,
): Promise<Map<string, TrainDelayStatus>> {
  const result = new Map<string, TrainDelayStatus>();
  if (!trainNumbers.length) return result;

  try {
    // Step 1: get delay reports for this date (no cross-table join — avoids schema
    // cache issues when the FK name isn't indexed by PostgREST yet)
    const { data: reports, error: repErr } = await supabase
      .from('community_reports')
      .select('train_id, delay_minutes, created_at')
      .eq('category', 'DELAY')
      .eq('journey_date', journeyDate)
      .not('delay_minutes', 'is', null)
      .not('train_id', 'is', null)
      .order('created_at', { ascending: false });

    if (repErr) {
      logger.error('[getDelayStatusForTrains]', repErr);
      return result;
    }

    const trainIds = [...new Set((reports ?? []).map((r: any) => r.train_id as string))];
    if (!trainIds.length) return result;

    // Step 2: resolve train_id → train number
    const { data: trains, error: trainErr } = await supabase
      .from('trains')
      .select('id, number')
      .in('id', trainIds)
      .in('number', trainNumbers);

    if (trainErr) {
      logger.error('[getDelayStatusForTrains] trains lookup', trainErr);
      return result;
    }

    const idToNumber = new Map((trains ?? []).map((t: any) => [t.id as string, t.number as string]));

    for (const row of (reports ?? []) as any[]) {
      const num = idToNumber.get(row.train_id);
      if (!num || !trainNumbers.includes(num)) continue;
      if (result.has(num)) continue; // keep only the most-recent (sorted desc)
      result.set(num, { delayMinutes: row.delay_minutes, reportedAt: row.created_at });
    }
  } catch (err) {
    logger.error('[getDelayStatusForTrains] unexpected error', err);
  }

  return result;
}
