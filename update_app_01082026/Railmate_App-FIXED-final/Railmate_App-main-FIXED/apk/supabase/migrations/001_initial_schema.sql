-- ============================================================
-- RailMate Bangladesh — Initial Schema Migration
-- ============================================================

-- EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: stations
-- ============================================================
CREATE TABLE stations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(10)  UNIQUE NOT NULL,
  name_en       VARCHAR(100) NOT NULL,
  name_bn       VARCHAR(100) NOT NULL,
  division      VARCHAR(50),
  zone          VARCHAR(10),             -- 'East' | 'West'
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  is_major      BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stations_code    ON stations(code);
CREATE INDEX idx_stations_name_en ON stations(name_en);

-- ============================================================
-- TABLE: trains
-- ============================================================
CREATE TABLE trains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          VARCHAR(10) UNIQUE NOT NULL,
  name_en         VARCHAR(150) NOT NULL,
  name_bn         VARCHAR(150) NOT NULL,
  type            VARCHAR(30) NOT NULL,  -- 'Intercity' | 'Mail' | 'Local' | 'Express'
  origin_id       UUID REFERENCES stations(id),
  destination_id  UUID REFERENCES stations(id),
  days_of_week    SMALLINT[] NOT NULL,   -- [0..6] Sunday=0
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  last_verified   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trains_number        ON trains(number);
CREATE INDEX idx_trains_origin_dest   ON trains(origin_id, destination_id);
CREATE INDEX idx_trains_days_of_week  ON trains USING GIN(days_of_week);

-- ============================================================
-- TABLE: train_stops
-- ============================================================
CREATE TABLE train_stops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id        UUID REFERENCES trains(id) ON DELETE CASCADE,
  station_id      UUID REFERENCES stations(id),
  sequence        SMALLINT NOT NULL,
  arrival_time    TIME,                  -- NULL for first stop
  departure_time  TIME,                  -- NULL for last stop
  halt_minutes    SMALLINT DEFAULT 0,
  is_major_stop   BOOLEAN DEFAULT false,
  UNIQUE(train_id, sequence),
  UNIQUE(train_id, station_id)
);
CREATE INDEX idx_stops_train_id   ON train_stops(train_id);
CREATE INDEX idx_stops_station_id ON train_stops(station_id);

-- ============================================================
-- TABLE: fares
-- ============================================================
CREATE TABLE fares (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id         UUID REFERENCES trains(id),  -- NULL = applies to all trains
  from_station_id  UUID REFERENCES stations(id),
  to_station_id    UUID REFERENCES stations(id),
  class            VARCHAR(30) NOT NULL,
    -- 'SHOVON' | 'SHOVON_CHAIR' | 'SNIGDHA' | 'AC_BERTH'
    -- 'AC_SEAT' | 'FIRST_BERTH' | 'FIRST_SEAT' | 'AC_S_CHAIR'
  price_bdt        INTEGER NOT NULL,
  last_verified    DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fares_route ON fares(from_station_id, to_station_id);
CREATE INDEX idx_fares_train ON fares(train_id);
CREATE INDEX idx_fares_class ON fares(class);

-- ============================================================
-- TABLE: users (mirrors auth.users)
-- ============================================================
CREATE TABLE users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               VARCHAR(20),
  email               VARCHAR(255),
  display_name        VARCHAR(100),
  avatar_url          TEXT,
  language_pref       VARCHAR(5) DEFAULT 'bn',    -- 'bn' | 'en'
  theme_pref          VARCHAR(10) DEFAULT 'dark',  -- 'dark' | 'light' | 'system'
  is_premium          BOOLEAN DEFAULT false,
  premium_expires_at  TIMESTAMPTZ,
  report_count        INTEGER DEFAULT 0,
  trust_score         DECIMAL(4,2) DEFAULT 1.00,
  is_banned           BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: saved_routes (AsyncStorage for MVP — this table for future sync)
-- ============================================================
CREATE TABLE saved_routes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  label               VARCHAR(100),
  from_station_id     UUID REFERENCES stations(id),
  to_station_id       UUID REFERENCES stations(id),
  preferred_train_id  UUID REFERENCES trains(id),
  display_order       SMALLINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_saved_routes_user ON saved_routes(user_id);

-- ============================================================
-- STORED FUNCTION: search_trains
-- Core search logic — called via supabase.rpc('search_trains', {...})
-- ============================================================
CREATE OR REPLACE FUNCTION search_trains(
  p_from_station_id UUID,
  p_to_station_id   UUID,
  p_journey_date    DATE
)
RETURNS TABLE (
  train_id          UUID,
  train_number      VARCHAR,
  train_name_en     VARCHAR,
  train_name_bn     VARCHAR,
  train_type        VARCHAR,
  departure_time    TIME,
  arrival_time      TIME,
  duration_minutes  INTEGER,
  available_classes TEXT[]
) AS $$
  SELECT DISTINCT
    t.id,
    t.number,
    t.name_en,
    t.name_bn,
    t.type,
    ts_from.departure_time,
    ts_to.arrival_time,
    EXTRACT(EPOCH FROM (ts_to.arrival_time - ts_from.departure_time))::INTEGER / 60
      AS duration_minutes,
    ARRAY(
      SELECT DISTINCT f.class
      FROM fares f
      WHERE (f.train_id = t.id OR f.train_id IS NULL)
        AND f.from_station_id = p_from_station_id
        AND f.to_station_id   = p_to_station_id
      ORDER BY f.class
    ) AS available_classes
  FROM trains t
  JOIN train_stops ts_from
    ON ts_from.train_id  = t.id
   AND ts_from.station_id = p_from_station_id
  JOIN train_stops ts_to
    ON ts_to.train_id  = t.id
   AND ts_to.station_id = p_to_station_id
  WHERE t.is_active = true
    AND ts_from.sequence < ts_to.sequence
    AND EXTRACT(DOW FROM p_journey_date)::SMALLINT = ANY(t.days_of_week)
  ORDER BY ts_from.departure_time;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- stations and trains: public read
ALTER TABLE stations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains      ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE fares       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stations"    ON stations    FOR SELECT USING (true);
CREATE POLICY "Public read trains"      ON trains      FOR SELECT USING (true);
CREATE POLICY "Public read train_stops" ON train_stops FOR SELECT USING (true);
CREATE POLICY "Public read fares"       ON fares       FOR SELECT USING (true);

-- users: own row only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"
  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- saved_routes: private to owner
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved routes"
  ON saved_routes FOR ALL USING (auth.uid() = user_id);
