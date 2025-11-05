# SRHR Geospatial Dashboard - Features Guide

## 🗺️ Interactive Map Features

### Map Visualization
The main map displays all health decision-making platforms across Harare with:

- **Base Map**: Dark-themed OpenStreetMap tiles optimized for data visualization
- **Interactive Markers**: Color-coded circular markers representing each platform
- **Size Scaling**: Circle size proportional to youth participation count
- **Location Focus**: Centered on Harare, Zimbabwe coordinates (-17.8252, 31.0492)
- **Zoom Controls**: Intuitive zoom in/out buttons
- **Pan Navigation**: Click and drag to explore different areas

### Marker Color Coding

| Color | Platform Type |
|-------|--------------|
| 🔴 Red (#ff4444) | District Office |
| 🔵 Cyan (#00d4ff) | Youth Committee |
| 🟢 Green (#4caf50) | Health Forum |
| 🟠 Orange (#ff9800) | Community Health Committee |
| 🟣 Purple (#9c27b0) | Clinic Committee |
| 🟡 Yellow (#ffeb3b) | Community Platform |
| 🩷 Pink (#e91e63) | SRHR Forum |
| 🔷 Blue (#3f51b5) | Advisory Board |

### Interactive Popups
Click any marker to see:
- **Platform Name**
- **Type/Category**
- **Youth Count** (aged ≤24)
- **Total Members**
- **Youth Percentage**
- **Physical Address**

### Map Legend
Bottom-left corner shows:
- Color-coded legend
- Platform type descriptions
- Size indicator explanation
- Real-time update timestamp

---

## 📋 Sidebar - Location Browser

### Search & Filter
- **Search Bar**: Type to filter by name or platform type
- **Real-time Results**: Instant filtering as you type
- **Case-insensitive**: Works with any letter case

### Location Cards
Each card displays:
- **Platform Name**: Bold, prominent title
- **Type Badge**: Color-coded category label
- **Statistics**:
  - 👥 Youth (≤24 years)
  - 📍 Total Members
  - 📈 Youth Percentage
- **Progress Bar**: Visual representation of youth participation rate

### Interaction
- **Click to Focus**: Click any card to zoom to that location on the map
- **Selection Highlight**: Selected location highlighted with cyan border
- **Scroll View**: Scroll through all locations
- **Count Display**: Total number of platforms shown in header

---

## 📊 Analytics Dashboard

### Statistics Cards

#### Card 1: Total Youth Participants
- **Icon**: 👥 Users
- **Value**: Total count of youth aged 24 and below
- **Color**: Cyan (#00d4ff)
- **Context**: "Aged 24 and below"

#### Card 2: Decision-Making Platforms
- **Icon**: 🏢 Building
- **Value**: Number of active committees/platforms
- **Color**: Orange (#ff9800)
- **Context**: "Active committees"

#### Card 3: Average Youth per Platform
- **Icon**: 📈 Trending Up
- **Value**: Mean youth participation across platforms
- **Color**: Green (#4caf50)
- **Context**: "Average participation"

#### Card 4: Youth Representation
- **Icon**: % Percent
- **Value**: Youth as percentage of total members
- **Color**: Pink (#e91e63)
- **Context**: "Of total members"

### Trend Chart

**Features:**
- **Time Period**: 2018-2024 historical data
- **Dual Lines**:
  - 🔵 Cyan Line: Youth Participants (≤24)
  - 🟠 Orange Line: Total Members
- **Interactive**: Hover to see exact values
- **Grid**: Subtle gridlines for easier reading
- **Legend**: Color-coded line labels

**Insights Box:**
- Automatic calculation of growth percentage
- Period comparison (start year to end year)
- Contextual interpretation of data trends

---

## ⬆️ Data Upload System

### Upload Modal

**Trigger**: Click "Upload Data" button in header

**Supported Formats:**
- GeoJSON (`.geojson`, `.json`)
- Shapefile (`.shp`, `.zip`)

### Upload Methods

#### Method 1: Drag & Drop
1. Open upload modal
2. Drag file into the upload area
3. Drop to select file
4. Click "Upload" button

#### Method 2: File Browser
1. Open upload modal
2. Click "browse" link
3. Select file from computer
4. Click "Upload" button

### Upload Process
- **Validation**: Automatic format checking
- **Progress**: Loading spinner during upload
- **Feedback**: Success or error messages
- **Auto-refresh**: Dashboard updates automatically

### Data Requirements

**GeoJSON Structure:**
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    },
    "properties": {
      "name": "Required - Platform name",
      "type": "Required - Platform type",
      "youth_count": "Required - Number (integer)",
      "total_members": "Required - Number (integer)",
      "year": "Required - Number (e.g., 2024)",
      "address": "Optional - String"
    }
  }]
}
```

### Reset Functionality
- **Button**: "Reset to Default"
- **Action**: Restores original sample data
- **Confirmation**: Requires user confirmation
- **Use Case**: Testing or removing uploaded data

---

## 🎯 Year Filter

### Year Selector
Located in top-right header:
- **Display**: Shows current selected year (2024)
- **Menu Button**: Hamburger icon to open dropdown
- **Range**: 2018-2024 available years
- **Active Highlight**: Selected year shown in cyan

### Functionality
- Click to view data for specific year
- Updates map markers
- Refreshes statistics
- Changes chart highlighting
- Filters location list

---

## 🎨 Design & Styling

### Color Theme
- **Primary**: Cyan (#00d4ff) - Interactive elements
- **Background**: Dark (#1a1a1a) - Main background
- **Cards**: Darker (#0a0a0a) - Elevated surfaces
- **Borders**: Gray (#333) - Subtle separation
- **Text**: White (#fff) - High contrast

### Animations
- **Hover Effects**: Subtle elevation on cards
- **Transitions**: Smooth 0.2s animations
- **Loading States**: Spinner for async operations
- **Map Animations**: Smooth zoom and pan

### Responsive Design

**Desktop (>1024px):**
- Sidebar on left (350px)
- Map fills remaining width
- Chart panel at bottom
- All features visible

**Tablet (768px-1024px):**
- Sidebar narrower (300px)
- Adjusted spacing
- Scrollable sections

**Mobile (<768px):**
- Vertical layout
- Sidebar at top (40vh max)
- Full-width map
- Stacked statistics cards

---

## 🔍 Advanced Features

### Real-time Updates
- "Last update: 8 seconds ago" indicator
- Simulates live data refresh
- Can be connected to real-time API

### Progressive Disclosure
- Detailed popups only on click
- Hover effects for preview
- Expandable information

### Accessibility
- Keyboard navigation support
- Semantic HTML structure
- ARIA labels (can be enhanced)
- High contrast text
- Focus indicators

### Performance
- Lazy loading for large datasets
- Optimized map rendering
- Efficient React rendering
- Minimal bundle size

---

## 💡 Use Case Scenarios

### Scenario 1: Policy Review
**Goal**: Assess youth representation across districts
1. View statistics cards for overview
2. Check youth percentage metric
3. Review trend chart for historical context
4. Click locations to see specific platforms
5. Identify areas needing improvement

### Scenario 2: Data Update
**Goal**: Upload new quarterly data
1. Click "Upload Data" button
2. Drag GeoJSON file into upload area
3. Upload and verify feature count
4. Review updated map and statistics
5. Share dashboard with stakeholders

### Scenario 3: Storytelling
**Goal**: Present to donors about youth engagement
1. Select year (e.g., 2020)
2. Show statistics from that year
3. Advance through years showing growth
4. Highlight specific high-performing locations
5. Use trend chart to show progress

### Scenario 4: Geographic Analysis
**Goal**: Identify coverage gaps
1. Use map to view spatial distribution
2. Search for specific districts
3. Note areas without markers
4. Click platforms to see details
5. Plan expansion to underserved areas

### Scenario 5: Comparative Analysis
**Goal**: Compare youth participation rates
1. Sort locations in sidebar by youth percentage
2. Click top and bottom performers
3. View their details on map
4. Analyze what makes them different
5. Share best practices

---

## 🚀 Tips & Tricks

### Keyboard Shortcuts
- **Tab**: Navigate between interactive elements
- **Enter**: Activate buttons and links
- **Escape**: Close modals
- **Arrow Keys**: Scroll lists

### Quick Actions
- **Double-click Map**: Zoom in
- **Scroll Wheel**: Zoom in/out
- **Click + Drag**: Pan map
- **Click Card**: Jump to location

### Data Management
- Keep backups of your GeoJSON files
- Use consistent property names
- Validate data before uploading
- Test with small datasets first

### Best Practices
- Update data regularly
- Document data sources
- Maintain consistent year labeling
- Use descriptive platform names
- Include accurate coordinates

---

## 📱 Browser Compatibility

**Fully Supported:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Opera 76+

**Mobile Browsers:**
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Samsung Internet

---

## 🛠️ Troubleshooting

### Map Not Loading
- Check internet connection (required for tiles)
- Verify coordinates are valid
- Clear browser cache

### Upload Failing
- Ensure file format is correct
- Check all required properties exist
- Verify coordinates are [longitude, latitude]
- Keep file size under 10MB

### Performance Issues
- Reduce number of features if >1000
- Close other browser tabs
- Update to latest browser version

---

**Dashboard Version**: 1.0.0  
**Last Updated**: November 2025  
**Platform**: Web (React + Flask)

