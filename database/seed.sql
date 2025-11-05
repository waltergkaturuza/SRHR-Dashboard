-- SRHR Dashboard - Sample Data Seeding
-- This populates the database with sample data for Harare

-- Clear existing data
TRUNCATE TABLE health_platforms, trend_data RESTART IDENTITY CASCADE;

-- Insert Health Platforms for multiple years
-- Format: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)

-- 2024 Data (Current Year)
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location) VALUES
('Harare Central District Health Office', 'District Office', 45, 120, 2024, 'Corner 5th Street & Central Avenue', ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326)),
('Mbare Health Decision Committee', 'Community Health Committee', 32, 85, 2024, 'Mbare Township', ST_SetSRID(ST_MakePoint(31.0312, -17.8352), 4326)),
('Borrowdale Health Forum', 'Health Forum', 28, 95, 2024, 'Borrowdale Shopping Center', ST_SetSRID(ST_MakePoint(31.0712, -17.8052), 4326)),
('Glen View Youth Health Committee', 'Youth Committee', 67, 75, 2024, 'Glen View 3', ST_SetSRID(ST_MakePoint(31.0212, -17.8452), 4326)),
('Avondale Clinic Committee', 'Clinic Committee', 19, 60, 2024, 'Avondale West', ST_SetSRID(ST_MakePoint(31.0592, -17.8152), 4326)),
('Highfield Community Health Platform', 'Community Platform', 54, 110, 2024, 'Highfield Township', ST_SetSRID(ST_MakePoint(31.0412, -17.8552), 4326)),
('Hatfield Youth SRHR Forum', 'SRHR Forum', 41, 65, 2024, 'Hatfield', ST_SetSRID(ST_MakePoint(31.0812, -17.8352), 4326)),
('Dzivarasekwa Health Advisory Board', 'Advisory Board', 38, 100, 2024, 'Dzivarasekwa Extension', ST_SetSRID(ST_MakePoint(31.0292, -17.8652), 4326));

-- 2023 Data
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location) VALUES
('Harare Central District Health Office', 'District Office', 42, 115, 2023, 'Corner 5th Street & Central Avenue', ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326)),
('Mbare Health Decision Committee', 'Community Health Committee', 29, 82, 2023, 'Mbare Township', ST_SetSRID(ST_MakePoint(31.0312, -17.8352), 4326)),
('Borrowdale Health Forum', 'Health Forum', 25, 92, 2023, 'Borrowdale Shopping Center', ST_SetSRID(ST_MakePoint(31.0712, -17.8052), 4326)),
('Glen View Youth Health Committee', 'Youth Committee', 63, 73, 2023, 'Glen View 3', ST_SetSRID(ST_MakePoint(31.0212, -17.8452), 4326)),
('Avondale Clinic Committee', 'Clinic Committee', 17, 58, 2023, 'Avondale West', ST_SetSRID(ST_MakePoint(31.0592, -17.8152), 4326)),
('Highfield Community Health Platform', 'Community Platform', 50, 105, 2023, 'Highfield Township', ST_SetSRID(ST_MakePoint(31.0412, -17.8552), 4326)),
('Hatfield Youth SRHR Forum', 'SRHR Forum', 38, 63, 2023, 'Hatfield', ST_SetSRID(ST_MakePoint(31.0812, -17.8352), 4326)),
('Dzivarasekwa Health Advisory Board', 'Advisory Board', 38, 107, 2023, 'Dzivarasekwa Extension', ST_SetSRID(ST_MakePoint(31.0292, -17.8652), 4326));

-- 2022 Data
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location) VALUES
('Harare Central District Health Office', 'District Office', 39, 110, 2022, 'Corner 5th Street & Central Avenue', ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326)),
('Mbare Health Decision Committee', 'Community Health Committee', 27, 80, 2022, 'Mbare Township', ST_SetSRID(ST_MakePoint(31.0312, -17.8352), 4326)),
('Borrowdale Health Forum', 'Health Forum', 23, 89, 2022, 'Borrowdale Shopping Center', ST_SetSRID(ST_MakePoint(31.0712, -17.8052), 4326)),
('Glen View Youth Health Committee', 'Youth Committee', 59, 71, 2022, 'Glen View 3', ST_SetSRID(ST_MakePoint(31.0212, -17.8452), 4326)),
('Avondale Clinic Committee', 'Clinic Committee', 15, 55, 2022, 'Avondale West', ST_SetSRID(ST_MakePoint(31.0592, -17.8152), 4326)),
('Highfield Community Health Platform', 'Community Platform', 47, 100, 2022, 'Highfield Township', ST_SetSRID(ST_MakePoint(31.0412, -17.8552), 4326)),
('Hatfield Youth SRHR Forum', 'SRHR Forum', 35, 60, 2022, 'Hatfield', ST_SetSRID(ST_MakePoint(31.0812, -17.8352), 4326)),
('Dzivarasekwa Health Advisory Board', 'Advisory Board', 33, 105, 2022, 'Dzivarasekwa Extension', ST_SetSRID(ST_MakePoint(31.0292, -17.8652), 4326));

-- 2025 Data (Future year - showing system works with upcoming data)
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location) VALUES
('Harare Central District Health Office', 'District Office', 48, 125, 2025, 'Corner 5th Street & Central Avenue', ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326)),
('Mbare Health Decision Committee', 'Community Health Committee', 35, 88, 2025, 'Mbare Township', ST_SetSRID(ST_MakePoint(31.0312, -17.8352), 4326)),
('Borrowdale Health Forum', 'Health Forum', 31, 98, 2025, 'Borrowdale Shopping Center', ST_SetSRID(ST_MakePoint(31.0712, -17.8052), 4326)),
('Glen View Youth Health Committee', 'Youth Committee', 70, 78, 2025, 'Glen View 3', ST_SetSRID(ST_MakePoint(31.0212, -17.8452), 4326)),
('Avondale Clinic Committee', 'Clinic Committee', 22, 62, 2025, 'Avondale West', ST_SetSRID(ST_MakePoint(31.0592, -17.8152), 4326)),
('Highfield Community Health Platform', 'Community Platform', 57, 115, 2025, 'Highfield Township', ST_SetSRID(ST_MakePoint(31.0412, -17.8552), 4326)),
('Hatfield Youth SRHR Forum', 'SRHR Forum', 44, 68, 2025, 'Hatfield', ST_SetSRID(ST_MakePoint(31.0812, -17.8352), 4326)),
('Dzivarasekwa Health Advisory Board', 'Advisory Board', 41, 103, 2025, 'Dzivarasekwa Extension', ST_SetSRID(ST_MakePoint(31.0292, -17.8652), 4326)),
('Chitungwiza Youth Forum', 'Youth Committee', 55, 90, 2025, 'Chitungwiza Town', ST_SetSRID(ST_MakePoint(31.0892, -18.0152), 4326));

-- Calculate and insert trend data
INSERT INTO trend_data (year, youth_count, total_count, committees)
SELECT 
    year,
    SUM(youth_count) as youth_count,
    SUM(total_members) as total_count,
    COUNT(*) as committees
FROM health_platforms
GROUP BY year
ORDER BY year;

-- Verify data
SELECT 
    year,
    COUNT(*) as platforms,
    SUM(youth_count) as total_youth,
    SUM(total_members) as total_members,
    ROUND((SUM(youth_count)::FLOAT / SUM(total_members) * 100), 2) as youth_percentage
FROM health_platforms
GROUP BY year
ORDER BY year;

