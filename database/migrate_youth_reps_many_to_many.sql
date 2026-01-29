-- Migration: Convert youth rep to districts from one-to-one to many-to-many relationship
-- This allows one youth representative to be assigned to multiple districts

-- Step 1: Create youth_representatives table
CREATE TABLE IF NOT EXISTS youth_representatives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, title)  -- Prevent duplicate reps with same name and title
);

-- Step 2: Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS youth_rep_districts (
    id SERIAL PRIMARY KEY,
    youth_rep_id INTEGER NOT NULL REFERENCES youth_representatives(id) ON DELETE CASCADE,
    district_id INTEGER NOT NULL REFERENCES district_boundaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(youth_rep_id, district_id)  -- Prevent duplicate assignments
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_youth_rep_districts_rep ON youth_rep_districts(youth_rep_id);
CREATE INDEX IF NOT EXISTS idx_youth_rep_districts_district ON youth_rep_districts(district_id);
CREATE INDEX IF NOT EXISTS idx_youth_representatives_name ON youth_representatives(name);

-- Step 4: Migrate existing data from district_boundaries to new tables
-- This will create youth rep entries and link them to districts
INSERT INTO youth_representatives (name, title)
SELECT DISTINCT 
    youth_rep_name,
    youth_rep_title
FROM district_boundaries
WHERE youth_rep_name IS NOT NULL 
  AND youth_rep_name != ''
ON CONFLICT (name, title) DO NOTHING;

-- Step 5: Create the many-to-many relationships
INSERT INTO youth_rep_districts (youth_rep_id, district_id)
SELECT 
    yr.id as youth_rep_id,
    db.id as district_id
FROM district_boundaries db
JOIN youth_representatives yr ON 
    db.youth_rep_name = yr.name 
    AND (db.youth_rep_title = yr.title OR (db.youth_rep_title IS NULL AND yr.title IS NULL))
WHERE db.youth_rep_name IS NOT NULL 
  AND db.youth_rep_name != ''
ON CONFLICT (youth_rep_id, district_id) DO NOTHING;

-- Step 6: Add comments
COMMENT ON TABLE youth_representatives IS 'Young people representatives who can be assigned to multiple districts';
COMMENT ON TABLE youth_rep_districts IS 'Junction table linking youth representatives to districts (many-to-many)';
COMMENT ON COLUMN youth_representatives.name IS 'Full name of the youth representative';
COMMENT ON COLUMN youth_representatives.title IS 'Title/position (e.g., YPNHW District Facilitator)';

-- Note: We keep the old columns (youth_rep_name, youth_rep_title) in district_boundaries 
-- for backward compatibility. They can be removed in a future migration if needed.
-- The new system will use the junction table for all new assignments.
