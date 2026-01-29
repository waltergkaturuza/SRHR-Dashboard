-- Delete hardcoded seed boundaries
-- This removes the 6 sample boundaries that were created for testing

DELETE FROM district_boundaries 
WHERE name IN (
    'Mbare',
    'Borrowdale', 
    'Harare Central',
    'Glen View',
    'Highfield',
    'Avondale'
);

-- Verify deletion
SELECT COUNT(*) as remaining_boundaries FROM district_boundaries;









