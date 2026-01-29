# Render Migration - Quick Commands

## 🚀 Copy-Paste These Commands

### Step 1: Open Render Database Shell
1. Go to https://dashboard.render.com
2. Click your PostgreSQL database
3. Click "Shell" tab (or Connect → PSQL Command)

### Step 2: Run Migration (Copy & Paste)

```sql
-- Add youth representative columns
ALTER TABLE district_boundaries 
ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS health_platforms JSONB;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep 
ON district_boundaries(youth_rep_name);

-- Add comments for documentation
COMMENT ON COLUMN district_boundaries.youth_rep_name IS 'Name of the young people representative';
COMMENT ON COLUMN district_boundaries.youth_rep_title IS 'Title/position of youth representative';
COMMENT ON COLUMN district_boundaries.health_platforms IS 'JSON array of health platforms for young people';
```

### Step 3: Verify (Copy & Paste)

```sql
-- Check columns were added
\d district_boundaries

-- Should see:
-- youth_rep_name | character varying(200)
-- youth_rep_title | character varying(200)  
-- health_platforms | jsonb
```

### Step 4: Add Sample Data (Optional)

```sql
-- Glen View
UPDATE district_boundaries SET 
youth_rep_name = 'Tinotenda Craig Marimo',
youth_rep_title = 'YPNHW District Facilitator',
health_platforms = '["District Health Committee","District Aids Committee","District Health stakeholders taskforce","Child Protection Committee"]'::jsonb
WHERE LOWER(name) = 'glen view';

-- Chitungwiza  
UPDATE district_boundaries SET
youth_rep_name = 'Leroy Ndambi',
youth_rep_title = 'YPNHW District Facilitator',
health_platforms = '["District Health Committee","District Aids Committee","District stakeholders taskforce"]'::jsonb
WHERE LOWER(name) = 'chitungwiza';

-- Mbare
UPDATE district_boundaries SET
youth_rep_name = 'Nokutenda Mukorera',
youth_rep_title = 'YPNHW District Facilitator',
health_platforms = '["District Health Committee","District Aids Committee","District stakeholders taskforce"]'::jsonb
WHERE LOWER(name) = 'mbare';

-- Dzivarasekwa
UPDATE district_boundaries SET
youth_rep_name = 'Munashe Kawanje',
youth_rep_title = 'YPNHW District Facilitator',
health_platforms = '["District Aids Committee","District stakeholders","District health taskforce"]'::jsonb
WHERE LOWER(name) = 'dzivarasekwa';
```

### Step 5: Verify Data (Copy & Paste)

```sql
-- See all districts with youth reps
SELECT name, youth_rep_name, youth_rep_title, 
       jsonb_array_length(health_platforms) as platform_count
FROM district_boundaries 
WHERE youth_rep_name IS NOT NULL
ORDER BY name;
```

## ✅ Done!

Your database now has youth representative fields. 

**Next:** Refresh your frontend and go to Admin Dashboard → Boundaries → Edit any district to see the new fields!

---

## Alternative: One-Line Commands

If you prefer, run these as single commands:

```sql
-- Migration only
ALTER TABLE district_boundaries ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200), ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200), ADD COLUMN IF NOT EXISTS health_platforms JSONB; CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep ON district_boundaries(youth_rep_name);

-- Verify
\d district_boundaries
```

## Troubleshooting

**"Table doesn't exist"**
→ Run your main schema first: `database/schema_enhanced.sql`

**"Column already exists"**  
→ Perfect! Already migrated, you're good to go

**"Permission denied"**
→ Check you're connected to correct database with admin permissions

---

**That's it!** The migration is complete. Now test your admin panel! 🎉
