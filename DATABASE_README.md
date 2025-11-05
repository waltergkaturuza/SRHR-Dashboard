# 🗄️ Database Migration - From File Storage to PostgreSQL

## What Changed

Your SRHR Dashboard has been upgraded from file-based storage to **PostgreSQL** with **PostGIS** for professional, scalable data management.

---

## Key Improvements

### Before (File-Based)
- ❌ Static year list (2018-2024 hardcoded)
- ❌ Data stored in JSON files
- ❌ No data persistence on server restart
- ❌ Limited query capabilities
- ❌ Manual data management

### After (PostgreSQL)
- ✅ **Dynamic years** - automatically shows all years in database
- ✅ Data stored in professional database
- ✅ Full ACID compliance
- ✅ Advanced geospatial queries with PostGIS
- ✅ Easy backup and restore
- ✅ Scalable to millions of records
- ✅ SQL queries for reporting
- ✅ Data integrity constraints

---

## Two Backend Files

### 1. `app.py` (Original - File Based)
- Uses file storage
- Good for quick testing
- No database required
- Limited scalability

### 2. `app_db.py` (New - PostgreSQL)
- Uses PostgreSQL database
- Production-ready
- Requires database setup
- Unlimited scalability

**Use `app_db.py` for all new development and deployment!**

---

## Database Structure

### Tables

#### `health_platforms`
Stores all health decision-making platforms:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Platform name |
| type | VARCHAR(100) | Platform type |
| youth_count | INTEGER | Youth participants (≤24) |
| total_members | INTEGER | Total members |
| year | INTEGER | Year of data |
| address | TEXT | Physical address |
| location | GEOMETRY(Point) | Geographic coordinates |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### `trend_data`
Aggregated statistics by year:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| year | INTEGER | Year |
| youth_count | INTEGER | Total youth |
| total_count | INTEGER | Total members |
| committees | INTEGER | Platform count |

### Views

#### `platform_stats_by_year`
Aggregated statistics grouped by year:
- platform_count
- total_youth
- total_members
- avg_youth_per_platform
- youth_percentage

#### `platform_types_distribution`
Distribution of platform types:
- type
- year
- count
- total_youth

---

## Dynamic Year Feature

### How It Works

1. **Frontend** calls `/api/years` on load
2. **Backend** queries database for distinct years:
   ```sql
   SELECT DISTINCT year FROM health_platforms ORDER BY year;
   ```
3. **Frontend** populates year selector dynamically
4. **Result**: Year list automatically grows as you add data!

### Adding New Years

Just add data for any year:

```sql
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location)
VALUES ('New Platform', 'Youth Committee', 50, 80, 2026, 'Address',
        ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326));
```

The year 2026 will automatically appear in the dropdown!

---

## API Endpoints (New)

### GET /api/years
Returns all available years from database:

```json
{
  "years": [2022, 2023, 2024, 2025],
  "current_year": 2025
}
```

### GET /api/geospatial-data?year=2024
Returns GeoJSON for specific year (fetched from database)

### GET /api/statistics?year=2024
Returns aggregated statistics (calculated from database)

### GET /api/trends
Returns trend data for all years (from trend_data table)

### POST /api/upload
Uploads file and **saves to database** (not just files)

### GET /api/platform/:id
Get specific platform details

### PUT /api/platform/:id
Update platform data

### DELETE /api/platform/:id
Delete platform

### POST /api/refresh-trends
Manually recalculate trend data

---

## Data Migration

### From File Storage to PostgreSQL

If you have existing file data:

1. **Export to GeoJSON**:
   - Use existing `data/sample_data.geojson`

2. **Import via API**:
   ```bash
   curl -X POST http://localhost:5000/api/upload \
     -F "file=@data/sample_data.geojson" \
     -F "year=2024"
   ```

3. **Or import via SQL**:
   - Edit `database/seed.sql` with your data
   - Run: `psql -d srhr_dashboard -f database/seed.sql`

---

## Local Development Setup

### Quick Start

```bash
# 1. Install PostgreSQL (see LOCAL_POSTGRES_SETUP.md)

# 2. Create database
createdb srhr_dashboard

# 3. Run schema
psql -d srhr_dashboard -f database/schema.sql

# 4. Seed data
psql -d srhr_dashboard -f database/seed.sql

# 5. Configure .env
cp .env.example .env
# Edit DATABASE_URL in .env

# 6. Install dependencies
pip install -r requirements.txt

# 7. Run backend
python app_db.py

# 8. Run frontend (new terminal)
npm run dev
```

---

## Production Deployment

See `DEPLOYMENT_GUIDE.md` for complete Render.com setup instructions.

### Summary

1. Create PostgreSQL database on Render
2. Run schema.sql
3. Deploy backend (app_db.py)
4. Deploy frontend
5. Done! Years automatically populate from database

---

## Data Management

### Adding Data for New Year

**Option 1: Via Upload Interface**
1. Prepare GeoJSON file with `year: 2026` in properties
2. Go to dashboard → Upload Data
3. Select file and upload
4. Year 2026 automatically appears!

**Option 2: Via SQL**
```sql
-- Add multiple platforms for 2026
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location)
VALUES 
  ('Platform 1', 'Youth Committee', 55, 90, 2026, 'Address 1', 
   ST_SetSRID(ST_MakePoint(31.05, -17.83), 4326)),
  ('Platform 2', 'Health Forum', 42, 75, 2026, 'Address 2', 
   ST_SetSRID(ST_MakePoint(31.06, -17.84), 4326));

-- Refresh trends
-- Will be done automatically or call API: POST /api/refresh-trends
```

**Option 3: Via API**
```python
import requests

data = {
    "name": "New Platform",
    "type": "Youth Committee",
    "youth_count": 60,
    "total_members": 100,
    "year": 2026,
    "address": "Harare",
    "coordinates": [31.05, -17.83]
}

response = requests.post(
    "https://your-api.onrender.com/api/platform",
    json=data
)
```

---

## Querying Data

### Useful SQL Queries

```sql
-- All years with data
SELECT DISTINCT year FROM health_platforms ORDER BY year;

-- Summary by year
SELECT 
    year,
    COUNT(*) as platforms,
    SUM(youth_count) as total_youth,
    AVG(youth_count) as avg_youth
FROM health_platforms
GROUP BY year
ORDER BY year;

-- Top performing platforms (highest youth %)
SELECT 
    name,
    year,
    youth_count,
    total_members,
    ROUND((youth_count::FLOAT / total_members * 100), 1) as youth_pct
FROM health_platforms
WHERE year = 2024
ORDER BY youth_pct DESC
LIMIT 10;

-- Platforms by type
SELECT 
    type,
    COUNT(*) as count,
    SUM(youth_count) as total_youth
FROM health_platforms
WHERE year = 2024
GROUP BY type
ORDER BY count DESC;

-- Geographic queries with PostGIS
-- Find platforms within 5km of a point
SELECT 
    name,
    ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(31.05, -17.83), 4326)::geography
    ) / 1000 as distance_km
FROM health_platforms
WHERE year = 2024
  AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(31.05, -17.83), 4326)::geography,
        5000
      )
ORDER BY distance_km;
```

---

## Benefits of PostgreSQL

### 1. **Scalability**
- Handle millions of records
- Efficient indexing
- Query optimization

### 2. **Data Integrity**
- Foreign keys
- Constraints (CHECK, NOT NULL)
- Transactions (ACID)

### 3. **PostGIS Features**
- Spatial queries
- Distance calculations
- Geometry operations
- GeoJSON export

### 4. **Reporting**
- SQL queries for custom reports
- Connect BI tools (Tableau, Power BI)
- Export to CSV, Excel

### 5. **Backup & Recovery**
- Automated backups
- Point-in-time recovery
- Disaster recovery

---

## Performance Tips

### Indexes
Already created for:
- `health_platforms.year`
- `health_platforms.type`
- `health_platforms.location` (spatial index)

### Query Optimization
```sql
-- Use EXPLAIN to analyze queries
EXPLAIN ANALYZE SELECT * FROM health_platforms WHERE year = 2024;

-- Create additional indexes if needed
CREATE INDEX idx_name ON health_platforms(name);
```

### Connection Pooling
Already handled by SQLAlchemy in `app_db.py`.

---

## Monitoring

### Check Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size('srhr_dashboard')) as size;
```

### Check Table Sizes
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

---

## Migration Checklist

Migrating from old system to new:

- [ ] Install PostgreSQL locally
- [ ] Run schema.sql
- [ ] Run seed.sql  
- [ ] Update .env with DATABASE_URL
- [ ] Test app_db.py locally
- [ ] Verify dynamic years working
- [ ] Test data upload
- [ ] Deploy to Render.com
- [ ] Import historical data
- [ ] Update team documentation
- [ ] Train users on new system

---

## Support

### Documentation
- `LOCAL_POSTGRES_SETUP.md` - Local setup
- `DEPLOYMENT_GUIDE.md` - Render.com deployment
- `database/schema.sql` - Database structure
- `database/models.py` - SQLAlchemy models

### Help
- PostgreSQL: https://www.postgresql.org/docs/
- PostGIS: https://postgis.net/documentation/
- SQLAlchemy: https://docs.sqlalchemy.org/
- GeoAlchemy2: https://geoalchemy-2.readthedocs.io/

---

**Database Version**: 1.0.0  
**PostgreSQL**: 15  
**PostGIS**: 3.x  
**Last Updated**: November 2025

