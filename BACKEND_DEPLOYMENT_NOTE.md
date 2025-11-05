# ⚠️ IMPORTANT: Backend Deployment Note

## Requirements File Renamed

The `requirements.txt` file has been renamed to **`requirements-backend.txt`** to prevent conflicts with the frontend Static Site deployment on Render.com.

---

## Why This Change?

Render.com automatically detects project types by looking for:
- `requirements.txt` → Assumes Python project
- `package.json` → Assumes Node.js project

Since our repository contains **both** frontend (React) and backend (Flask) code in the same repo, Render was trying to install Python dependencies when building the frontend Static Site, causing:
- ❌ 30+ minute build times
- ❌ Installation of unnecessary packages (pandas, geopandas, etc.)
- ❌ Potential build failures

By renaming to `requirements-backend.txt`, we ensure:
- ✅ Frontend builds as Static Site (Node.js only)
- ✅ Backend explicitly uses `requirements-backend.txt`

---

## Backend Deployment Configuration

When deploying the **Backend API** on Render.com, use:

### Build Command:
```bash
pip install -r requirements-backend.txt
```

### Start Command:
```bash
gunicorn app_db:app
```

### Environment Variables:
```
PYTHON_VERSION=3.11.0
DATABASE_URL=[from PostgreSQL service]
SECRET_KEY=[generate random string]
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend-url.onrender.com
UPLOAD_FOLDER=uploads
MAX_UPLOAD_SIZE=16777216
```

---

## Files Updated

- ✅ `requirements.txt` → `requirements-backend.txt`
- ✅ `Procfile` - Updated to reference new filename
- ✅ `render.yaml` - Updated build command
- ✅ `.renderignore` - Added to ignore backend files on frontend

---

## Local Development

For local development, install backend dependencies using:

```bash
# Activate virtual environment
venv\Scripts\activate

# Install from renamed file
pip install -r requirements-backend.txt

# Run backend
python app_db.py
```

---

## CI/CD & Documentation

If you have any CI/CD pipelines or scripts that reference `requirements.txt`, update them to use `requirements-backend.txt` instead.

---

**Updated**: November 2025  
**Reason**: Frontend/Backend separation in monorepo

