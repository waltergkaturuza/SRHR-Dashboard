-- Migration: Add youth representative and health platforms columns to district_boundaries
-- This script can be run safely on existing databases

-- Add youth representative columns
ALTER TABLE district_boundaries 
ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS health_platforms JSONB;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep ON district_boundaries(youth_rep_name);

-- Add comments
COMMENT ON COLUMN district_boundaries.youth_rep_name IS 'Name of the young people representative for this district';
COMMENT ON COLUMN district_boundaries.youth_rep_title IS 'Title/position of the young people representative (e.g., YPNHW District Facilitator)';
COMMENT ON COLUMN district_boundaries.health_platforms IS 'JSON array of health platforms that exist for young people in this district';

-- Example of health_platforms structure:
-- [
--   "District Health Committee",
--   "District Aids Committee",
--   "District Health stakeholders taskforce",
--   "Child Protection Committee"
-- ]
