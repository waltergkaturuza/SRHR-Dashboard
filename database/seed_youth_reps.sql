-- Seed data for youth representatives and health platforms in districts
-- Based on the provided information

-- Glen View
UPDATE district_boundaries
SET 
    youth_rep_name = 'Tinotenda Craig Marimo',
    youth_rep_title = 'YPNHW District Facilitator',
    health_platforms = '["District Health Committee", "District Aids Committee", "District Health stakeholders taskforce", "Child Protection Committee"]'::jsonb
WHERE LOWER(name) = 'glen view';

-- Mufakose
UPDATE district_boundaries
SET 
    health_platforms = '["District Health Committee", "District Aids Committee", "District Health stakeholders taskforce", "Child Protection Committee"]'::jsonb
WHERE LOWER(name) = 'mufakose';

-- Budiriro
UPDATE district_boundaries
SET 
    health_platforms = '["District Health Committee", "District Aids Committee", "District Health stakeholders taskforce", "Child Protection Committee"]'::jsonb
WHERE LOWER(name) = 'budiriro';

-- Chitungwiza
UPDATE district_boundaries
SET 
    youth_rep_name = 'Leroy Ndambi',
    youth_rep_title = 'YPNHW District Facilitator',
    health_platforms = '["District Health Committee", "District Aids Committee", "District stakeholders taskforce"]'::jsonb
WHERE LOWER(name) = 'chitungwiza';

-- Mbare
UPDATE district_boundaries
SET 
    youth_rep_name = 'Nokutenda Mukorera',
    youth_rep_title = 'YPNHW District Facilitator',
    health_platforms = '["District Health Committee", "District Aids Committee", "District stakeholders taskforce"]'::jsonb
WHERE LOWER(name) = 'mbare';

-- Dzivarasekwa
UPDATE district_boundaries
SET 
    youth_rep_name = 'Munashe Kawanje',
    youth_rep_title = 'YPNHW District Facilitator',
    health_platforms = '["District Aids Committee", "District stakeholders", "District health taskforce"]'::jsonb
WHERE LOWER(name) = 'dzivarasekwa';

-- Glaudina
UPDATE district_boundaries
SET 
    health_platforms = '["District Aids Committee", "District stakeholders", "District health taskforce"]'::jsonb
WHERE LOWER(name) IN ('glaudina', 'glenview');

-- Belvedere
UPDATE district_boundaries
SET 
    health_platforms = '["District Aids Committee", "District stakeholders", "District health taskforce"]'::jsonb
WHERE LOWER(name) = 'belvedere';

-- Show results
SELECT 
    name,
    youth_rep_name,
    youth_rep_title,
    health_platforms
FROM district_boundaries
WHERE youth_rep_name IS NOT NULL OR health_platforms IS NOT NULL
ORDER BY name;
