# 🚀 Render.com Deployment Guide

## Complete guide to deploying SRHR Dashboard on Render.com with PostgreSQL

---

## Prerequisites

- GitHub account (to connect your repository)
- Render.com account (free tier available)
- Your code pushed to a Git repository

---

## Step 1: Prepare Your Repository

### 1.1 Commit All Files

Ensure these files are in your repository:

```
✅ app_db.py (new PostgreSQL-enabled backend)
✅ requirements.txt (updated with PostgreSQL dependencies)
✅ Procfile (for Gunicorn)
✅ runtime.txt (Python version)
✅ render.yaml (Render configuration)
✅ database/schema.sql
✅ database/seed.sql
✅ database/models.py
✅ .env.example (template for environment variables)
```

### 1.2 Push to GitHub

```bash
git add .
git commit -m "Add PostgreSQL support and Render deployment files"
git push origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### 2.1 Go to Render Dashboard

1. Log in to [Render.com](https://render.com)
2. Click **"New +"** button
3. Select **"PostgreSQL"**

### 2.2 Configure Database

Fill in the form:
- **Name**: `srhr-postgres` (or your preferred name)
- **Database**: `srhr_dashboard`
- **User**: `srhr_user` (will be auto-generated)
- **Region**: Choose closest to your users
- **PostgreSQL Version**: **15** (has PostGIS support)
- **Plan**: **Free** (or select paid plan)

Click **"Create Database"**

### 2.3 Wait for Database Creation

- This takes 2-5 minutes
- Database will show "Available" when ready
- Note down the **Internal Database URL** (starts with `postgres://`)

---

## Step 3: Initialize Database Schema

### 3.1 Connect to Database

In Render dashboard:
1. Go to your PostgreSQL database
2. Click **"Connect"** tab
3. Copy the **PSQL Command**

### 3.2 Run Schema Script

Open your terminal and connect:

```bash
# The command looks like:
psql postgres://srhr_user:password@dpg-xxxxx.oregon-postgres.render.com/srhr_dashboard

# Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

# Exit psql
\q
```

Then run the schema file:

```bash
# From your local project directory
psql [your-database-url] < database/schema.sql
```

### 3.3 Seed Sample Data

```bash
psql [your-database-url] < database/seed.sql
```

### 3.4 Verify Data

```bash
psql [your-database-url]

# Inside psql:
SELECT year, COUNT(*) FROM health_platforms GROUP BY year ORDER BY year;
\q
```

You should see data for years 2022, 2023, 2024, 2025.

---

## Step 4: Deploy Backend API

### 4.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository

### 4.2 Configure Service

Fill in the form:

**Basic Settings:**
- **Name**: `srhr-dashboard-api`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: Leave empty (or specify if in subdirectory)
- **Runtime**: **Python 3**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app_db:app --bind 0.0.0.0:$PORT`

**Advanced Settings:**

Click **"Advanced"** and add environment variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `DATABASE_URL` | Copy from PostgreSQL "Internal Database URL" |
| `SECRET_KEY` | Generate random string (32+ characters) |
| `FLASK_ENV` | `production` |
| `CORS_ORIGINS` | `https://your-frontend-url.onrender.com` (update after frontend deploy) |
| `UPLOAD_FOLDER` | `uploads` |
| `MAX_UPLOAD_SIZE` | `16777216` |

Click **"Create Web Service"**

### 4.3 Wait for Deployment

- Build takes 3-5 minutes
- Watch the logs for any errors
- Service is ready when it shows "Live"

### 4.4 Test API

Your API URL: `https://srhr-dashboard-api.onrender.com`

Test endpoints:
```bash
# Health check
curl https://srhr-dashboard-api.onrender.com/api/health

# Get years
curl https://srhr-dashboard-api.onrender.com/api/years

# Get data for 2024
curl https://srhr-dashboard-api.onrender.com/api/geospatial-data?year=2024
```

---

## Step 5: Deploy Frontend

### 5.1 Update Frontend API URL

Edit `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://srhr-dashboard-api.onrender.com', // Your Render API URL
        changeOrigin: true,
      }
    }
  }
})
```

Commit and push changes.

### 5.2 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Select your repository

### 5.3 Configure Static Site

**Basic Settings:**
- **Name**: `srhr-dashboard-frontend`
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Environment Variables:**
- Add `VITE_API_URL` = `https://srhr-dashboard-api.onrender.com` (optional)

Click **"Create Static Site"**

### 5.4 Wait for Deployment

- Build takes 2-4 minutes
- Frontend is ready when status shows "Live"

### 5.5 Update CORS

1. Go back to your **Backend service**
2. Go to **Environment** tab
3. Update `CORS_ORIGINS` to include your frontend URL:
   ```
   https://srhr-dashboard-frontend.onrender.com
   ```
4. Save changes (service will restart automatically)

---

## Step 6: Verify Deployment

### 6.1 Test Your Dashboard

Visit: `https://srhr-dashboard-frontend.onrender.com`

**Check:**
- ✅ Dashboard loads
- ✅ Map displays with markers
- ✅ Year selector shows multiple years (2022-2025)
- ✅ Statistics cards show data
- ✅ Charts render properly
- ✅ Theme toggle works
- ✅ Upload functionality (try uploading data)

### 6.2 Test API Directly

```bash
# Replace with your actual API URL
API_URL="https://srhr-dashboard-api.onrender.com"

# Test health
curl $API_URL/api/health

# Test years (should return dynamic list)
curl $API_URL/api/years

# Test data
curl "$API_URL/api/geospatial-data?year=2024"

# Test statistics
curl "$API_URL/api/statistics?year=2024"

# Test trends
curl $API_URL/api/trends
```

---

## Step 7: Database Management

### 7.1 Connect to Production Database

From your local machine:

```bash
# Get connection string from Render dashboard
psql postgres://username:password@host/database
```

### 7.2 Add New Year Data

```sql
-- Add data for 2026
INSERT INTO health_platforms (name, type, youth_count, total_members, year, address, location) VALUES
('New Platform', 'Youth Committee', 50, 80, 2026, 'Address', 
 ST_SetSRID(ST_MakePoint(31.0492, -17.8252), 4326));

-- Refresh trends
-- (Or call API endpoint: POST /api/refresh-trends)
```

### 7.3 Update Existing Data

```sql
-- Update youth count for a platform
UPDATE health_platforms 
SET youth_count = 55 
WHERE name = 'Platform Name' AND year = 2024;
```

### 7.4 Backup Database

In Render dashboard:
1. Go to your PostgreSQL database
2. Click **"Backups"** tab (paid plans only)
3. For free tier, export manually:

```bash
pg_dump [your-database-url] > backup.sql
```

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain to Frontend

1. Go to your Static Site
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain (e.g., `dashboard.yoursite.com`)
4. Follow DNS configuration instructions

### 8.2 Update CORS

Update `CORS_ORIGINS` in backend to include your custom domain.

---

## Troubleshooting

### Issue: Database Connection Error

**Solution:**
- Check `DATABASE_URL` in backend environment variables
- Ensure it starts with `postgresql://` (not `postgres://`)
- Verify database is "Available" in Render dashboard

### Issue: PostGIS Not Found

**Solution:**
```sql
-- Connect to database
psql [your-database-url]

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Frontend Can't Reach API

**Solution:**
- Check `CORS_ORIGINS` includes your frontend URL
- Verify API is deployed and "Live"
- Check browser console for CORS errors
- Update `vite.config.js` proxy settings

### Issue: Upload Fails

**Solution:**
- Render free tier has limited disk space
- Uploads are temporary (cleared on redeploy)
- Consider using cloud storage (S3, Cloudinary) for production

### Issue: Slow Cold Starts

**Solution:**
- Free tier services "spin down" after inactivity
- Upgrade to paid tier for always-on services
- Or use a cron job to ping your API every 10 minutes

---

## Cost Breakdown

### Free Tier (Good for Testing)

- **PostgreSQL**: 1 GB storage, shared CPU
- **Web Service**: 750 hours/month, shared CPU
- **Static Site**: 100 GB bandwidth
- **Total**: $0/month
- **Limitations**: Services spin down after 15 min inactivity

### Starter Tier (Recommended for Production)

- **PostgreSQL Starter**: $7/month (10 GB, dedicated CPU)
- **Web Service Starter**: $7/month (always-on, 0.5 GB RAM)
- **Static Site**: Free (100 GB bandwidth)
- **Total**: ~$14/month

---

## Maintenance Tasks

### Daily/Weekly

- ✅ Monitor API health endpoint
- ✅ Check for errors in Render logs
- ✅ Verify data uploads working

### Monthly

- ✅ Review database size
- ✅ Clean up old uploaded files
- ✅ Update dependencies
- ✅ Backup database

### Quarterly

- ✅ Review and optimize database queries
- ✅ Update Python/Node versions
- ✅ Security audit

---

## Environment Variables Reference

### Backend (app_db.py)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | Flask secret key | Random 32+ char string |
| `FLASK_ENV` | Environment | `production` |
| `CORS_ORIGINS` | Allowed origins | `https://your-site.com` |
| `UPLOAD_FOLDER` | Upload directory | `uploads` |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | `16777216` (16MB) |

### Frontend (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `https://api.render.com` |

---

## Next Steps After Deployment

1. **Add More Data**: Upload geospatial files through the UI
2. **Monitor Performance**: Check Render metrics and logs
3. **Set Up Alerts**: Configure email notifications for downtime
4. **Document API**: Share API documentation with team
5. **Train Users**: Create user guides for data entry
6. **Plan Scaling**: Monitor usage and upgrade as needed

---

## Quick Reference Commands

```bash
# Connect to database
psql $DATABASE_URL

# Run migrations
psql $DATABASE_URL < database/schema.sql

# Seed data
psql $DATABASE_URL < database/seed.sql

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_20250101.sql

# Test API locally with production database
export DATABASE_URL="your-render-database-url"
python app_db.py

# Build frontend locally
npm run build
npm run preview
```

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **PostGIS Docs**: https://postgis.net/documentation/
- **Flask-SQLAlchemy**: https://flask-sqlalchemy.palletsprojects.com/

---

## Success! 🎉

Your SRHR Dashboard is now:
- ✅ Deployed on Render.com
- ✅ Using PostgreSQL with PostGIS
- ✅ Dynamic year selection based on database
- ✅ Scalable for future growth
- ✅ Production-ready

**Your URLs:**
- Frontend: `https://srhr-dashboard-frontend.onrender.com`
- API: `https://srhr-dashboard-api.onrender.com`
- Database: Internal Render PostgreSQL

---

**Deployment Version**: 1.0.0  
**Last Updated**: November 2025  
**Platform**: Render.com (PostgreSQL + Python + React)

