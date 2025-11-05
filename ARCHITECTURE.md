# SRHR Geospatial Dashboard - Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:5173                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Header.jsx    │  │   Sidebar.jsx   │  │   MapView.jsx   │ │
│  │  - Title        │  │  - Search       │  │  - Leaflet Map  │ │
│  │  - Upload Btn   │  │  - Locations    │  │  - Markers      │ │
│  │  - Year Filter  │  │  - Stats Cards  │  │  - Popups       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐ │
│  │ ChartPanel.jsx  │  │      UploadModal.jsx                 │ │
│  │  - Statistics   │  │  - Drag & Drop                       │ │
│  │  - Trend Chart  │  │  - File Validation                   │ │
│  │  - Insights     │  │  - Upload Progress                   │ │
│  └─────────────────┘  └──────────────────────────────────────┘ │
│                                                                   │
│         ┌──────────────────────────────────────┐                │
│         │          App.jsx (Main)               │                │
│         │    - State Management                 │                │
│         │    - Data Fetching (Axios)            │                │
│         │    - Component Orchestration          │                │
│         └──────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTP Requests (Axios)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask API)                           │
│                   http://localhost:5000                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      app.py                               │  │
│  │                                                            │  │
│  │  GET  /api/health              → Health Check             │  │
│  │  GET  /api/geospatial-data     → Get Locations           │  │
│  │  GET  /api/trends              → Get Historical Data     │  │
│  │  GET  /api/statistics          → Get Summary Stats       │  │
│  │  POST /api/upload              → Upload Geospatial File  │  │
│  │  POST /api/reset               → Reset to Defaults       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────┐  ┌──────────────────┐                   │
│  │   GeoPandas       │  │   Pandas         │                   │
│  │  - Read Shapefile │  │  - Data Proc     │                   │
│  │  - Parse GeoJSON  │  │  - Calculations  │                   │
│  │  - Transform      │  │  - Aggregations  │                   │
│  └───────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FILE SYSTEM                                 │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    uploads/     │  │     data/       │  │   venv/         │ │
│  │  - User files   │  │  - Districts    │  │  - Python deps  │ │
│  │  - Temp storage │  │  - Sample data  │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    node_modules/                             ││
│  │  - React, Leaflet, Recharts, Axios, etc.                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Flow

```
User Action Flow:
═══════════════════

1. USER LOADS PAGE
   └→ Browser requests localhost:5173
      └→ Vite serves index.html
         └→ React loads App.jsx
            └→ App fetches initial data from API
               └→ Flask returns GeoJSON + statistics
                  └→ React renders components

2. USER CLICKS MAP MARKER
   └→ MapView.jsx handles click event
      └→ Opens Leaflet popup
         └→ Displays location details
            └→ Updates selectedFeature state
               └→ Sidebar highlights matching card
                  └→ Map zooms to location

3. USER UPLOADS FILE
   └→ Click "Upload Data" button
      └→ UploadModal.jsx opens
         └→ User drags GeoJSON file
            └→ Modal validates format
               └→ POST /api/upload with FormData
                  └→ Flask processes with GeoPandas
                     └→ Saves to data/districts.geojson
                        └→ Returns success message
                           └→ App refetches all data
                              └→ UI updates with new data

4. USER CHANGES YEAR
   └→ Click year dropdown
      └→ Header.jsx updates selectedYear
         └→ Triggers useEffect in App.jsx
            └→ Fetches data for new year
               └→ Map + Charts update
```

---

## Data Flow

```
GeoJSON Data Structure:
═══════════════════════

Frontend Request                Backend Processing
──────────────────             ─────────────────────

GET /api/geospatial-data
        │
        ├─→ Flask receives request
        │       │
        │       ├─→ Check for custom data
        │       │   in data/districts.geojson
        │       │
        │       ├─→ If exists: load from file
        │       │   If not: use HARARE_DISTRICTS
        │       │
        │       └─→ Return GeoJSON object
        │
        └─→ Axios receives response
                │
                ├─→ setGeospatialData(response.data)
                │
                └─→ React re-renders:
                    ├─→ MapView: plots markers
                    ├─→ Sidebar: lists locations
                    └─→ ChartPanel: calculates stats


Upload Flow:
═══════════

File Selected
    │
    └─→ FormData created
        │
        └─→ POST /api/upload
            │
            ├─→ Flask receives file
            │   │
            │   ├─→ Save to uploads/
            │   │
            │   ├─→ Validate format
            │   │   ├─→ .geojson/.json
            │   │   │   └─→ Parse with json.load()
            │   │   │
            │   │   └─→ .shp/.zip
            │   │       └─→ Extract & read with GeoPandas
            │   │           └─→ Convert to GeoJSON
            │   │
            │   ├─→ Validate structure
            │   │   └─→ Must be FeatureCollection
            │   │
            │   ├─→ Save to data/districts.geojson
            │   │
            │   └─→ Return success + feature count
            │
            └─→ Frontend receives response
                │
                └─→ Calls fetchAllData()
                    └─→ Dashboard updates
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                       │
├─────────────────────────────────────────────────────────┤
│ React 18.2.0          │ UI framework                    │
│ Vite 5.0.8            │ Build tool & dev server         │
│ Leaflet 1.9.4         │ Interactive maps                │
│ React-Leaflet 4.2.1   │ React bindings for Leaflet      │
│ Recharts 2.10.3       │ Chart library                   │
│ Axios 1.6.2           │ HTTP client                     │
│ Lucide React 0.294.0  │ Icon library                    │
│ CSS3                  │ Styling (no framework)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                        │
├─────────────────────────────────────────────────────────┤
│ Flask 3.0.0           │ Web framework                   │
│ Flask-CORS 4.0.0      │ Cross-origin support            │
│ GeoPandas 0.14.1      │ Geospatial data processing      │
│ Pandas 2.1.3          │ Data manipulation               │
│ Shapely 2.0.2         │ Geometric operations            │
│ Fiona 1.9.5           │ File I/O for geodata            │
│ Python 3.8+           │ Programming language            │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
SRHR Dashboard/
│
├── Backend Entry Point
│   └── app.py (250+ lines)
│       ├── API routes
│       ├── Sample data
│       ├── File upload handling
│       ├── GeoPandas processing
│       └── CORS configuration
│
├── Frontend Entry Point
│   ├── index.html
│   └── src/
│       ├── main.jsx (App bootstrapping)
│       └── App.jsx (Main component, 80 lines)
│           ├── State management
│           ├── Data fetching
│           └── Component composition
│
├── React Components
│   └── src/components/
│       ├── Header.jsx (50 lines)
│       │   ├── Title & logo
│       │   ├── Upload button
│       │   └── Year selector dropdown
│       │
│       ├── MapView.jsx (180 lines)
│       │   ├── Leaflet map container
│       │   ├── Circle markers (sized by youth count)
│       │   ├── Color coding by type
│       │   ├── Popups with details
│       │   └── Map legend
│       │
│       ├── Sidebar.jsx (120 lines)
│       │   ├── Search input
│       │   ├── Location cards list
│       │   ├── Progress bars
│       │   └── Click-to-focus
│       │
│       ├── ChartPanel.jsx (150 lines)
│       │   ├── Statistics cards (4)
│       │   ├── Recharts line chart
│       │   ├── Custom tooltip
│       │   └── Insights panel
│       │
│       └── UploadModal.jsx (180 lines)
│           ├── Drag & drop zone
│           ├── File browser
│           ├── Format validation
│           ├── Upload progress
│           └── Reset button
│
├── Styling
│   ├── src/index.css (Global styles)
│   ├── src/App.css (Layout)
│   └── src/components/*.css (Component styles)
│       └── Dark theme (#1a1a1a background)
│       └── Cyan accents (#00d4ff)
│
├── Configuration
│   ├── package.json (Node dependencies)
│   ├── requirements.txt (Python dependencies)
│   ├── vite.config.js (Dev server config)
│   └── .gitignore (Ignore patterns)
│
├── Data Storage
│   ├── data/
│   │   ├── sample_data.geojson (Example)
│   │   └── districts.geojson (User uploads)
│   └── uploads/ (Temporary storage)
│
├── Scripts
│   ├── setup.bat (Installation)
│   ├── run-all.bat (Start both servers)
│   ├── run-backend.bat (Flask only)
│   └── run-frontend.bat (Vite only)
│
└── Documentation
    ├── START_HERE.md (Quick start)
    ├── INSTALLATION.md (Setup guide)
    ├── GETTING_STARTED.md (Usage)
    ├── FEATURES.md (Feature docs)
    ├── QUICK_REFERENCE.md (Cheat sheet)
    ├── PROJECT_SUMMARY.md (Overview)
    ├── ARCHITECTURE.md (This file)
    └── README.md (Main docs)
```

---

## State Management

```javascript
// App.jsx State
const [geospatialData, setGeospatialData] = useState(null);
const [trendData, setTrendData] = useState([]);
const [statistics, setStatistics] = useState(null);
const [selectedYear, setSelectedYear] = useState(2024);
const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
const [loading, setLoading] = useState(true);
const [selectedFeature, setSelectedFeature] = useState(null);

// State Flow:
// 1. User action → setState
// 2. React re-renders affected components
// 3. useEffect watches dependencies
// 4. Triggers data fetch if needed
// 5. Updates state with new data
// 6. UI reflects changes
```

---

## API Communication

```javascript
// Axios Configuration (in App.jsx)
axios.get('/api/geospatial-data?year=2024')
  .then(response => {
    setGeospatialData(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Vite Proxy (vite.config.js)
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}

// Request Flow:
// http://localhost:5173/api/geospatial-data
//      ↓ (proxied by Vite)
// http://localhost:5000/api/geospatial-data
//      ↓ (handled by Flask)
// return jsonify(HARARE_DISTRICTS)
```

---

## Security Considerations

### Current Implementation
- ✅ CORS enabled for localhost
- ✅ File type validation
- ✅ File size limits (implicit)
- ✅ GeoJSON structure validation
- ✅ Secure file naming

### Production Recommendations
- [ ] Add authentication (JWT)
- [ ] Rate limiting on API
- [ ] Input sanitization
- [ ] HTTPS/SSL
- [ ] Environment variables for secrets
- [ ] Database instead of file storage
- [ ] User permissions/roles
- [ ] Audit logging

---

## Performance Optimizations

### Current
- ✅ Vite for fast builds
- ✅ React hooks for efficient rendering
- ✅ CSS instead of heavy UI framework
- ✅ Lazy loading of components
- ✅ Optimized chart rendering

### Future Enhancements
- [ ] Code splitting
- [ ] Virtual scrolling for large lists
- [ ] Memoization of expensive calculations
- [ ] CDN for static assets
- [ ] Compression (gzip)
- [ ] Caching strategies
- [ ] Database indexing

---

## Deployment Architecture

```
Production Deployment Options:
═════════════════════════════

Option 1: Single Server
┌────────────────────────────┐
│   Nginx Reverse Proxy      │
│   (port 80/443)            │
├────────────────────────────┤
│ ├─→ Static Files (React)   │
│ └─→ /api → Flask Backend   │
└────────────────────────────┘

Option 2: Separate Hosting
┌──────────────────┐  ┌──────────────────┐
│  Netlify/Vercel  │  │   Heroku/AWS     │
│  (React Build)   │→│  (Flask API)     │
└──────────────────┘  └──────────────────┘

Option 3: Docker Containers
┌────────────────────────────────────┐
│         Docker Compose              │
│ ┌────────────┐  ┌────────────────┐ │
│ │  React     │  │  Flask         │ │
│ │  (Nginx)   │←→│  (Gunicorn)    │ │
│ │  Port 80   │  │  Port 5000     │ │
│ └────────────┘  └────────────────┘ │
└────────────────────────────────────┘
```

---

## Development Workflow

```
Developer Setup:
═══════════════

1. Clone/Download Project
   └→ cd "SRHR Dashboard"

2. Run Setup
   └→ setup.bat
      ├→ Creates venv/
      ├→ Installs Python packages
      └→ Installs Node packages

3. Start Development
   └→ run-all.bat
      ├→ Terminal 1: Flask (port 5000)
      └→ Terminal 2: Vite (port 5173)

4. Make Changes
   ├→ Edit .jsx files → Hot reload
   ├→ Edit .css files → Hot reload
   └→ Edit .py files → Manual restart

5. Test
   └→ Open browser → localhost:5173
      └→ F12 for DevTools

6. Build for Production
   └→ npm run build
      └→ Creates dist/ folder
         └→ Deploy to server
```

---

## Key Design Decisions

### Why React?
- Component reusability
- Large ecosystem
- Fast rendering with Virtual DOM
- Easy state management

### Why Flask?
- Lightweight and simple
- Python for geospatial processing
- GeoPandas integration
- Quick prototyping

### Why Leaflet?
- Open source
- Lightweight
- Extensive documentation
- No API keys required

### Why Vite?
- Fast hot reload
- Modern build tool
- Simple configuration
- Better than Webpack for this scale

### Why File Storage?
- Simple for prototype
- No database setup needed
- Easy to understand
- Can migrate to DB later

---

## Extensibility

### Easy to Add:
- ✅ New API endpoints
- ✅ Additional chart types
- ✅ More data filters
- ✅ Custom markers
- ✅ Export functionality
- ✅ Print layouts

### Requires More Work:
- Authentication system
- Real-time updates (WebSockets)
- Multi-tenancy
- Advanced analytics
- Mobile app
- Offline support

---

**Architecture Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintainability**: High  
**Scalability**: Medium (can be improved)  
**Complexity**: Low to Medium

