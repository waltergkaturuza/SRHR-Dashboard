# SRHR Geospatial Dashboard - Project Summary

## Overview

A comprehensive **Sexual and Reproductive Health Rights (SRHR) Geospatial Dashboard** designed for visualizing and analyzing health decision-making spaces in Harare, Zimbabwe. The dashboard provides interactive storytelling capabilities through maps, charts, and data visualizations.

## Key Features

### ✅ Interactive Map Visualization
- Dark-themed, professional map interface using Leaflet
- Displays district health decision-making platforms across Harare
- Color-coded markers by platform type
- Dynamic circle sizes representing youth participation levels
- Interactive popups with detailed information
- Real-time location filtering and search

### ✅ Data Upload & Management
- Upload vector geospatial data (GeoJSON, Shapefiles)
- Drag-and-drop file interface
- Data validation and error handling
- Reset to default sample data
- RESTful API for data management

### ✅ Youth Participation Analytics
- Track young people aged 24 and below in decision-making platforms
- Visual statistics cards showing key metrics
- Trend analysis from 2018-2024
- Percentage calculations and growth indicators
- Interactive line charts using Recharts

### ✅ District Health Platforms Tracking
- Comprehensive list of health decision-making spaces
- Real-time search and filtering
- Platform categorization:
  - District Offices
  - Community Health Committees
  - Health Forums
  - Youth Committees
  - Clinic Committees
  - Community Platforms
  - SRHR Forums
  - Advisory Boards

### ✅ Modern UI/UX Design
- Dark theme matching reference design
- Responsive layout for desktop and mobile
- Smooth animations and transitions
- Professional color scheme with cyan (#00d4ff) accents
- Accessible and intuitive interface

## Technology Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **Leaflet** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet
- **Recharts** - Data visualization charts
- **Lucide React** - Modern icon library
- **Axios** - HTTP client

### Backend
- **Flask** - Python web framework
- **GeoPandas** - Geospatial data processing
- **Pandas** - Data manipulation
- **Shapely** - Geometric operations
- **Fiona** - File I/O for geographic data
- **Flask-CORS** - Cross-origin resource sharing

## Project Structure

```
SRHR Dashboard/
├── Backend (Python/Flask)
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── uploads/              # Uploaded files directory
│   └── data/                 # Data storage
│
├── Frontend (React/Vite)
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── components/       # React components
│   │   │   ├── Header.jsx    # Top navigation bar
│   │   │   ├── MapView.jsx   # Interactive map
│   │   │   ├── Sidebar.jsx   # Location list
│   │   │   ├── ChartPanel.jsx # Analytics dashboard
│   │   │   └── UploadModal.jsx # Data upload form
│   │   └── index.css         # Global styles
│   ├── index.html            # Entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
│
└── Setup & Documentation
    ├── README.md             # Project overview
    ├── GETTING_STARTED.md    # Detailed setup guide
    ├── setup.bat             # Automated setup
    ├── run-all.bat          # Run both servers
    ├── run-backend.bat      # Run Flask server
    └── run-frontend.bat     # Run Vite dev server
```

## Sample Data Included

The dashboard includes **8 sample locations** in Harare:

1. Harare Central District Health Office (45 youth)
2. Mbare Health Decision Committee (32 youth)
3. Borrowdale Health Forum (28 youth)
4. Glen View Youth Health Committee (67 youth)
5. Avondale Clinic Committee (19 youth)
6. Highfield Community Health Platform (54 youth)
7. Hatfield Youth SRHR Forum (41 youth)
8. Dzivarasekwa Health Advisory Board (38 youth)

**Total: 324 youth participants** across 8 platforms in 2024

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/geospatial-data?year=2024` | Get location data |
| GET | `/api/trends` | Get historical trends |
| GET | `/api/statistics?year=2024` | Get summary stats |
| POST | `/api/upload` | Upload geospatial data |
| POST | `/api/reset` | Reset to defaults |

## Installation & Setup

### Quick Start (Windows)
```bash
# 1. Run setup
setup.bat

# 2. Start both servers
run-all.bat

# 3. Open browser to http://localhost:5173
```

### Manual Setup
```bash
# Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (new terminal)
npm install
npm run dev
```

## Data Format

### GeoJSON Structure
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
      "name": "Platform Name",
      "type": "Committee Type",
      "youth_count": 25,
      "total_members": 100,
      "year": 2024,
      "address": "Address"
    }
  }]
}
```

## Key Metrics Tracked

1. **Total Youth Participants** - Young people aged ≤24 years
2. **Total Committee Members** - All members across platforms
3. **Youth Representation %** - Percentage of youth in total membership
4. **Number of Platforms** - Count of active decision-making spaces
5. **Average Youth per Platform** - Distribution metric
6. **Historical Trends** - Year-over-year growth (2018-2024)

## Design Highlights

- **Color Palette**:
  - Primary: #00d4ff (Cyan)
  - Background: #1a1a1a (Dark)
  - Secondary: #0a0a0a (Darker)
  - Text: #ffffff (White)
  - Muted: #999999 (Gray)

- **Map Markers**: Color-coded by platform type with size indicating youth count
- **Charts**: Professional line charts with gradient effects
- **Cards**: Elevated card design with hover effects
- **Animations**: Smooth transitions and loading states

## Use Cases

1. **Policy Makers** - Understand youth representation in health governance
2. **NGOs** - Track SRHR program effectiveness
3. **Health Officials** - Monitor district-level participation
4. **Researchers** - Analyze geographic and temporal patterns
5. **Youth Organizations** - Advocate for increased participation
6. **Donors** - Evaluate program impact and coverage

## Future Enhancements

- [ ] Heatmap visualization for density analysis
- [ ] Export reports to PDF/Excel
- [ ] User authentication and roles
- [ ] Multi-city support
- [ ] Real-time data sync
- [ ] Mobile app version
- [ ] Advanced filtering (age ranges, gender, etc.)
- [ ] Comparison between districts/years
- [ ] Integration with external health databases

## Technical Highlights

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Performance Optimized** - Fast load times with Vite
- **Scalable Architecture** - Clean separation of concerns
- **RESTful API** - Standard HTTP methods
- **Error Handling** - Comprehensive validation
- **Cross-Browser Compatible** - Works in all modern browsers
- **Accessibility** - Semantic HTML and keyboard navigation

## Development Workflow

```bash
# Start development
npm run dev          # Frontend dev server
python app.py        # Backend dev server

# Build for production
npm run build        # Creates optimized build
npm run preview      # Preview production build
```

## Deployment Options

- **Local Server** - Run on organization's internal network
- **Cloud Hosting** - Deploy to AWS, Azure, or Google Cloud
- **Static Hosting** - Frontend on Netlify/Vercel, backend on Heroku
- **Docker** - Containerize for easy deployment

## License

MIT License - Free for educational and commercial use

## Support

For issues, questions, or contributions:
- Check `GETTING_STARTED.md` for detailed instructions
- Review browser console for frontend errors
- Check terminal output for backend errors
- Verify data format matches specifications

---

**Built with ❤️ for improved SRHR advocacy and youth participation in health governance**

