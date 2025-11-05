# 🐘 Local PostgreSQL Setup Guide

## Setting up PostgreSQL locally for development

---

## Step 1: Install PostgreSQL

### Windows

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer (version 15 recommended)
3. During installation:
   - Set password for postgres user
   - Port: 5432 (default)
   - Install Stack Builder → Select PostGIS

**OR use Chocolatey:**
```powershell
choco install postgresql
choco install postgis
```

### Mac

**Using Homebrew:**
```bash
brew install postgresql@15
brew install postgis

# Start PostgreSQL
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql-15 postgresql-15-postgis-3
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Step 2: Create Database

### 2.1 Access PostgreSQL

```bash
# Windows
psql -U postgres

# Mac/Linux
sudo -u postgres psql
```

### 2.2 Create Database and User

```sql
-- Create database
CREATE DATABASE srhr_dashboard;

-- Create user
CREATE USER srhr_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE srhr_dashboard TO srhr_user;

-- Connect to database
\c srhr_dashboard

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO srhr_user;

-- Exit
\q
```

---

## Step 3: Run Schema and Seed Scripts

From your project directory:

```bash
# Run schema
psql -U srhr_user -d srhr_dashboard -f database/schema.sql

# Seed data
psql -U srhr_user -d srhr_dashboard -f database/seed.sql
```

**If prompted for password**, enter the one you set above.

---

## Step 4: Configure Environment

### 4.1 Create .env File

```bash
# Copy example
cp .env.example .env
```

### 4.2 Edit .env

```env
FLASK_APP=app_db.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-this

# Database Configuration
DATABASE_URL=postgresql://srhr_user:your_secure_password@localhost:5432/srhr_dashboard

DB_HOST=localhost
DB_PORT=5432
DB_NAME=srhr_dashboard
DB_USER=srhr_user
DB_PASSWORD=your_secure_password

# Upload Configuration
UPLOAD_FOLDER=uploads
DATA_FOLDER=data
MAX_UPLOAD_SIZE=16777216

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Step 5: Install Python Dependencies

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

---

## Step 6: Run the Application

### Backend

```bash
# Make sure .env is configured
python app_db.py
```

Server starts at: `http://localhost:5000`

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Get available years
curl http://localhost:5000/api/years

# Get 2024 data
curl http://localhost:5000/api/geospatial-data?year=2024

# Get statistics
curl http://localhost:5000/api/statistics?year=2024
```

### Frontend

In a new terminal:

```bash
npm run dev
```

Opens at: `http://localhost:5173`

---

## Step 7: Verify Data

### Connect to Database

```bash
psql -U srhr_user -d srhr_dashboard
```

### Check Data

```sql
-- List tables
\dt

-- Count platforms by year
SELECT year, COUNT(*) FROM health_platforms GROUP BY year ORDER BY year;

-- View all platforms
SELECT id, name, year, youth_count, total_members FROM health_platforms;

-- Check trends
SELECT * FROM trend_data ORDER BY year;

-- View platform stats
SELECT * FROM platform_stats_by_year;

-- Exit
\q
```

---

## Common Commands

### Database Management

```bash
# Start PostgreSQL (if not running)
# Windows: Check Services app
# Mac: brew services start postgresql@15
# Linux: sudo systemctl start postgresql

# Stop PostgreSQL
# Windows: Check Services app
# Mac: brew services stop postgresql@15
# Linux: sudo systemctl stop postgresql

# Restart PostgreSQL
# Windows: Check Services app
# Mac: brew services restart postgresql@15
# Linux: sudo systemctl restart postgresql

# Check PostgreSQL status
# Mac: brew services list
# Linux: sudo systemctl status postgresql
```

### Backup & Restore

```bash
# Backup database
pg_dump -U srhr_user srhr_dashboard > backup.sql

# Restore database
psql -U srhr_user -d srhr_dashboard < backup.sql

# Backup with custom format (compressed)
pg_dump -U srhr_user -Fc srhr_dashboard > backup.dump

# Restore custom format
pg_restore -U srhr_user -d srhr_dashboard backup.dump
```

### Reset Database

```bash
# Drop and recreate
psql -U postgres
DROP DATABASE srhr_dashboard;
CREATE DATABASE srhr_dashboard;
GRANT ALL PRIVILEGES ON DATABASE srhr_dashboard TO srhr_user;
\c srhr_dashboard
CREATE EXTENSION postgis;
\q

# Run schema and seed again
psql -U srhr_user -d srhr_dashboard -f database/schema.sql
psql -U srhr_user -d srhr_dashboard -f database/seed.sql
```

---

## Troubleshooting

### Can't Connect to PostgreSQL

**Check if running:**
```bash
# Windows
Get-Service postgresql*

# Mac
brew services list

# Linux
sudo systemctl status postgresql
```

**Check port:**
```bash
netstat -an | grep 5432
```

### Password Authentication Failed

**Reset password:**
```bash
psql -U postgres
ALTER USER srhr_user WITH PASSWORD 'new_password';
\q
```

Then update `.env` file.

### PostGIS Extension Not Found

**Install PostGIS:**
```bash
# Windows: Use Stack Builder or download from postgis.net
# Mac: brew install postgis
# Linux: sudo apt install postgresql-15-postgis-3
```

Then connect and run:
```sql
CREATE EXTENSION postgis;
```

### Permission Denied

**Grant permissions:**
```sql
\c srhr_dashboard
GRANT ALL ON SCHEMA public TO srhr_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO srhr_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO srhr_user;
```

---

## GUI Tools (Optional)

### pgAdmin

Free PostgreSQL GUI tool:
- Download: https://www.pgadmin.org/
- Connect to: localhost:5432
- Database: srhr_dashboard

### DBeaver

Universal database tool:
- Download: https://dbeaver.io/
- Supports PostgreSQL, PostGIS
- Free community edition

### VS Code Extension

Install "PostgreSQL" extension:
- Explore database from VS Code
- Run queries directly
- View table data

---

## Next Steps

1. ✅ Database running locally
2. ✅ Schema and data loaded
3. ✅ Backend connects successfully
4. ✅ Frontend fetches data from database

Now you can:
- Add new years of data
- Upload geospatial files
- Test before deploying to Render
- Develop new features locally

---

**Setup Version**: 1.0.0  
**PostgreSQL Version**: 15  
**PostGIS Version**: 3.x  
**Platform**: Local Development

