-- Extended Schema for Multiple Facility Types
-- Adds support for Schools, Churches, Police Stations, Shops, and Offices

-- Create facilities table for all community infrastructure
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'school', 'church', 'police', 'shop', 'office', 'health'
    sub_type VARCHAR(100), -- For schools: 'primary', 'secondary', 'tertiary'
    year INTEGER NOT NULL,
    address TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    additional_info JSONB, -- Flexible field for extra data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100),
    CONSTRAINT valid_category CHECK (category IN ('school', 'church', 'police', 'shop', 'office', 'health'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_year ON facilities(year);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_facilities_sub_type ON facilities(sub_type);

-- Trigger for updated_at
CREATE TRIGGER update_facilities_updated_at 
    BEFORE UPDATE ON facilities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for facilities by category
CREATE OR REPLACE VIEW facilities_by_category AS
SELECT 
    category,
    sub_type,
    year,
    COUNT(*) as count
FROM facilities
GROUP BY category, sub_type, year
ORDER BY year DESC, category, sub_type;

-- Comments
COMMENT ON TABLE facilities IS 'All community facilities including schools, churches, police stations, shops, and offices';
COMMENT ON COLUMN facilities.category IS 'Main category: school, church, police, shop, office, health';
COMMENT ON COLUMN facilities.sub_type IS 'Sub-category: for schools (primary/secondary/tertiary), etc.';
COMMENT ON COLUMN facilities.additional_info IS 'JSON field for flexible additional data like capacity, services, etc.';








