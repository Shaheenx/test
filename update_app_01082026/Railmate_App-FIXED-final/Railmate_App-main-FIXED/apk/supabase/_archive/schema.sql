-- ============================================================
-- RailMate Bangladesh — Supabase PostgreSQL Schema
-- ============================================================
-- Last Updated: 2026-06-10
-- Database: Supabase (PostgreSQL 15+)
-- Run this file FIRST before seed.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE gauge_type AS ENUM ('meter', 'broad', 'dual');
CREATE TYPE zone_type AS ENUM ('East', 'West');
CREATE TYPE station_class AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE train_direction AS ENUM ('up', 'down');
CREATE TYPE train_type AS ENUM ('intercity', 'commuter', 'special', 'mail', 'local');
CREATE TYPE seat_category AS ENUM ('ac', 'non_ac');
CREATE TYPE fare_source AS ENUM ('official', 'community', 'api_cached');

-- ============================================================
-- TABLE: stations
-- ============================================================

CREATE TABLE stations (
  id                SERIAL PRIMARY KEY,
  name_en           VARCHAR(100) NOT NULL,
  name_bn           VARCHAR(100),
  code              VARCHAR(8)   NOT NULL UNIQUE,
  shohoz_city       VARCHAR(60)  NOT NULL UNIQUE,
  zone              zone_type    NOT NULL,
  division          VARCHAR(40)  NOT NULL,
  gauge             gauge_type   NOT NULL,
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  is_intercity_hub  BOOLEAN      NOT NULL DEFAULT false,
  station_class     station_class,
  note              TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_code        ON stations(code);
CREATE INDEX idx_stations_shohoz_city ON stations(shohoz_city);
CREATE INDEX idx_stations_zone        ON stations(zone);
CREATE INDEX idx_stations_hub         ON stations(is_intercity_hub);

COMMENT ON TABLE stations IS 'Bangladesh Railway intercity stations. 52 bookable stations as of June 2026. Total BR network has 440 stations.';
COMMENT ON COLUMN stations.code IS '4-letter station code used internally and on Wikipedia';
COMMENT ON COLUMN stations.shohoz_city IS 'UPPERCASE city string used as from_city/to_city in Shohoz API calls';

-- ============================================================
-- TABLE: seat_classes
-- ============================================================

CREATE TABLE seat_classes (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(20)   NOT NULL UNIQUE,
  name_en         VARCHAR(60)   NOT NULL,
  name_bn         VARCHAR(60),
  category        seat_category NOT NULL,
  has_ac          BOOLEAN       NOT NULL DEFAULT false,
  has_berth       BOOLEAN       NOT NULL DEFAULT false,
  comfort_level   SMALLINT      CHECK (comfort_level BETWEEN 1 AND 5),
  description     TEXT,
  booking_available BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE seat_classes IS 'All seat classes used in Bangladesh Railway. Code field matches Shohoz API seat_class parameter exactly.';
COMMENT ON COLUMN seat_classes.code IS 'Exact string value for Shohoz API seat_class parameter (e.g. S_CHAIR, SNIGDHA, AC_B)';

-- ============================================================
-- TABLE: trains
-- ============================================================

CREATE TABLE trains (
  id              SERIAL PRIMARY KEY,
  number          SMALLINT      NOT NULL UNIQUE,
  name            VARCHAR(80)   NOT NULL,
  model           VARCHAR(100)  NOT NULL UNIQUE,
  direction       train_direction NOT NULL,
  pair_number     SMALLINT      REFERENCES trains(number),
  train_type      train_type    NOT NULL DEFAULT 'intercity',
  gauge           gauge_type    NOT NULL,
  off_days        TEXT[],
  origin_city     VARCHAR(60)   REFERENCES stations(shohoz_city),
  destination_city VARCHAR(60)  REFERENCES stations(shohoz_city),
  confidence      VARCHAR(10)   NOT NULL DEFAULT 'high' CHECK (confidence IN ('high','medium','low')),
  note            TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trains_number      ON trains(number);
CREATE INDEX idx_trains_name        ON trains(name);
CREATE INDEX idx_trains_direction   ON trains(direction);
CREATE INDEX idx_trains_type        ON trains(train_type);
CREATE INDEX idx_trains_origin      ON trains(origin_city);
CREATE INDEX idx_trains_destination ON trains(destination_city);

COMMENT ON TABLE trains IS '133 Bangladesh Railway trains (intercity, commuter, special). Source: trains_en.json (MIT).';
COMMENT ON COLUMN trains.model IS 'Exact model string for POST /v1.0/web/train-routes API calls';
COMMENT ON COLUMN trains.pair_number IS 'The opposite-direction train number that this train is paired with';
COMMENT ON COLUMN trains.off_days IS 'Days when this train does not run, e.g. ARRAY[''friday'',''saturday'']';

-- ============================================================
-- TABLE: train_stops
-- ============================================================

CREATE TABLE train_stops (
  id              SERIAL PRIMARY KEY,
  train_number    SMALLINT      NOT NULL REFERENCES trains(number) ON DELETE CASCADE,
  station_code    VARCHAR(8)    NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
  stop_sequence   SMALLINT      NOT NULL,
  arrive_time     TIME,
  depart_time     TIME,
  day_offset      SMALLINT      NOT NULL DEFAULT 0,
  is_origin       BOOLEAN       NOT NULL DEFAULT false,
  is_destination  BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (train_number, stop_sequence),
  UNIQUE (train_number, station_code),
  CHECK (is_origin = false OR depart_time IS NOT NULL),
  CHECK (is_destination = false OR arrive_time IS NOT NULL),
  CHECK (day_offset >= 0 AND day_offset <= 2)
);

CREATE INDEX idx_train_stops_train   ON train_stops(train_number);
CREATE INDEX idx_train_stops_station ON train_stops(station_code);
CREATE INDEX idx_train_stops_seq     ON train_stops(train_number, stop_sequence);

COMMENT ON TABLE train_stops IS 'Stop sequence for each train. Currently 8 key trains seeded (43 stops). Remaining ~116 trains require API seeding — see DATA_UPDATE_PROCESS.md.';
COMMENT ON COLUMN train_stops.day_offset IS '0 = same day as departure, 1 = arrives next day. For overnight trains.';

-- ============================================================
-- TABLE: fare_cache
-- Fares fetched live from Shohoz API and cached here
-- ============================================================

CREATE TABLE fare_cache (
  id              SERIAL PRIMARY KEY,
  from_city       VARCHAR(60)   NOT NULL REFERENCES stations(shohoz_city),
  to_city         VARCHAR(60)   NOT NULL REFERENCES stations(shohoz_city),
  train_number    SMALLINT      NOT NULL REFERENCES trains(number),
  seat_class_code VARCHAR(20)   NOT NULL REFERENCES seat_classes(code),
  base_fare       DECIMAL(10,2) NOT NULL,
  vat_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  online_charge   DECIMAL(10,2) NOT NULL DEFAULT 25,
  total_fare      DECIMAL(10,2) GENERATED ALWAYS AS (base_fare + vat_amount + online_charge) STORED,
  source          fare_source   NOT NULL DEFAULT 'api_cached',
  journey_date    DATE          NOT NULL,
  fetched_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  UNIQUE (from_city, to_city, train_number, seat_class_code, journey_date)
);

CREATE INDEX idx_fare_cache_route   ON fare_cache(from_city, to_city);
CREATE INDEX idx_fare_cache_train   ON fare_cache(train_number);
CREATE INDEX idx_fare_cache_expires ON fare_cache(expires_at);

COMMENT ON TABLE fare_cache IS 'Live fare data cached from Shohoz API. Auto-expires after 24h. Never use as source-of-truth without checking expires_at.';

-- ============================================================
-- TABLE: sample_fares
-- Reference fares from community sources (NOT for live pricing)
-- ============================================================

CREATE TABLE sample_fares (
  id              SERIAL PRIMARY KEY,
  from_city       VARCHAR(60)   NOT NULL,
  to_city         VARCHAR(60)   NOT NULL,
  seat_class_code VARCHAR(20)   NOT NULL REFERENCES seat_classes(code),
  base_fare       DECIMAL(10,2) NOT NULL,
  vat_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  online_charge   DECIMAL(10,2) NOT NULL DEFAULT 25,
  total_fare      DECIMAL(10,2) GENERATED ALWAYS AS (base_fare + vat_amount + online_charge) STORED,
  source          VARCHAR(20)   NOT NULL DEFAULT 'community',
  verified_date   DATE,
  note            TEXT          DEFAULT 'SAMPLE ONLY — not for live pricing',

  UNIQUE (from_city, to_city, seat_class_code)
);

COMMENT ON TABLE sample_fares IS 'Community-sourced reference fares. Use only for display/comparison. Always fetch live fares from fare_cache/API for actual booking flows.';

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trains_updated_at
  BEFORE UPDATE ON trains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_train_stops_updated_at
  BEFORE UPDATE ON train_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE stations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_classes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains        ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_stops   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_fares  ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to reference data
CREATE POLICY "Public can read stations"
  ON stations FOR SELECT USING (true);

CREATE POLICY "Public can read seat_classes"
  ON seat_classes FOR SELECT USING (true);

CREATE POLICY "Public can read trains"
  ON trains FOR SELECT USING (true);

CREATE POLICY "Public can read train_stops"
  ON train_stops FOR SELECT USING (true);

CREATE POLICY "Public can read fare_cache"
  ON fare_cache FOR SELECT USING (true);

CREATE POLICY "Public can read sample_fares"
  ON sample_fares FOR SELECT USING (true);

-- Only service role can write (your Next.js backend with SUPABASE_SERVICE_KEY)
CREATE POLICY "Service role can insert fare_cache"
  ON fare_cache FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update fare_cache"
  ON fare_cache FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete expired fare_cache"
  ON fare_cache FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: Trains with origin and destination names
CREATE VIEW v_trains_with_stations AS
SELECT
  t.id,
  t.number,
  t.name,
  t.direction,
  t.train_type,
  t.gauge,
  t.off_days,
  t.is_active,
  os.name_en AS origin_name,
  os.code    AS origin_code,
  ds.name_en AS destination_name,
  ds.code    AS destination_code
FROM trains t
LEFT JOIN stations os ON os.shohoz_city = t.origin_city
LEFT JOIN stations ds ON ds.shohoz_city = t.destination_city;

-- View: Complete train schedule (stops with station details)
CREATE VIEW v_train_schedule AS
SELECT
  tr.number         AS train_number,
  tr.name           AS train_name,
  tr.direction,
  ts.stop_sequence,
  ts.arrive_time,
  ts.depart_time,
  ts.day_offset,
  ts.is_origin,
  ts.is_destination,
  st.name_en        AS station_name,
  st.code           AS station_code,
  st.shohoz_city,
  st.division,
  st.lat,
  st.lng
FROM train_stops ts
JOIN trains  tr ON tr.number = ts.train_number
JOIN stations st ON st.code   = ts.station_code
ORDER BY tr.number, ts.stop_sequence;

-- View: Live fare cache (non-expired only)
CREATE VIEW v_live_fares AS
SELECT
  fc.*,
  sc.name_en AS seat_class_name,
  sc.has_ac,
  sc.comfort_level
FROM fare_cache fc
JOIN seat_classes sc ON sc.code = fc.seat_class_code
WHERE fc.expires_at > NOW();

-- ============================================================
-- CLEANUP FUNCTION (run via cron or pg_cron)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_fares()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM fare_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_fares IS 'Call via Supabase Edge Function cron to purge expired fare cache entries daily.';
