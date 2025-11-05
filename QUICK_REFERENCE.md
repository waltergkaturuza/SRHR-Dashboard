# SRHR Dashboard - Quick Reference

## 🚀 Quick Start Commands

```bash
# Setup (run once)
setup.bat

# Start both servers
run-all.bat

# Or start individually:
run-backend.bat    # Flask API (port 5000)
run-frontend.bat   # React UI (port 5173)

# Access dashboard
http://localhost:5173
```

## 📁 Project Files

| File | Purpose |
|------|---------|
| `app.py` | Flask backend API |
| `src/App.jsx` | Main React component |
| `src/components/MapView.jsx` | Interactive map |
| `src/components/Sidebar.jsx` | Location list |
| `src/components/ChartPanel.jsx` | Analytics |
| `src/components/UploadModal.jsx` | File upload |
| `requirements.txt` | Python packages |
| `package.json` | Node packages |

## 🌐 API Endpoints

```
GET  /api/health                    Health check
GET  /api/geospatial-data?year=2024 Get locations
GET  /api/trends                    Historical data
GET  /api/statistics?year=2024      Summary stats
POST /api/upload                    Upload file
POST /api/reset                     Reset data
```

## 📊 Sample Data Points

| Location | Type | Youth | Total |
|----------|------|-------|-------|
| Harare Central | District Office | 45 | 120 |
| Mbare | Community Committee | 32 | 85 |
| Borrowdale | Health Forum | 28 | 95 |
| Glen View | Youth Committee | 67 | 75 |
| Avondale | Clinic Committee | 19 | 60 |
| Highfield | Community Platform | 54 | 110 |
| Hatfield | SRHR Forum | 41 | 65 |
| Dzivarasekwa | Advisory Board | 38 | 100 |

**Totals**: 324 youth across 8 platforms (45.6% average)

## 🎨 Color Reference

```css
Primary:     #00d4ff  /* Cyan - main accent */
Background:  #1a1a1a  /* Dark gray */
Surface:     #0a0a0a  /* Darker gray */
Border:      #333333  /* Mid gray */
Text:        #ffffff  /* White */
Muted:       #999999  /* Light gray */
Success:     #4caf50  /* Green */
Warning:     #ff9800  /* Orange */
Error:       #f44336  /* Red */
```

## 🗺️ Harare Coordinates

```
City Center: -17.8252, 31.0492
Bounding Box:
  North: -17.78
  South: -17.87
  East: 31.10
  West: 31.00
```

## 📋 GeoJSON Template

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.0492, -17.8252]
    },
    "properties": {
      "id": 1,
      "name": "Platform Name",
      "type": "Platform Type",
      "youth_count": 25,
      "total_members": 100,
      "year": 2024,
      "address": "Address"
    }
  }]
}
```

## 🎯 Key Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Youth Count | People ≤24 years | Direct count |
| Total Members | All participants | Direct count |
| Youth % | Youth representation | (youth/total) × 100 |
| Avg Youth/Platform | Distribution | total youth / platforms |
| Platforms | Active committees | Count of features |

## 🔧 Configuration

### Backend (app.py)
```python
PORT = 5000
UPLOAD_FOLDER = 'uploads'
DATA_FOLDER = 'data'
ALLOWED_EXTENSIONS = {'geojson', 'json', 'shp', 'zip'}
```

### Frontend (vite.config.js)
```javascript
port: 5173
proxy: '/api' -> 'http://localhost:5000'
```

## 📦 Dependencies

### Python
```
Flask==3.0.0
Flask-CORS==4.0.0
geopandas==0.14.1
pandas==2.1.3
shapely==2.0.2
fiona==1.9.5
```

### Node.js
```
react==18.2.0
leaflet==1.9.4
recharts==2.10.3
axios==1.6.2
lucide-react==0.294.0
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Port in use | Change port in `app.py` or `vite.config.js` |
| Module not found | Run `setup.bat` again |
| Map not loading | Check internet connection |
| Upload fails | Verify GeoJSON format |
| No data showing | Check browser console (F12) |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate elements |
| Enter | Activate button |
| Escape | Close modal |
| F5 | Refresh page |
| F12 | Open dev tools |
| Ctrl + | Zoom in |
| Ctrl - | Zoom out |

## 📈 Data Validation Rules

```javascript
Required Fields:
✓ name: string (non-empty)
✓ type: string (non-empty)
✓ youth_count: number (≥0)
✓ total_members: number (>0)
✓ year: number (2000-2100)

Optional Fields:
• address: string
• id: number

Coordinates:
• Format: [longitude, latitude]
• Longitude: -180 to 180
• Latitude: -90 to 90
```

## 🎨 Component Props

### MapView
```jsx
geospatialData: object
selectedYear: number
onFeatureClick: function
selectedFeature: object
loading: boolean
```

### Sidebar
```jsx
geospatialData: object
selectedFeature: object
onFeatureSelect: function
```

### ChartPanel
```jsx
trendData: array
statistics: object
selectedYear: number
```

### UploadModal
```jsx
onClose: function
onUploadSuccess: function
```

## 🔍 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Map displays with markers
- [ ] Sidebar shows 8 locations
- [ ] Statistics cards show data
- [ ] Chart renders properly
- [ ] Click marker opens popup
- [ ] Click sidebar card zooms map
- [ ] Year selector changes data
- [ ] Upload modal opens
- [ ] Sample file uploads successfully
- [ ] Search filters locations
- [ ] Mobile view is responsive

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Setup Guide | `GETTING_STARTED.md` |
| Features | `FEATURES.md` |
| Project Info | `PROJECT_SUMMARY.md` |
| API Docs | `README.md` |
| Sample Data | `data/sample_data.geojson` |

## 🎯 Performance Tips

- Limit features to <1000 for optimal performance
- Use GeoJSON instead of Shapefile when possible
- Compress large files before uploading
- Close unused browser tabs
- Clear cache if experiencing issues
- Use Chrome DevTools for debugging

## 🌍 Deployment Checklist

- [ ] Set environment variables
- [ ] Update API endpoints for production
- [ ] Build frontend: `npm run build`
- [ ] Configure CORS for production domain
- [ ] Set up SSL/HTTPS
- [ ] Configure database (if needed)
- [ ] Set up backup system
- [ ] Configure monitoring
- [ ] Test on production environment
- [ ] Document deployment process

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Contact**: Your Organization Name

