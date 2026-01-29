# Youth Representative Many-to-Many Migration Guide

## Overview

This migration updates the system to support **many-to-many relationships** between youth representatives and districts. This means one youth representative can now be assigned to multiple districts, which better reflects the real-world scenario.

## What Changed

### Database Changes

1. **New Tables Created:**
   - `youth_representatives` - Stores youth rep information (name, title)
   - `youth_rep_districts` - Junction table linking reps to districts (many-to-many)

2. **Old Columns Preserved:**
   - The `youth_rep_name` and `youth_rep_title` columns in `district_boundaries` are kept for backward compatibility
   - Existing data is automatically migrated to the new tables

### API Changes

**New Endpoints:**
- `GET /api/youth-reps` - List all youth reps with their districts
- `POST /api/youth-reps` - Create a new youth rep and assign districts
- `PUT /api/youth-reps/<id>` - Update a youth rep and their district assignments
- `DELETE /api/youth-reps/<id>` - Delete a youth rep
- `GET /api/districts` - Get all districts (for use in forms)

**Updated Endpoints:**
- `GET /api/districts/youth-info` - Still works, now also includes data from new structure

## Migration Steps

### Step 1: Run the Database Migration

On Render.com, use the backend shell to run the migration:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration script
\i database/migrate_youth_reps_many_to_many.sql

# Or if running from command line:
psql $DATABASE_URL -f database/migrate_youth_reps_many_to_many.sql
```

**Alternative: Using Python Script**

You can also run the migration through Python:

```python
import psycopg2
import os

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

with open('database/migrate_youth_reps_many_to_many.sql', 'r') as f:
    cur.execute(f.read())

conn.commit()
cur.close()
conn.close()
```

### Step 2: Verify Migration

Check that the tables were created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('youth_representatives', 'youth_rep_districts');

-- Check migrated data
SELECT yr.name, yr.title, COUNT(yrd.district_id) as district_count
FROM youth_representatives yr
LEFT JOIN youth_rep_districts yrd ON yr.id = yrd.youth_rep_id
GROUP BY yr.id, yr.name, yr.title;
```

### Step 3: Deploy Updated Code

The frontend and backend code have been updated to support the new structure. After deploying:

1. The Admin Dashboard now has a new "Youth Representatives" tab
2. You can create/edit youth reps and assign them to multiple districts
3. The form supports multi-select for districts

## Using the New System

### Creating a Youth Representative

1. Go to Admin Dashboard → Youth Representatives tab
2. Click "Add Youth Representative"
3. Enter name and title
4. **Select multiple districts** (hold Ctrl/Cmd to select multiple)
5. Click "Create Representative"

### Editing a Youth Representative

1. Find the rep in the table
2. Click the Edit button
3. Modify name, title, or district assignments
4. Click "Update Representative"

### Assigning One Rep to Multiple Districts

When creating or editing a youth rep, simply select multiple districts from the dropdown. The system will create the appropriate relationships automatically.

## Backward Compatibility

- Old API endpoints still work
- Existing data is preserved and migrated
- The old `youth_rep_name` and `youth_rep_title` columns remain for compatibility
- New assignments should use the new API endpoints

## Troubleshooting

### Migration Fails

If the migration fails, check:
1. Database connection is working
2. You have proper permissions
3. Tables don't already exist (migration uses `IF NOT EXISTS`)

### Data Not Showing

1. Verify migration completed successfully
2. Check that data was migrated: `SELECT * FROM youth_representatives;`
3. Check browser console for API errors
4. Ensure backend is using updated code

### Can't Select Multiple Districts

1. Ensure you're using the new "Youth Representatives" tab in Admin Dashboard
2. Check browser console for JavaScript errors
3. Verify the form is using the multi-select dropdown

## Example: Assigning One Rep to Multiple Districts

**Before (Old System):**
- Each district had its own `youth_rep_name` field
- One rep could only be in one district
- To assign same rep to multiple districts, you had to duplicate the name

**After (New System):**
- Create one youth rep entry
- Select multiple districts when creating/editing
- One rep can represent many districts efficiently

**Example:**
```
Youth Rep: Tinotenda Craig Marimo
Title: YPNHW District Facilitator
Districts: Glen View, Mufakose, Budiriro
```

This creates one rep entry linked to three districts.
