// types/report.types.ts
// Source-of-truth types for the Community / Reports feature.

export type VoteType = 'CONFIRM' | 'DISPUTE';

export type ReportType =
  | 'DELAY'
  | 'CROWD'
  | 'PLATFORM'
  | 'SCHEDULE'
  | 'GENERAL'
  | 'ACCIDENT';
export type CrowdLevel = 'EMPTY' | 'MODERATE' | 'FULL' | 'OVERCROWDED';


/**
 * Discriminated filter union passed to getCommunityReports / useQuery.
 *   null              → no filter (all active/verified reports)
 *   { type }          → filter by report_type column (DELAY, CROWD, etc.)
 *   { userId }        → filter by user_id column (My Reports tab)
 *   { status }        → filter by status column (VERIFIED tab)
 *
 * NOTE: { status: 'VERIFIED' } and { type: ReportType } are intentionally
 * separate variants — 'VERIFIED' is a status, not a report type. Using
 * { type: 'VERIFIED' } was the original bug that made the Verified tab
 * always return empty results.
 */
export type ReportFilter =
  | null
  | { type: ReportType }
  | { userId: string }
  | { userIds: string[] }
  | { status: 'VERIFIED' | 'ACTIVE' | 'DISPUTED' };

export interface CommunityReport {
  id: string;
  user_id: string;
  train_id: string | null;
  station_id: string | null;
  report_type: ReportType;
  description: string | null;
  delay_minutes: number | null;
  crowd_level: string | null;
  coach_number: string | null;
  condition_rating: number | null;
  condition_note: string | null;
  photo_url: string | null;
  reported_at: string;
  created_at: string;
  journey_date: string | null;
  status: 'ACTIVE' | 'VERIFIED' | 'DISPUTED' | 'ARCHIVED';
  verification_count: number;
  dispute_count: number;
  helpful_count: number;
  comment_count: number;
  // Injected client-side by useCommunityReports after fetching user votes
  current_user_vote?: VoteType | null;
  // Joined relations
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_trusted: boolean;
    trust_score?: number;
  } | null;
  train: {
    name_en: string;
    name_bn: string;
    number: string;
    origin?: { name_en: string; name_bn: string } | null;
    destination?: { name_en: string; name_bn: string } | null;
  } | null;
  station: {
    name_en: string;
    name_bn: string;
  } | null;
}

/**
 * A user who cast a CONFIRM vote on a report — backs the "Verified by" /
 * "User Confirmations" sections of the Report Detail screen. Sourced from
 * report_votes joined to users (see getReportVerifiers in api/community.ts);
 * this is real per-report voter data, not a fabricated avatar list.
 */
export interface ReportVerifier {
  user_id: string;
  voted_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_trusted: boolean;
  } | null;
}

/**
 * Mirrors the approved trust-tier system already shown on Profile/Badges
 * (Explorer → Contributor → Verified Traveler → Station Expert →
 * RailMate Ambassador). Duplicated here rather than imported from
 * app/(tabs)/profile.tsx, which doesn't currently export it and is out of
 * scope for this change — a shared `lib/trustTiers.ts` would be the right
 * home for this if/when profile.tsx is next touched.
 */
const REPORTER_TIERS = [
  { min: 0,  max: 20,  label: 'Explorer' },
  { min: 20, max: 50,  label: 'Contributor' },
  { min: 50, max: 75,  label: 'Verified Traveler' },
  { min: 75, max: 90,  label: 'Station Expert' },
  { min: 90, max: 101, label: 'RailMate Ambassador' },
] as const;

export function getReporterTier(trustScore: number): string {
  return (
    REPORTER_TIERS.find((b) => trustScore >= b.min && trustScore < b.max) ??
    REPORTER_TIERS[0]
  ).label;
}

export interface ReportSubmitPayload {
  train_id?: string | null;
  station_id?: string | null;
  report_type: ReportType;
  description?: string | null;
  delay_minutes?: number | null;
  crowd_level?: string | null;
  journey_date?: string | null;
}

/** Alias kept for backward compatibility with api/community.ts and
 *  hooks/useCommunityReports.ts which import this name. */
export type ReportSubmitData = ReportSubmitPayload;

export interface TrainOption {
  id: string;
  name_en: string;
  name_bn: string;
  number: string;
}

export interface StationOption {
  id: string;
  name_en: string;
  name_bn: string;
  code: string;
}