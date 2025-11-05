# SRHR Geospatial Dashboard - Installation Guide

## Prerequisites

### Required Software

1. **Python 3.8 or higher**
   - Download: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify: `python --version`

2. **Node.js 16 or higher**
   - Download: https://nodejs.org/
   - Choose LTS (Long Term Support) version
   - Verify: `node --version` and `npm --version`

3. **Git** (Optional, for version control)
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

### System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 500MB free space
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, or Safari 14+
- **Internet**: Required for map tiles and installation

---

## Installation Steps

### Step 1: Navigate to Project Directory

Open Command Prompt or PowerShell and navigate to the project folder:

```bash
cd "C:\Users\Administrator\Documents\SRHR Dashboard"
```

### Step 2: Run Automated Setup

The easiest way to install is using the setup script:

```bash
setup.bat
```

This will:
1. Create a Python virtual environment
2. Activate the virtual environment
3. Install all Python dependencies from `requirements.txt`
4. Install all Node.js dependencies from `package.json`

**Expected output:**
```
===================================
SRHR Geospatial Dashboard Setup
===================================

[1/4] Setting up Python virtual environment...
[2/4] Activating virtual environment...
[3/4] Installing Python dependencies...
[4/4] Installing Node.js dependencies...

===================================
Setup completed successfully!
===================================
```

### Step 3: Verify Installation

Check that all dependencies are installed:

**Python packages:**
```bash
venv\Scripts\activate
pip list
```

You should see:
- Flask
- Flask-CORS
- geopandas
- pandas
- shapely
- fiona

**Node.js packages:**
```bash
npm list --depth=0
```

You should see:
- react
- react-dom
- leaflet
- react-leaflet
- recharts
- axios
- lucide-react

---

## Manual Installation (Alternative)

If the automated setup fails, follow these manual steps:

### Backend Setup

1. **Create Virtual Environment:**
```bash
python -m venv venv
```

2. **Activate Virtual Environment:**

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

3. **Install Python Dependencies:**
```bash
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0
pip install geopandas==0.14.1
pip install pandas==2.1.3
pip install shapely==2.0.2
pip install fiona==1.9.5
pip install python-dotenv==1.0.0
pip install Werkzeug==3.0.1
```

Or install from requirements.txt:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. **Install Node.js Dependencies:**
```bash
npm install react@18.2.0
npm install react-dom@18.2.0
npm install leaflet@1.9.4
npm install react-leaflet@4.2.1
npm install recharts@2.10.3
npm install axios@1.6.2
npm install lucide-react@0.294.0
```

Or install from package.json:
```bash
npm install
```

---

## Running the Application

### Option 1: Run Both Servers Together

Double-click `run-all.bat` or execute:
```bash
run-all.bat
```

This opens two terminal windows:
- **Backend**: Running on http://localhost:5000
- **Frontend**: Running on http://localhost:5173

### Option 2: Run Servers Separately

**Terminal 1 - Start Backend:**
```bash
run-backend.bat
```
Or manually:
```bash
venv\Scripts\activate
python app.py
```

**Terminal 2 - Start Frontend:**
```bash
run-frontend.bat
```
Or manually:
```bash
npm run dev
```

### Option 3: Production Build

To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## Accessing the Dashboard

1. **Open your web browser**
2. **Navigate to:** http://localhost:5173
3. **You should see:**
   - Dark-themed dashboard
   - Interactive map of Harare
   - 8 sample locations
   - Statistics cards
   - Trend chart

---

## Verification Checklist

After installation, verify these features work:

- [ ] Backend API responds at http://localhost:5000/api/health
- [ ] Frontend loads at http://localhost:5173
- [ ] Map displays with dark theme
- [ ] 8 location markers appear on map
- [ ] Sidebar shows location list
- [ ] Statistics cards display data
- [ ] Chart renders at bottom
- [ ] Clicking markers opens popups
- [ ] Year selector works
- [ ] Upload modal opens
- [ ] Search filters locations

---

## Troubleshooting

### Problem: Python not found

**Solution:**
- Reinstall Python and check "Add to PATH"
- Restart terminal/command prompt
- Try: `py --version` instead of `python --version`

### Problem: pip not found

**Solution:**
```bash
python -m ensurepip --upgrade
```

### Problem: Node/npm not found

**Solution:**
- Reinstall Node.js
- Restart terminal
- Check PATH environment variable

### Problem: Port 5000 already in use

**Solution:**
- Close application using port 5000
- Or edit `app.py` line: `app.run(debug=True, port=5001)`

### Problem: Port 5173 already in use

**Solution:**
Edit `vite.config.js`:
```javascript
server: {
  port: 5174  // Change to different port
}
```

### Problem: GDAL/Fiona installation fails

**Solution for Windows:**
1. Download wheel files from: https://www.lfd.uci.edu/~gohlke/pythonlibs/
2. Install manually:
```bash
pip install GDAL‑3.4.3‑cp311‑cp311‑win_amd64.whl
pip install Fiona‑1.9.4‑cp311‑cp311‑win_amd64.whl
```

### Problem: Module not found errors

**Solution:**
```bash
# Clear caches and reinstall
rm -rf node_modules
rm -rf venv
setup.bat
```

### Problem: Map tiles not loading

**Solution:**
- Check internet connection
- Disable VPN/proxy
- Clear browser cache
- Try different browser

### Problem: No data showing

**Solution:**
- Check browser console (F12)
- Verify backend is running
- Check `data/sample_data.geojson` exists
- Verify CORS is enabled

---

## Environment Variables (Optional)

Create a `.env` file in the project root:

```env
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000
UPLOAD_FOLDER=uploads
DATA_FOLDER=data
```

---

## Database Setup (Future Enhancement)

Currently, the dashboard uses file-based storage. To add database support:

### SQLite (Simple)
```python
import sqlite3
# Add to app.py
```

### PostgreSQL with PostGIS (Advanced)
```bash
pip install psycopg2-binary
pip install sqlalchemy
pip install geoalchemy2
```

---

## Docker Installation (Advanced)

For containerized deployment:

**Dockerfile:**
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

**Build and run:**
```bash
docker build -t srhr-dashboard .
docker run -p 5000:5000 srhr-dashboard
```

---

## Cloud Deployment

### Heroku
```bash
# Install Heroku CLI
heroku login
heroku create srhr-dashboard
git push heroku main
```

### AWS EC2
1. Launch EC2 instance (Ubuntu)
2. SSH into instance
3. Clone repository
4. Run setup.bat
5. Configure security groups (ports 5000, 5173)

### Azure
```bash
az webapp up --name srhr-dashboard --resource-group srhr-rg
```

---

## Updating Dependencies

### Update Python packages:
```bash
venv\Scripts\activate
pip list --outdated
pip install --upgrade package-name
pip freeze > requirements.txt
```

### Update Node packages:
```bash
npm outdated
npm update
npm install package-name@latest
```

---

## Uninstallation

To completely remove the application:

1. **Delete virtual environment:**
```bash
rmdir /s venv
```

2. **Delete node_modules:**
```bash
rmdir /s node_modules
```

3. **Delete uploaded data:**
```bash
rmdir /s uploads
rmdir /s data
```

4. **Delete project folder** (if desired)

---

## Next Steps

After successful installation:

1. **Read Documentation:**
   - `GETTING_STARTED.md` - Usage guide
   - `FEATURES.md` - Feature details
   - `QUICK_REFERENCE.md` - Quick commands

2. **Upload Your Data:**
   - Prepare GeoJSON file
   - Click "Upload Data" button
   - Select your file
   - Verify upload success

3. **Customize:**
   - Edit colors in CSS files
   - Modify data format in `app.py`
   - Add new features as needed

4. **Share:**
   - Deploy to web server
   - Share URL with team
   - Gather feedback

---

## Support

For installation issues:
- Check this guide thoroughly
- Review error messages carefully
- Search for specific error online
- Check GitHub issues (if applicable)

**Common Resources:**
- Python docs: https://docs.python.org/
- Node.js docs: https://nodejs.org/docs/
- React docs: https://react.dev/
- Leaflet docs: https://leafletjs.com/
- Flask docs: https://flask.palletsprojects.com/

---

**Installation Version**: 1.0.0  
**Last Updated**: November 2025  
**Platform**: Windows 10/11 (adaptable to Mac/Linux)

