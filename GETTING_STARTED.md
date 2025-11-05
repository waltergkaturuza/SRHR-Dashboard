# Getting Started with SRHR Geospatial Dashboard

## Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+** (Download from [python.org](https://www.python.org/downloads/))
- **Node.js 16+** (Download from [nodejs.org](https://nodejs.org/))
- **Git** (Optional, for version control)

### Installation

#### Option 1: Automated Setup (Windows)

1. Open Command Prompt or PowerShell
2. Navigate to the project directory:
   ```bash
   cd "C:\Users\Administrator\Documents\SRHR Dashboard"
   ```

3. Run the setup script:
   ```bash
   setup.bat
   ```

This will:
- Create a Python virtual environment
- Install all Python dependencies
- Install all Node.js dependencies

#### Option 2: Manual Setup

**Backend Setup:**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
# Install Node.js dependencies
npm install
```

### Running the Application

#### Option 1: Run Both Servers at Once

Double-click `run-all.bat` or run:
```bash
run-all.bat
```

This will open two terminal windows:
- Backend server on http://localhost:5000
- Frontend server on http://localhost:5173

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
run-backend.bat
```

**Terminal 2 - Frontend:**
```bash
run-frontend.bat
```

### Accessing the Dashboard

Once both servers are running:
1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. The dashboard should load with sample data from Harare

## Features Overview

### 1. Interactive Map
- **Dark-themed map** showing Harare district locations
- **Color-coded markers** for different types of health decision-making platforms
- **Circle size** represents the number of youth participants
- **Click markers** to see detailed information
- **Popup details** include youth count, total members, and location info

### 2. Sidebar - District Locations
- **List view** of all health decision-making platforms
- **Search functionality** to filter by name or type
- **Click on items** to zoom to location on the map
- **Visual indicators** showing youth participation percentage

### 3. Data Upload
- Click **"Upload Data"** button in the header
- Supports **GeoJSON** and **Shapefile** formats
- **Drag and drop** or browse to select files
- Upload your own district health data

### 4. Analytics Dashboard
- **Statistics cards** showing:
  - Total youth participants (aged 24 and below)
  - Number of decision-making platforms
  - Average youth per platform
  - Youth representation percentage
- **Trend chart** displaying historical data from 2018-2024
- **Growth insights** showing youth participation increase over time

### 5. Year Selector
- Filter data by year (2018-2024)
- Click the menu icon to change years
- View historical trends

## Data Format

When uploading your own data, use the following GeoJSON format:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "name": "Platform Name",
        "type": "Platform Type",
        "youth_count": 25,
        "total_members": 100,
        "year": 2024,
        "address": "Location Address"
      }
    }
  ]
}
```

### Required Properties:
- `name`: Name of the health decision-making platform
- `type`: Type of platform (e.g., "District Office", "Youth Committee")
- `youth_count`: Number of participants aged 24 and below
- `total_members`: Total number of committee members
- `year`: Year of the data
- `address`: Physical address (optional)

### Coordinates:
- Format: `[longitude, latitude]`
- For Harare, Zimbabwe: approximately `[31.0492, -17.8252]`

## Sample Data Included

The dashboard comes with pre-loaded sample data including:

1. **Harare Central District Health Office**
2. **Mbare Health Decision Committee**
3. **Borrowdale Health Forum**
4. **Glen View Youth Health Committee**
5. **Avondale Clinic Committee**
6. **Highfield Community Health Platform**
7. **Hatfield Youth SRHR Forum**
8. **Dzivarasekwa Health Advisory Board**

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check
- `GET /api/geospatial-data?year=2024` - Get all location data
- `GET /api/trends` - Get historical trend data
- `GET /api/statistics?year=2024` - Get summary statistics
- `POST /api/upload` - Upload new geospatial data
- `POST /api/reset` - Reset to default data

## Customization

### Colors
Edit `src/components/MapView.jsx` to change marker colors:
```javascript
const getColorForType = (type) => {
  const colors = {
    'District Office': '#ff4444',
    'Youth Committee': '#00d4ff',
    // Add your custom types and colors
  };
  return colors[type] || '#00d4ff';
};
```

### Adding More Data
1. Click "Upload Data" in the header
2. Select your GeoJSON or Shapefile
3. Upload to replace the current data
4. Or use the "Reset to Default" button to restore sample data

## Troubleshooting

### Port Already in Use
If you see "Port 5000 is already in use":
- Close any other applications using port 5000
- Or edit `app.py` to change the port number

### Module Not Found Errors
Run the setup script again:
```bash
setup.bat
```

### Map Not Loading
- Check your internet connection (required for map tiles)
- Clear browser cache and reload

### Data Upload Fails
- Ensure your file is valid GeoJSON or Shapefile
- Check that all required properties are present
- File size should be under 10MB

## Project Structure

```
SRHR Dashboard/
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── vite.config.js        # Vite configuration
├── index.html            # Entry HTML file
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main application component
│   ├── App.css           # Main styles
│   ├── index.css         # Global styles
│   └── components/       # React components
│       ├── Header.jsx
│       ├── MapView.jsx
│       ├── Sidebar.jsx
│       ├── ChartPanel.jsx
│       └── UploadModal.jsx
├── data/                 # Data storage
│   └── sample_data.geojson
├── uploads/              # Uploaded files (auto-created)
└── setup.bat             # Setup script

```

## Need Help?

- Check the console (F12 in browser) for error messages
- Review the terminal output for backend errors
- Ensure both servers are running
- Verify your data format matches the expected structure

## Next Steps

1. **Upload Your Data**: Replace sample data with actual district health data
2. **Customize Colors**: Match your organization's branding
3. **Add More Metrics**: Extend the analytics to track additional KPIs
4. **Deploy**: Deploy to a web server for team access

Enjoy using the SRHR Geospatial Dashboard! 🗺️📊

