-- Sample District Boundaries for Harare
-- Approximate boundaries for major Harare districts/suburbs

-- Mbare District
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Mbare', 'MBR', 150000, 5.2,
 ST_GeomFromText('MULTIPOLYGON(((
    31.025 -17.830,
    31.040 -17.830,
    31.040 -17.845,
    31.025 -17.845,
    31.025 -17.830
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0325, -17.8375), 4326)
);

-- Borrowdale District
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Borrowdale', 'BRD', 45000, 8.5,
 ST_GeomFromText('MULTIPOLYGON(((
    31.065 -17.795,
    31.085 -17.795,
    31.085 -17.815,
    31.065 -17.815,
    31.065 -17.795
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0750, -17.8050), 4326)
);

-- Harare Central
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Harare Central', 'HRC', 80000, 6.0,
 ST_GeomFromText('MULTIPOLYGON(((
    31.040 -17.815,
    31.060 -17.815,
    31.060 -17.835,
    31.040 -17.835,
    31.040 -17.815
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0500, -17.8250), 4326)
);

-- Glen View
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Glen View', 'GLV', 95000, 4.8,
 ST_GeomFromText('MULTIPOLYGON(((
    31.015 -17.840,
    31.030 -17.840,
    31.030 -17.855,
    31.015 -17.855,
    31.015 -17.840
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0225, -17.8475), 4326)
);

-- Highfield
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Highfield', 'HGF', 120000, 5.5,
 ST_GeomFromText('MULTIPOLYGON(((
    31.035 -17.850,
    31.050 -17.850,
    31.050 -17.865,
    31.035 -17.865,
    31.035 -17.850
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0425, -17.8575), 4326)
);

-- Avondale
INSERT INTO district_boundaries (name, code, population, area_km2, boundary, center_point) VALUES
('Avondale', 'AVN', 35000, 3.2,
 ST_GeomFromText('MULTIPOLYGON(((
    31.050 -17.810,
    31.065 -17.810,
    31.065 -17.825,
    31.050 -17.825,
    31.050 -17.810
 )))', 4326),
 ST_SetSRID(ST_MakePoint(31.0575, -17.8175), 4326)
);

-- Update existing health platforms with district names
UPDATE health_platforms SET district = 'Harare Central' WHERE name LIKE '%Central%';
UPDATE health_platforms SET district = 'Mbare' WHERE name LIKE '%Mbare%';
UPDATE health_platforms SET district = 'Borrowdale' WHERE name LIKE '%Borrowdale%';
UPDATE health_platforms SET district = 'Glen View' WHERE name LIKE '%Glen View%';
UPDATE health_platforms SET district = 'Avondale' WHERE name LIKE '%Avondale%';
UPDATE health_platforms SET district = 'Highfield' WHERE name LIKE '%Highfield%';
UPDATE health_platforms SET district = 'Hatfield' WHERE name LIKE '%Hatfield%' AND district IS NULL;
UPDATE health_platforms SET district = 'Dzivarasekwa' WHERE name LIKE '%Dzivarasekwa%';

-- Update facilities with district names
UPDATE facilities SET district = 'Mbare' WHERE name LIKE '%Mbare%';
UPDATE facilities SET district = 'Borrowdale' WHERE name LIKE '%Borrowdale%';
UPDATE facilities SET district = 'Glen View' WHERE name LIKE '%Glen View%';
UPDATE facilities SET district = 'Harare Central' WHERE name LIKE '%Central%' OR name LIKE '%Harare High%';
UPDATE facilities SET district = 'Highfield' WHERE name LIKE '%Highfield%';
UPDATE facilities SET district = 'Mufakose' WHERE name LIKE '%Mufakose%';
UPDATE facilities SET district = 'Southerton' WHERE name LIKE '%Southerton%' OR name LIKE '%Polytechnic%';
UPDATE facilities SET district = 'Mount Pleasant' WHERE name LIKE '%University%';
UPDATE facilities SET district = 'Avondale' WHERE name LIKE '%Avondale%';

-- Verify boundaries
SELECT 
    name,
    population,
    area_km2,
    ST_AsText(center_point) as center
FROM district_boundaries
ORDER BY name;

-- Count facilities per district
SELECT 
    db.name as district,
    COUNT(DISTINCT hp.id) as health_platforms,
    COUNT(DISTINCT f.id) as other_facilities
FROM district_boundaries db
LEFT JOIN health_platforms hp ON ST_Within(hp.location, db.boundary)
LEFT JOIN facilities f ON ST_Within(f.location, db.boundary)
GROUP BY db.name
ORDER BY db.name;



