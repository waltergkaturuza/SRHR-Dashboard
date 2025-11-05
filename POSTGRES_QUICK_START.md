# 🚀 PostgreSQL Upgrade - Quick Start

## What You Now Have

Your SRHR Dashboard has been upgraded with **PostgreSQL + PostGIS** for scalable, production-ready data management with **dynamic year selection**!

---

## 🎯 Key New Features

### 1. Dynamic Years ✨
- **Before**: Years hardcoded (2018-2024)
- **Now**: Years automatically populate from database!
- Add data for any year (2020, 2025, 2030...) and it appears in the dropdown

### 2. PostgreSQL Database 🐘
- Professional database with ACID compliance
- Spatial queries with PostGIS
- Handles millions of records
- Easy backup and restore

### 3. Scalable for Future 📈
- Add unlimited years of data
- Query historical trends
- Export reports via SQL
- Deploy on Render.com

---

## 📁 New Files Created

### Database Files
```
database/
├── schema.sql          ← Database structure
├── seed.sql            ← Sample data (2022-2025)
└── models.py           ← SQLAlchemy models
```

### Backend
```
app_db.py               ← New PostgreSQL-enabled backend
                          (Use this instead of app.py!)
```

### Configuration
```
.env.example            ← Environment variables template
Procfile                ← For Render deployment
runtime.txt             ← Python version
render.yaml             ← Render configuration
```

### Documentation
```
DEPLOYMENT_GUIDE.md          ← Full Render.com deployment guide
LOCAL_POSTGRES_SETUP.md      ← Local PostgreSQL setup
DATABASE_README.md           ← Database documentation
POSTGRES_QUICK_START.md      ← This file
```

---

## 🏃 Quick Start Options

### Option A: Deploy to Render.com (Recommended)

**1. Push to GitHub**
```bash
git add .
git commit -m "Add PostgreSQL support"
git push origin main
```

**2. Follow deployment guide**
Read: `DEPLOYMENT_GUIDE.md`

**3. Done!**
Your dashboard is live on Render.com with PostgreSQL!

---

### Option B: Run Locally

**1. Install PostgreSQL**
Follow: `LOCAL_POSTGRES_SETUP.md`

**2. Create database**
```bash
createdb srhr_dashboard
psql -d srhr_dashboard < database/schema.sql
psql -d srhr_dashboard < database/seed.sql
```

**3. Configure .env**
```bash
cp .env.example .env
# Edit DATABASE_URL in .env
```

**4. Install dependencies**
```bash
pip install -r requirements.txt
```

**5. Run**
```bash
python app_db.py
# In another terminal:
npm run dev
```

**6. Open**
http://localhost:5173

---

## 🎨 What Changed in the UI

### Year Selector
- Now dynamically loads from `/api/years`
- Shows all years in database (not hardcoded)
- Automatically updates when you add data

### Example
```
Before (hardcoded):
[2018, 2019, 2020, 2021, 2022, 2023, 2024]

After (from database):
[2022, 2023, 2024, 2025] ← Based on actual data!

Add 2026 data → [2022, 2023, 2024, 2025, 2026] ← Automatic!
```

---

## 📊 Sample Data Included

The `seed.sql` file includes data for:

- **2022**: 8 platforms, 278 youth
- **2023**: 8 platforms, 302 youth
- **2024**: 8 platforms, 324 youth
- **2025**: 9 platforms, 348 youth (includes future data example)

---

## 🔑 Key API Changes

### New Endpoints

#### GET /api/years
```json
{
  "years": [2022, 2023, 2024, 2025],
  "current_year": 2025
}
```

#### All other endpoints now use PostgreSQL
- `/api/geospatial-data` - Fetches from database
- `/api/statistics` - Calculated from database
- `/api/trends` - From trend_data table
- `/api/upload` - Saves to database

---

## 💡 How to Add New Years

### Method 1: Upload via UI
```
1. Prepare GeoJSON with year: 2026 in properties
2. Click "Upload Data"
3. Upload file
4. Year 2026 appears in dropdown!
```

### Method 2: Direct SQL
```sql
psql -d srhr_dashboard

INSERT INTO health_platforms 
  (name, type, youth_count, total_members, year, address, location)
VALUES 
  ('New Platform', 'Youth Committee', 50, 80, 2026, 'Address',
   ST_SetSRID(ST_MakePoint(31.05, -17.83), 4326));

-- Exit and refresh dashboard - 2026 now shows!
```

### Method 3: Via API (programmatically)
```python
import requests

data = {
    "file": open("data_2026.geojson", "rb"),
    "year": 2026
}

requests.post("http://your-api.com/api/upload", files=data)
```

---

## 🗄️ Database Structure

### Tables
- **health_platforms** - All platforms data
- **trend_data** - Aggregated statistics by year

### Views
- **platform_stats_by_year** - Year summaries
- **platform_types_distribution** - Type breakdowns

### Indexes
- Optimized for year, type, and location queries

---

## 🔒 Security & Best Practices

### Environment Variables
Never commit these to Git:
- `DATABASE_URL`
- `SECRET_KEY`
- Database passwords

Use `.env` file locally (already in .gitignore)

### Render.com
Environment variables automatically secured

---

## 📚 Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `POSTGRES_QUICK_START.md` | Overview (this file) | First! |
| `LOCAL_POSTGRES_SETUP.md` | Local development | Setting up locally |
| `DEPLOYMENT_GUIDE.md` | Production deployment | Deploying to Render |
| `DATABASE_README.md` | Database details | Understanding schema |
| `START_HERE.md` | Original setup | Original instructions |

---

## ✅ Migration Checklist

If migrating from old file-based system:

- [ ] Read this quick start
- [ ] Choose deployment method (local or Render)
- [ ] Set up PostgreSQL
- [ ] Run schema.sql
- [ ] Run seed.sql (or import your data)
- [ ] Update .env
- [ ] Test locally
- [ ] Deploy to production
- [ ] Verify years load dynamically
- [ ] Add new year data to test
- [ ] Update team documentation

---

## 🆘 Troubleshooting

### Years not showing?
- Check API response: `curl http://localhost:5000/api/years`
- Verify database has data: `psql -d srhr_dashboard -c "SELECT DISTINCT year FROM health_platforms;"`

### Database connection error?
- Check `.env` has correct `DATABASE_URL`
- Verify PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### PostGIS error?
```sql
-- Connect to database
psql -d srhr_dashboard

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 🎉 Success Indicators

You're successfully upgraded when:

- ✅ Backend runs with `python app_db.py` (no errors)
- ✅ Frontend loads at http://localhost:5173
- ✅ Year dropdown shows multiple years
- ✅ Years are from database (not hardcoded)
- ✅ Map displays platform markers
- ✅ Statistics cards show data
- ✅ Upload works and saves to database
- ✅ Adding new year data updates dropdown

---

## 💰 Cost Estimate

### Free Tier (Render.com)
- PostgreSQL: 1 GB storage
- Web Service: 750 hours/month
- Total: **$0/month**
- Great for testing and small deployments

### Production (Starter)
- PostgreSQL: 10 GB, dedicated CPU
- Web Service: Always-on, 0.5 GB RAM
- Total: **~$14/month**
- Recommended for production use

---

## 🔄 Migration Timeline

**From old system to PostgreSQL:**

1. **Setup** (30 min)
   - Install PostgreSQL
   - Run schema & seed

2. **Testing** (15 min)
   - Test locally
   - Verify functionality

3. **Deploy** (45 min)
   - Set up Render.com
   - Deploy backend & frontend

4. **Verify** (15 min)
   - Test production
   - Import real data

**Total: ~2 hours** for complete migration!

---

## 🚀 Next Steps

### Today
1. Choose deployment option (local or Render)
2. Follow setup guide
3. Test with sample data

### This Week
1. Import your historical data
2. Train team on new system
3. Deploy to production

### This Month
1. Add new year data
2. Monitor performance
3. Optimize queries if needed

---

## 📞 Quick Links

- **Local Setup**: `LOCAL_POSTGRES_SETUP.md`
- **Deploy Guide**: `DEPLOYMENT_GUIDE.md`
- **Database Info**: `DATABASE_README.md`
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Render Docs**: https://render.com/docs

---

## 🎯 Key Takeaway

**Your dashboard now has unlimited scalability!**

Add data for any year (past, present, or future) and it automatically appears in the year selector. The system is ready to grow with your needs for years to come.

---

**Version**: 2.0.0 (PostgreSQL Edition)  
**Upgrade Date**: November 2025  
**Status**: Production Ready ✅

