export type TrainClass =
  | 'SHOVON'
  | 'SHOVON_CHAIR'
  | 'SNIGDHA'
  | 'AC_BERTH'
  | 'AC_SEAT'
  | 'FIRST_BERTH'
  | 'FIRST_SEAT'
  | 'AC_S_CHAIR';

/**
 * SCHEMA DECISION (2026-06-19, reaffirmed 2026-06-20): the canonical schema
 * is migrations/001_initial_schema.sql — UUID PKs, days_of_week SMALLINT[],
 * the search_trains() Postgres RPC. This matches the Master Reference
 * (Part 07) exactly and matches what railmate-website/lib/train-search.ts
 * queries. The old schema.sql (SERIAL PKs, shohoz_city, off_days text[]) is
 * archived in supabase/_archive/ and must not be restored anywhere,
 * including here. If you believe production is actually running the old
 * schema, verify with one query against the real Supabase project —
 * `SELECT column_name, data_type FROM information_schema.columns WHERE
 * table_name='trains'` — before changing this file again. Two prior
 * remediation passes each changed this assertion in opposite directions
 * without running that query; don't make it three.
 *
 * 2026-07-16: latitude/longitude added to Station. These columns have
 * existed on `stations` since migrations/001_initial_schema.sql (Part 07
 * §7.2) but were never selected by api/trains.ts or exposed here — the
 * route-map screen had nothing to plot even before react-native-maps was
 * installed. If you add a new station-fetching query, select these two
 * columns explicitly; PostgREST does not return columns you didn't ask for.
 */
export interface Station {
  id:          string;   // UUID
  code:        string;
  name_en:     string;
  name_bn:     string;
  division:    string | null;
  zone:        string | null;
  is_major:    boolean;
  latitude?:   number | null;
  longitude?:  number | null;
}

export interface Train {
  id:              string;   // UUID
  number:          string;   // e.g. "735" — display/join key for train_stops, NOT the row PK
  name_en:         string;
  name_bn:         string;
  type:            string;
  origin_id:       string;   // UUID FK -> stations.id
  destination_id:  string;   // UUID FK -> stations.id
  days_of_week:    number[]; // INCLUSION list, Sunday=0 — Part 07 §7.2. Opposite
                              // semantics of the old off_days exclusion list;
                              // do not reintroduce that shape.
  is_active:       boolean;
}

export interface TrainStop {
  id:             string;  // UUID
  train_id:       string;  // UUID FK -> trains.id
  station_id:     string;  // UUID FK -> stations.id
  sequence:       number;
  arrival_time:   string | null; // "HH:MM:SS"
  departure_time: string | null; // "HH:MM:SS"
  halt_minutes:   number;
  station?:       Station; // joined, when requested
}

export interface Fare {
  id:              string;          // UUID
  train_id:        string | null;   // UUID FK -> trains.id, null = applies to any train on this route
  from_station_id: string;          // UUID FK -> stations.id
  to_station_id:   string;          // UUID FK -> stations.id
  class:           TrainClass;
  price_bdt:       number;
  last_verified:   string | null;
}

/**
 * TIER 1 / TIER 2 SEARCH RESULT
 * ───────────────────────────────────────────────────────────────────────────
 * Mirrors the website's lib/train-search.ts: a train is never hidden for
 * lack of verified timetable data, and a time is never shown unless it came
 * from a real train_stops row.
 *
 * Tier 1 — route existence: trains.origin_id / destination_id matched
 *          against the searched stations' UUIDs. Works for ALL trains.
 * Tier 2 — verified timetable: only present when train_stops has a row for
 *          both the from and to station with correct sequence ordering.
 */
export type TrainSearchResult =
  | {
      verified:         true;
      train_id:         string;  // UUID
      train_number:     string;
      train_name_en:    string;
      train_type:       string;
      departure_time:   string;  // "HH:MM" — real train_stops data only
      arrival_time:     string;  // "HH:MM" — real train_stops data only
      duration_minutes: number;
      days_of_week:     number[];
    }
  | {
      verified:      false;
      train_id:      string;
      train_number:  string;
      train_name_en: string;
      train_type:    string;
      days_of_week:  number[];
      // No departure_time / arrival_time / duration_minutes — Tier 2 data
      // does not exist yet. UI must show a verification notice, never an
      // estimated or placeholder time.
    };

export interface TrainDetailWithStops extends Train {
  stops:           (TrainStop & { station: Station })[];
  origin:          Station | null;
  destination:     Station | null;
}

// ─── User Profile ───────────────────────────────────────────────────────────

export interface UserProfile {
  id:                  string;   // UUID, matches auth.users.id
  phone:               string | null;
  email:               string | null;
  display_name:        string | null;
  avatar_url:          string | null;
  language_pref:       'en' | 'bn';
  theme_pref:          'dark' | 'light' | 'system';
  is_premium:          boolean;
  premium_expires_at:  string | null;  // ISO timestamp
  report_count:        number;
  trust_score:         number;
  helpful_vote_count:  number;
  is_banned:           boolean;
  push_token:          string | null;  // Expo push token
  created_at:          string;
  updated_at:          string;
}

// ─── Community Reports ──────────────────────────────────────────────────────

export type ReportType = 'DELAY' | 'CROWDING' | 'PLATFORM_CHANGE' | 'SERVICE_HALTED' | 'ON_TIME';
export type ReportStatus = 'PENDING' | 'ACTIVE' | 'VERIFIED' | 'EXPIRED' | 'FLAGGED';

export interface CommunityReport {
  id:                  string;   // UUID
  user_id:             string | null;  // UUID FK -> users.id (null = anonymous)
  train_id:            string | null;  // UUID FK -> trains.id
  train_number:        string | null;
  from_station_id:     string | null;  // UUID FK -> stations.id
  to_station_id:       string | null;  // UUID FK -> stations.id
  report_type:         ReportType;
  status:              ReportStatus;
  delay_minutes:       number | null;
  description:         string | null;
  image_url:           string | null;
  confirmed_count:     number;
  flagged_count:       number;
  created_at:          string;
  expires_at:          string | null;
  // Joined fields (when requested)
  user?:               Pick<UserProfile, 'id' | 'display_name' | 'avatar_url' | 'trust_score'> | null;
  train?:              Pick<Train, 'id' | 'number' | 'name_en' | 'name_bn'> | null;
  from_station?:       Station | null;
  to_station?:         Station | null;
}

export interface ReportVote {
  id:                  string;   // UUID
  report_id:           string;   // UUID FK -> community_reports.id
  user_id:             string;   // UUID FK -> users.id
  vote_type:           'CONFIRM' | 'FLAG';
  created_at:          string;
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export type AlertType = 'DELAY' | 'PLATFORM_CHANGE' | 'DEPARTURE';

export interface Alert {
  id:                  string;   // UUID
  user_id:             string;   // UUID FK -> users.id
  train_id:            string | null;  // UUID FK -> trains.id
  train_number:        string | null;
  from_station_id:     string | null;  // UUID FK -> stations.id
  to_station_id:       string | null;  // UUID FK -> stations.id
  alert_type:          AlertType;
  journey_date:        string;   // YYYY-MM-DD
  notify_before_mins:  number | null;  // For DEPARTURE alerts
  is_active:           boolean;
  triggered_at:        string | null;
  created_at:          string;
  // Joined fields
  train?:              Pick<Train, 'id' | 'number' | 'name_en' | 'name_bn'> | null;
  from_station?:       Station | null;
  to_station?:         Station | null;
}

// ─── Saved Routes ───────────────────────────────────────────────────────────

export interface SavedRoute {
  id:                  string;   // UUID
  user_id:             string;   // UUID FK -> users.id
  from_station_id:     string;   // UUID FK -> stations.id
  to_station_id:       string;   // UUID FK -> stations.id
  label:               string | null;  // e.g., "Work Commute"
  last_searched_at:    string | null;
  created_at:          string;
  // Joined fields
  from_station?:       Station;
  to_station?:         Station;
}

// ─── User Badges ────────────────────────────────────────────────────────────

export type BadgeType =
  | 'TRUSTED_REPORTER'
  | 'HELPFUL_TRAVELER'
  | 'EARLY_ADOPTER'
  | 'PREMIUM_MEMBER'
  | 'VERIFIED_CONTRIBUTOR';

export interface UserBadge {
  id:                  string;   // UUID
  user_id:             string;   // UUID FK -> users.id
  badge_type:          BadgeType;
  awarded_at:          string;
  expires_at:          string | null;
}

// ─── Search & Helpers ───────────────────────────────────────────────────────

export interface SavedSearch {
  id:                  string;   // Local ID (not in DB)
  from_station:        Station;
  to_station:          Station;
  searched_at:         string;   // ISO timestamp
}
