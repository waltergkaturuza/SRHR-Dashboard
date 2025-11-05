# SRHR Geospatial Dashboard

An interactive geospatial dashboard for visualizing Sexual and Reproductive Health Rights (SRHR) data in Harare, Zimbabwe.

## Features

- **Interactive Map**: Display district health decision-making spaces in Harare
- **Data Upload**: Upload vector geospatial data (GeoJSON, Shapefile)
- **Youth Participation Metrics**: Track young people (aged 24 and below) in health decision-making platforms
- **Storytelling**: Interactive visualizations for data-driven storytelling
- **Trend Analysis**: Visualize data trends over time

## Tech Stack

### Frontend
- React + Vite
- Leaflet (Interactive Maps)
- Recharts (Data Visualization)
- Modern UI with dark theme

### Backend
- Flask (Python)
- GeoPandas (Geospatial data processing)
- Pandas (Data manipulation)

## Installation

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Usage

1. **Upload Geospatial Data**: Use the upload form to add district office locations and health decision-making spaces
2. **Explore the Map**: Click on markers to see detailed information about each location
3. **View Analytics**: Check the charts for youth participation trends
4. **Filter by Year**: Use the year selector to view historical data

## Data Format

Upload GeoJSON files with the following structure:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [31.0492, -17.8252]
      },
      "properties": {
        "name": "District Office Name",
        "type": "Health Center",
        "youth_count": 25,
        "year": 2024
      }
    }
  ]
}
```

## License

MIT
