# Running Database Migration on Render

## Quick Steps

### Option 1: Using Render Shell (Recommended)

1. **Open Render Dashboard**
   - Go to https://dashboard.render.com
   - Select your database service

2. **Open Shell**
   - Click on "Shell" tab (or "Connect" → "External Connection")
   - This opens a psql connection to your database

3. **Run Migration Commands**

   Copy and paste each command:

   ```sql
   -- Add youth representative columns
   ALTER TABLE district_boundaries 
   ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200),
   ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200),
   ADD COLUMN IF NOT EXISTS health_platforms JSONB;

   -- Add index
   CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep ON district_boundaries(youth_rep_name);

   -- Verify columns were added
   \d district_boundaries
   ```

4. **Seed Sample Data (Optional)**

   ```sql
   -- Glen View
   UPDATE district_boundaries
   SET 
       youth_rep_name = 'Tinotenda Craig Marimo',
       youth_rep_title = 'YPNHW District Facilitator',
       health_platforms = '["District Health Committee", "District Aids Committee", "District Health stakeholders taskforce", "Child Protection Committee"]'::jsonb
   WHERE LOWER(name) = 'glen view';

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

   -- Verify updates
   SELECT name, youth_rep_name, youth_rep_title, health_platforms 
   FROM district_boundaries 
   WHERE youth_rep_name IS NOT NULL 
   ORDER BY name;
   ```

### Option 2: Using Render Web Service Shell

If you have a web service (backend):

1. **Open Web Service Dashboard**
   - Go to your web service (not database)
   - Click "Shell" tab

2. **Run Migration via Python**

   ```bash
   # Connect to database and run migration
   python << 'EOF'
   import os
   import psycopg2

   # Connect to database
   conn = psycopg2.connect(os.environ['DATABASE_URL'])
   cur = conn.cursor()

   # Run migration
   migration_sql = """
   ALTER TABLE district_boundaries 
   ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200),
   ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200),
   ADD COLUMN IF NOT EXISTS health_platforms JSONB;

   CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep 
   ON district_boundaries(youth_rep_name);
   """

   cur.execute(migration_sql)
   conn.commit()
   print("✅ Migration completed successfully!")

   cur.close()
   conn.close()
   EOF
   ```

### Option 3: Using Local Connection to Render Database

If you want to run from your local machine:

1. **Get External Database URL**
   - In Render Dashboard → Database → Info
   - Copy "External Database URL"

2. **Run Migration Locally**

   ```bash
   # Windows (PowerShell)
   $env:DATABASE_URL="your_external_database_url"
   psql $env:DATABASE_URL -f database/add_youth_rep_columns.sql

   # Mac/Linux
   export DATABASE_URL="your_external_database_url"
   psql $DATABASE_URL -f database/add_youth_rep_columns.sql
   ```

## Verification

After running migration, verify it worked:

```sql
-- Check columns exist
\d district_boundaries

-- Should show:
-- youth_rep_name | character varying(200)
-- youth_rep_title | character varying(200)
-- health_platforms | jsonb

-- Check if any data was added
SELECT COUNT(*) FROM district_boundaries WHERE youth_rep_name IS NOT NULL;
```

## Troubleshooting

### "relation district_boundaries does not exist"
**Solution:** The boundaries table hasn't been created yet. Run your main schema first:
```bash
psql $DATABASE_URL -f database/schema_enhanced.sql
```

### "column already exists"
**Solution:** Migration already ran. This is fine, you can proceed.

### Permission Denied
**Solution:** 
1. Make sure you're using the correct database connection
2. Check that DATABASE_URL is set correctly
3. Verify database user has ALTER TABLE permissions

### Connection Refused
**Solution:**
1. Check that database is running in Render dashboard
2. Verify External Database URL is correct
3. Make sure your IP is allowed (Render allows all by default)

## Post-Migration Steps

1. **Restart Web Service** (if needed)
   - Go to Web Service dashboard
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - Or just wait for auto-deploy from GitHub push

2. **Verify Frontend Works**
   - Open your app URL
   - Login as admin
   - Go to Admin Dashboard → Boundaries
   - Edit a district
   - Check that youth rep fields appear

3. **Add Data**
   - Use the Admin Dashboard to add youth representative info
   - Or run the seed script (see Option 1 above)

## Need Help?

- **Render Docs:** https://render.com/docs/databases
- **Check Logs:** Render Dashboard → Logs tab
- **Database Shell:** Most reliable method for running SQL

## Summary of Commands

**Quick Migration (Copy-Paste into Render Shell):**
```sql
ALTER TABLE district_boundaries 
ADD COLUMN IF NOT EXISTS youth_rep_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS youth_rep_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS health_platforms JSONB;

CREATE INDEX IF NOT EXISTS idx_district_boundaries_youth_rep 
ON district_boundaries(youth_rep_name);

-- Verify
\d district_boundaries
```

**Done!** Your database is now ready for youth representative information.
