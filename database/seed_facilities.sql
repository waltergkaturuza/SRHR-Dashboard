-- Sample Data for Community Facilities

-- Schools in Harare
INSERT INTO facilities (name, category, sub_type, year, address, location, additional_info) VALUES
-- Primary Schools
('Mbare Primary School', 'school', 'primary', 2024, 'Mbare Township', 
 ST_SetSRID(ST_MakePoint(31.0320, -17.8360), 4326),
 '{"students": 450, "teachers": 18}'::jsonb),
('Borrowdale Primary School', 'school', 'primary', 2024, 'Borrowdale', 
 ST_SetSRID(ST_MakePoint(31.0720, -17.8060), 4326),
 '{"students": 520, "teachers": 22}'::jsonb),
('Glen View Primary', 'school', 'primary', 2024, 'Glen View', 
 ST_SetSRID(ST_MakePoint(31.0220, -17.8460), 4326),
 '{"students": 680, "teachers": 25}'::jsonb),

-- Secondary Schools
('Harare High School', 'school', 'secondary', 2024, 'Central Harare', 
 ST_SetSRID(ST_MakePoint(31.0500, -17.8260), 4326),
 '{"students": 850, "teachers": 42}'::jsonb),
('Mufakose High School', 'school', 'secondary', 2024, 'Mufakose', 
 ST_SetSRID(ST_MakePoint(31.0100, -17.8550), 4326),
 '{"students": 720, "teachers": 35}'::jsonb),

-- Tertiary Institutions
('University of Zimbabwe', 'school', 'tertiary', 2024, 'Mount Pleasant', 
 ST_SetSRID(ST_MakePoint(31.0550, -17.7850), 4326),
 '{"students": 12000, "type": "university"}'::jsonb),
('Harare Polytechnic', 'school', 'tertiary', 2024, 'Southerton', 
 ST_SetSRID(ST_MakePoint(31.0400, -17.8400), 4326),
 '{"students": 3500, "type": "polytechnic"}'::jsonb),

-- Churches
('St Mary\'s Cathedral', 'church', 'catholic', 2024, 'Central Harare', 
 ST_SetSRID(ST_MakePoint(31.0480, -17.8240), 4326),
 '{"denomination": "Catholic", "capacity": 800}'::jsonb),
('Family of God Church', 'church', 'pentecostal', 2024, 'Highfield', 
 ST_SetSRID(ST_MakePoint(31.0420, -17.8560), 4326),
 '{"denomination": "Pentecostal", "capacity": 1200}'::jsonb),
('Central Methodist Church', 'church', 'methodist', 2024, 'City Center', 
 ST_SetSRID(ST_MakePoint(31.0490, -17.8250), 4326),
 '{"denomination": "Methodist", "capacity": 600}'::jsonb),

-- Police Stations
('Harare Central Police Station', 'police', 'main', 2024, 'Kenneth Kaunda Ave', 
 ST_SetSRID(ST_MakePoint(31.0485, -17.8245), 4326),
 '{"type": "main_station", "officers": 120}'::jsonb),
('Mbare Police Station', 'police', 'branch', 2024, 'Mbare', 
 ST_SetSRID(ST_MakePoint(31.0315, -17.8355), 4326),
 '{"type": "branch", "officers": 45}'::jsonb),
('Borrowdale Police Post', 'police', 'post', 2024, 'Borrowdale', 
 ST_SetSRID(ST_MakePoint(31.0715, -17.8055), 4326),
 '{"type": "post", "officers": 12}'::jsonb),

-- Shops/Markets
('Mbare Musika Market', 'shop', 'market', 2024, 'Mbare', 
 ST_SetSRID(ST_MakePoint(31.0305, -17.8345), 4326),
 '{"type": "market", "vendors": 500}'::jsonb),
('Sam Levy\'s Village', 'shop', 'mall', 2024, 'Borrowdale', 
 ST_SetSRID(ST_MakePoint(31.0725, -17.8045), 4326),
 '{"type": "shopping_mall", "stores": 80}'::jsonb),
('Avondale Shops', 'shop', 'shopping_center', 2024, 'Avondale', 
 ST_SetSRID(ST_MakePoint(31.0595, -17.8155), 4326),
 '{"type": "shopping_center", "stores": 25}'::jsonb),

-- Government Offices
('Harare City Council', 'office', 'government', 2024, 'Town House', 
 ST_SetSRID(ST_MakePoint(31.0495, -17.8255), 4326),
 '{"type": "municipal", "departments": 15}'::jsonb),
('Ministry of Health Office', 'office', 'government', 2024, 'Mukwati Building', 
 ST_SetSRID(ST_MakePoint(31.0500, -17.8270), 4326),
 '{"type": "ministry", "staff": 200}'::jsonb),
('District Administrator Office', 'office', 'government', 2024, 'Harare District', 
 ST_SetSRID(ST_MakePoint(31.0505, -17.8265), 4326),
 '{"type": "district_office", "staff": 50}'::jsonb);

-- Verify data
SELECT 
    category,
    sub_type,
    COUNT(*) as count
FROM facilities
GROUP BY category, sub_type
ORDER BY category, sub_type;


