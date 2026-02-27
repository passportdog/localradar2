-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ZIP codes table with centroids
CREATE TABLE IF NOT EXISTS zip_codes (
  zip VARCHAR(10) PRIMARY KEY,
  city VARCHAR(100),
  state VARCHAR(2) DEFAULT 'FL',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic cameras table
CREATE TABLE IF NOT EXISTS traffic_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('active', 'degraded', 'dead', 'unknown')),
  direction VARCHAR(10),
  stream_url TEXT,
  still_url TEXT,
  source VARCHAR(50) DEFAULT 'unknown',
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Spatial indexes for fast geo queries
CREATE INDEX IF NOT EXISTS idx_cameras_location ON traffic_cameras USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON traffic_cameras(status);
CREATE INDEX IF NOT EXISTS idx_cameras_source ON traffic_cameras(source);
CREATE INDEX IF NOT EXISTS idx_zip_codes_location ON zip_codes USING GIST(location);

-- Function: Get cameras within radius
CREATE OR REPLACE FUNCTION get_cameras_within_radius(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_km DECIMAL,
  max_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  status VARCHAR,
  direction VARCHAR,
  stream_url TEXT,
  still_url TEXT,
  source VARCHAR,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.name,
    tc.latitude,
    tc.longitude,
    tc.status,
    tc.direction,
    tc.stream_url,
    tc.still_url,
    tc.source,
    tc.last_checked,
    tc.created_at,
    ST_Distance(
      tc.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) / 1000.0 as distance_km
  FROM traffic_cameras tc
  WHERE ST_DWithin(
    tc.location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function: Get cameras by ZIP code
CREATE OR REPLACE FUNCTION get_cameras_by_zip(
  zip_code VARCHAR,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  status VARCHAR,
  direction VARCHAR,
  stream_url TEXT,
  still_url TEXT,
  source VARCHAR,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  distance_km DECIMAL
) AS $$
DECLARE
  zip_lat DECIMAL;
  zip_lng DECIMAL;
BEGIN
  -- Get ZIP centroid
  SELECT z.latitude, z.longitude INTO zip_lat, zip_lng
  FROM zip_codes z
  WHERE z.zip = zip_code;
  
  IF zip_lat IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT * FROM get_cameras_within_radius(zip_lat, zip_lng, 25, max_results);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE traffic_cameras ENABLE ROW LEVEL SECURITY;

-- Allow public read for active cameras
CREATE POLICY "Public can view active cameras" ON traffic_cameras
  FOR SELECT USING (status = 'active' OR status = 'degraded');

-- Allow service role full access
CREATE POLICY "Service role has full access" ON traffic_cameras
  FOR ALL USING (auth.role() = 'service_role');

-- Insert Florida ZIP codes (major cities)
INSERT INTO zip_codes (zip, city, latitude, longitude) VALUES
  ('33101', 'Miami', 25.7617, -80.1918),
  ('33601', 'Tampa', 27.9506, -82.4572),
  ('32801', 'Orlando', 28.5383, -81.3792),
  ('32201', 'Jacksonville', 30.3322, -81.6557),
  ('32301', 'Tallahassee', 30.4383, -84.2807),
  ('33301', 'Fort Lauderdale', 26.1224, -80.1373),
  ('33701', 'St. Petersburg', 27.7676, -82.6403),
  ('33010', 'Hialeah', 25.8576, -80.2781),
  ('34952', 'Port St. Lucie', 27.2730, -80.3582),
  ('33904', 'Cape Coral', 26.5629, -81.9495)
ON CONFLICT (zip) DO NOTHING;

COMMENT ON TABLE traffic_cameras IS 'Traffic camera locations and metadata';
COMMENT ON TABLE zip_codes IS 'US ZIP code centroids for geo queries';
