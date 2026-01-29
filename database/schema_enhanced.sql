-- Enhanced Schema with Descriptions and Boundaries

-- Add description column to health_platforms if it doesn't exist
ALTER TABLE health_platforms 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Add description to facilities
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Create district boundaries table
CREATE TABLE IF NOT EXISTS district_boundaries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20),
    population INTEGER,
    area_km2 NUMERIC(10, 2),
    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
    center_point GEOMETRY(Point, 4326),
    youth_rep_name VARCHAR(200),
    youth_rep_title VARCHAR(200),
    health_platforms JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_platforms_district ON health_platforms(district);
CREATE INDEX IF NOT EXISTS idx_facilities_district ON facilities(district);
CREATE INDEX IF NOT EXISTS idx_district_boundaries_name ON district_boundaries(name);
CREATE INDEX IF NOT EXISTS idx_district_boundaries_boundary ON district_boundaries USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_district_boundaries_center ON district_boundaries USING GIST(center_point);

-- Trigger for district boundaries
CREATE TRIGGER update_district_boundaries_updated_at 
    BEFORE UPDATE ON district_boundaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get facilities within a district boundary
CREATE OR REPLACE FUNCTION get_facilities_in_district(district_name VARCHAR)
RETURNS TABLE (
    facility_type VARCHAR,
    category VARCHAR,
    name VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'health' as facility_type,
        hp.type as category,
        hp.name,
        COUNT(*) OVER (PARTITION BY hp.type) as count
    FROM health_platforms hp
    JOIN district_boundaries db ON db.name = district_name
    WHERE ST_Within(hp.location, db.boundary)
    
    UNION ALL
    
    SELECT 
        f.category as facility_type,
        f.sub_type as category,
        f.name,
        COUNT(*) OVER (PARTITION BY f.category, f.sub_type) as count
    FROM facilities f
    JOIN district_boundaries db ON db.name = district_name
    WHERE ST_Within(f.location, db.boundary);
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE district_boundaries IS 'Administrative boundaries for Harare districts and suburbs';
COMMENT ON COLUMN district_boundaries.boundary IS 'MultiPolygon geometry defining district borders';
COMMENT ON COLUMN district_boundaries.center_point IS 'Center point of district for labeling';
COMMENT ON COLUMN health_platforms.description IS 'Additional notes and details about the platform';
COMMENT ON COLUMN health_platforms.district IS 'District/suburb name (e.g., Mbare, Borrowdale)';
COMMENT ON COLUMN facilities.description IS 'Additional notes and details about the facility';
COMMENT ON COLUMN facilities.district IS 'District/suburb name';












