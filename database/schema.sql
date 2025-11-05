-- SRHR Dashboard Database Schema
-- PostgreSQL with PostGIS

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS health_platforms CASCADE;
DROP TABLE IF EXISTS trend_data CASCADE;

-- Health Decision-Making Platforms Table
CREATE TABLE health_platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    youth_count INTEGER NOT NULL DEFAULT 0,
    total_members INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    address TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT youth_count_positive CHECK (youth_count >= 0),
    CONSTRAINT total_members_positive CHECK (total_members > 0),
    CONSTRAINT youth_less_than_total CHECK (youth_count <= total_members),
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100)
);

-- Trend Data Table (for aggregate statistics by year)
CREATE TABLE trend_data (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    youth_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    committees INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100)
);

-- Create indexes for better query performance
CREATE INDEX idx_health_platforms_year ON health_platforms(year);
CREATE INDEX idx_health_platforms_type ON health_platforms(type);
CREATE INDEX idx_health_platforms_location ON health_platforms USING GIST(location);
CREATE INDEX idx_trend_data_year ON trend_data(year);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_health_platforms_updated_at 
    BEFORE UPDATE ON health_platforms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trend_data_updated_at 
    BEFORE UPDATE ON trend_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy querying of platform statistics by year
CREATE OR REPLACE VIEW platform_stats_by_year AS
SELECT 
    year,
    COUNT(*) as platform_count,
    SUM(youth_count) as total_youth,
    SUM(total_members) as total_members,
    ROUND(AVG(youth_count), 2) as avg_youth_per_platform,
    ROUND((SUM(youth_count)::FLOAT / NULLIF(SUM(total_members), 0)) * 100, 2) as youth_percentage
FROM health_platforms
GROUP BY year
ORDER BY year;

-- Create a view for platform types distribution
CREATE OR REPLACE VIEW platform_types_distribution AS
SELECT 
    type,
    year,
    COUNT(*) as count,
    SUM(youth_count) as total_youth,
    SUM(total_members) as total_members
FROM health_platforms
GROUP BY type, year
ORDER BY year DESC, count DESC;

-- Comment on tables and columns
COMMENT ON TABLE health_platforms IS 'Health decision-making platforms in Harare districts';
COMMENT ON COLUMN health_platforms.location IS 'Geographic coordinates stored as PostGIS Point (longitude, latitude)';
COMMENT ON COLUMN health_platforms.youth_count IS 'Number of participants aged 24 and below';
COMMENT ON COLUMN health_platforms.total_members IS 'Total number of committee members';

COMMENT ON TABLE trend_data IS 'Aggregated statistics by year for trend analysis';
COMMENT ON VIEW platform_stats_by_year IS 'Aggregated platform statistics grouped by year';
COMMENT ON VIEW platform_types_distribution IS 'Distribution of platform types by year';

