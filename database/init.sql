-- ─────────────────────────────────────────────────────────────────────────────
-- GCID · Global Conflict Intelligence Dashboard · Database Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Aircraft ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aircraft (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    icao24      VARCHAR(10) NOT NULL,
    callsign    VARCHAR(20),
    country     VARCHAR(100),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    altitude    DOUBLE PRECISION,          -- metres (baro)
    velocity    DOUBLE PRECISION,          -- m/s
    heading     DOUBLE PRECISION,          -- degrees
    vertical_rate DOUBLE PRECISION,        -- m/s
    on_ground   BOOLEAN DEFAULT FALSE,
    geom        GEOMETRY(Point, 4326),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(icao24, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_aircraft_icao24    ON aircraft(icao24);
CREATE INDEX IF NOT EXISTS idx_aircraft_timestamp ON aircraft(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_aircraft_geom      ON aircraft USING GIST(geom);

-- ─── Vessels (AIS) ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vessels (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    mmsi        VARCHAR(20) NOT NULL,
    name        VARCHAR(200),
    vessel_type VARCHAR(100),
    flag        VARCHAR(10),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    speed       DOUBLE PRECISION,          -- knots
    course      DOUBLE PRECISION,          -- degrees
    heading     DOUBLE PRECISION,
    destination VARCHAR(200),
    status      VARCHAR(100),
    length      INTEGER,
    geom        GEOMETRY(Point, 4326),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(mmsi, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_vessels_mmsi      ON vessels(mmsi);
CREATE INDEX IF NOT EXISTS idx_vessels_timestamp ON vessels(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vessels_geom      ON vessels USING GIST(geom);

-- ─── Conflict Events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conflict_events (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(100) UNIQUE,
    event_type      VARCHAR(100),
    sub_event_type  VARCHAR(100),
    country         VARCHAR(200),
    region          VARCHAR(200),
    location        VARCHAR(200),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    description     TEXT,
    source          VARCHAR(500),
    source_url      VARCHAR(1000),
    severity        VARCHAR(50) DEFAULT 'medium',
    fatalities      INTEGER DEFAULT 0,
    geom            GEOMETRY(Point, 4326),
    event_date      DATE,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflicts_timestamp   ON conflict_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conflicts_event_date  ON conflict_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_conflicts_country     ON conflict_events(country);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity    ON conflict_events(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_geom        ON conflict_events USING GIST(geom);

-- ─── News Events ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_events (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(200) UNIQUE,
    headline    VARCHAR(1000) NOT NULL,
    summary     TEXT,
    url         VARCHAR(2000),
    source      VARCHAR(200),
    category    VARCHAR(100),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    country     VARCHAR(200),
    geom        GEOMETRY(Point, 4326),
    published_at TIMESTAMPTZ,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_timestamp    ON news_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_events(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source       ON news_events(source);
CREATE INDEX IF NOT EXISTS idx_news_geom         ON news_events USING GIST(geom);

-- ─── Anomaly Alerts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type  VARCHAR(100) NOT NULL,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    severity    VARCHAR(50) DEFAULT 'medium',
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    geom        GEOMETRY(Point, 4326),
    metadata    JSONB,
    resolved    BOOLEAN DEFAULT FALSE,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_timestamp ON anomaly_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_type      ON anomaly_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_resolved  ON anomaly_alerts(resolved);

-- ─── Seed: sample conflict events for offline/demo mode ───────────────────────
INSERT INTO conflict_events (external_id, event_type, country, region, location, latitude, longitude, description, source, severity, fatalities, geom, event_date)
VALUES
  ('SEED-001', 'Battles', 'Ukraine', 'Eastern Europe', 'Donetsk', 48.0159, 37.8029, 'Artillery exchange reported along the front line near Donetsk.', 'ACLED/Demo', 'high', 3, ST_SetSRID(ST_MakePoint(37.8029, 48.0159), 4326), CURRENT_DATE - INTERVAL '1 day'),
  ('SEED-002', 'Remote violence', 'Gaza Strip', 'Middle East', 'Gaza City', 31.5017, 34.4674, 'Airstrike reported in northern Gaza.', 'ACLED/Demo', 'critical', 7, ST_SetSRID(ST_MakePoint(34.4674, 31.5017), 4326), CURRENT_DATE - INTERVAL '2 days'),
  ('SEED-003', 'Protests', 'Sudan', 'Sub-Saharan Africa', 'Khartoum', 15.5007, 32.5599, 'Civil unrest and armed clashes in Khartoum city centre.', 'ACLED/Demo', 'high', 2, ST_SetSRID(ST_MakePoint(32.5599, 15.5007), 4326), CURRENT_DATE - INTERVAL '3 days'),
  ('SEED-004', 'Battles', 'Myanmar', 'Southeast Asia', 'Mandalay', 21.9588, 96.0891, 'Military offensive reported in Mandalay region.', 'ACLED/Demo', 'high', 5, ST_SetSRID(ST_MakePoint(96.0891, 21.9588), 4326), CURRENT_DATE - INTERVAL '1 day'),
  ('SEED-005', 'Remote violence', 'Yemen', 'Middle East', 'Sanaa', 15.3694, 44.1910, 'Drone strike reported near the capital.', 'ACLED/Demo', 'critical', 1, ST_SetSRID(ST_MakePoint(44.1910, 15.3694), 4326), CURRENT_DATE)
ON CONFLICT (external_id) DO NOTHING;

-- ─── Seed: sample news events ─────────────────────────────────────────────────
INSERT INTO news_events (external_id, headline, summary, url, source, country, latitude, longitude, geom, published_at)
VALUES
  ('NEWS-SEED-001', 'Ukraine reports fresh artillery bombardment in eastern sector', 'Ukrainian forces report sustained artillery fire along multiple sections of the eastern front.', 'https://example.com/1', 'Demo News', 'Ukraine', 48.3794, 31.1656, ST_SetSRID(ST_MakePoint(31.1656, 48.3794), 4326), NOW() - INTERVAL '2 hours'),
  ('NEWS-SEED-002', 'UN warns of humanitarian crisis in Gaza', 'United Nations officials warn of deteriorating humanitarian conditions.', 'https://example.com/2', 'Demo News', 'Gaza Strip', 31.3547, 34.3088, ST_SetSRID(ST_MakePoint(34.3088, 31.3547), 4326), NOW() - INTERVAL '4 hours'),
  ('NEWS-SEED-003', 'Tensions rise in South China Sea amid naval exercises', 'Multiple nations conduct naval exercises in the South China Sea raising regional tensions.', 'https://example.com/3', 'Demo News', 'Philippines', 14.5995, 120.9842, ST_SetSRID(ST_MakePoint(120.9842, 14.5995), 4326), NOW() - INTERVAL '6 hours')
ON CONFLICT (external_id) DO NOTHING;
