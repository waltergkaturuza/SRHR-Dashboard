# Youth Representative Feature - Implementation Summary

## Overview

A complete feature for managing youth representative information for districts has been added to the SRHR Dashboard. This feature allows you to store and manage information about young people representatives and health platforms for each district.

## What's Been Added

### 1. Database Changes

#### New Columns in `district_boundaries` table:
- `youth_rep_name` (VARCHAR 200) - Name of the youth representative
- `youth_rep_title` (VARCHAR 200) - Title/position of the representative
- `health_platforms` (JSONB) - JSON array of health platform names

#### Files Created:
- `database/add_youth_rep_columns.sql` - Migration script to add columns to existing databases
- `database/seed_youth_reps.sql` - Sample data based on your provided table

### 2. Backend API Changes

#### Updated Model:
- `database/models.py` - Added `DistrictBoundary` model with youth representative fields

#### New API Endpoints:

1. **GET /api/districts/youth-info**
   - Get all districts with youth representative information
   - No authentication required

2. **GET /api/districts/{id}/youth-info**
   - Get youth info for specific district by ID
   - Requires Editor/Admin authentication

3. **PUT /api/districts/{id}/youth-info**
   - Update youth info for specific district by ID
   - Requires Editor/Admin authentication

4. **GET /api/districts/name/{district_name}/youth-info**
   - Get youth info for specific district by name
   - No authentication required for GET

5. **PUT /api/districts/name/{district_name}/youth-info**
   - Update youth info for specific district by name
   - Requires Editor/Admin authentication

#### Updated Endpoint:
- **GET /api/boundaries** - Now includes youth representative information

### 3. Python Scripts

#### `add-youth-rep-info.py`
- Interactive script to add youth representative data through the API
- Contains pre-populated data from your table
- Usage: `python add-youth-rep-info.py`

#### `add-youth-rep-info.bat`
- Windows batch file to easily run the Python script
- Usage: Double-click the file or run in command prompt

### 4. Frontend Components

#### `src/components/YouthRepManagement.jsx`
- React component for viewing and editing youth representative information
- Features:
  - Display all districts in a table
  - View youth representative names and titles
  - View health platforms (with hover tooltip)
  - Edit district information inline
  - Add/remove health platforms dynamically

#### `src/components/YouthRepManagement.css`
- Comprehensive styling for the management component
- Responsive design for mobile and tablet
- Clean, professional UI

### 5. Documentation

#### `YOUTH_REPRESENTATIVE_GUIDE.md`
- Complete guide for using the feature
- API documentation with examples
- Integration examples for frontend
- Troubleshooting section

#### `YOUTH_REP_FEATURE_SUMMARY.md` (this file)
- Overview of all changes
- Quick start guide
- Integration steps

## Quick Start

### Step 1: Update Database

Run the migration to add the new columns:

```bash
# Option 1: Using psql
psql -d your_database_name -f database/add_youth_rep_columns.sql

# Option 2: Using Windows PostgreSQL command line
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U your_username -d your_database_name -f database\add_youth_rep_columns.sql
```

### Step 2: Seed the Data

**Option A: Using SQL Script**
```bash
psql -d your_database_name -f database/seed_youth_reps.sql
```

**Option B: Using Python Script**
```bash
# Make sure backend is running first
python add-youth-rep-info.py
# Or on Windows, double-click: add-youth-rep-info.bat
```

### Step 3: Test the API

```bash
# Get all districts with youth info
curl http://localhost:5000/api/districts/youth-info

# Get specific district
curl http://localhost:5000/api/districts/name/Glen%20View/youth-info
```

### Step 4: Integrate into Frontend

Add the component to your admin dashboard or navigation:

```jsx
// In your App.jsx or AdminDashboard.jsx
import YouthRepManagement from './components/YouthRepManagement';

// Add to your routes or admin panel
<Route path="/admin/youth-reps" element={<YouthRepManagement />} />
```

## Data Structure Example

```json
{
  "id": 1,
  "name": "Glen View",
  "code": "GV",
  "population": 50000,
  "area_km2": 15.5,
  "youth_rep_name": "Tinotenda Craig Marimo",
  "youth_rep_title": "YPNHW District Facilitator",
  "health_platforms": [
    "District Health Committee",
    "District Aids Committee",
    "District Health stakeholders taskforce",
    "Child Protection Committee"
  ],
  "center": [31.0212, -17.8452]
}
```

## Pre-loaded Data

The system comes with data for these districts:

| District | Representative | Title | Platforms |
|----------|---------------|-------|-----------|
| Glen View | Tinotenda Craig Marimo | YPNHW District Facilitator | 4 platforms |
| Chitungwiza | Leroy Ndambi | YPNHW District Facilitator | 3 platforms |
| Mbare | Nokutenda Mukorera | YPNHW District Facilitator | 3 platforms |
| Dzivarasekwa | Munashe Kawanje | YPNHW District Facilitator | 3 platforms |
| Mufakose | (Not assigned) | - | 4 platforms |
| Budiriro | (Not assigned) | - | 4 platforms |
| Glaudina | (Not assigned) | - | 3 platforms |
| Belvedere | (Not assigned) | - | 3 platforms |

## Using the API

### Example: Update District Youth Info

```javascript
// Login first
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'your_password'
  })
});
const { token } = await loginResponse.json();

// Update district
const updateResponse = await fetch(
  'http://localhost:5000/api/districts/name/Glen View/youth-info',
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      youth_rep_name: 'Tinotenda Craig Marimo',
      youth_rep_title: 'YPNHW District Facilitator',
      health_platforms: [
        'District Health Committee',
        'District Aids Committee',
        'District Health stakeholders taskforce',
        'Child Protection Committee'
      ]
    })
  }
);
```

### Example: Display Youth Info in Map Popup

```javascript
// Fetch district data
const response = await fetch('http://localhost:5000/api/boundaries');
const districts = await response.json();

// Create map popup
districts.forEach(district => {
  const popupContent = `
    <div class="district-popup">
      <h3>${district.name}</h3>
      ${district.youth_rep_name ? `
        <div class="youth-rep">
          <strong>Youth Representative:</strong><br>
          ${district.youth_rep_name}<br>
          <em>${district.youth_rep_title}</em>
        </div>
      ` : ''}
      ${district.health_platforms && district.health_platforms.length > 0 ? `
        <div class="platforms">
          <strong>Health Platforms:</strong>
          <ul>
            ${district.health_platforms.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add to your map layer
});
```

## Adding More Districts

### Option 1: Through UI
1. Navigate to Youth Rep Management page
2. Click "Edit" on any district
3. Fill in the form fields
4. Add health platforms one by one
5. Click "Save Changes"

### Option 2: Through API
```bash
curl -X PUT http://localhost:5000/api/districts/name/Avondale/youth-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youth_rep_name": "John Doe",
    "youth_rep_title": "Community Facilitator",
    "health_platforms": ["District Health Committee", "Youth Forum"]
  }'
```

### Option 3: Through SQL
```sql
UPDATE district_boundaries
SET 
    youth_rep_name = 'John Doe',
    youth_rep_title = 'Community Facilitator',
    health_platforms = '["District Health Committee", "Youth Forum"]'::jsonb
WHERE LOWER(name) = 'avondale';
```

## Troubleshooting

### "Column does not exist" Error
**Solution:** Run the migration script:
```bash
psql -d your_database_name -f database/add_youth_rep_columns.sql
```

### "District not found" Error
**Solution:** Check district name spelling. Names are case-insensitive but must match exactly.

### Authentication Errors
**Solution:** 
1. Ensure you're logged in as Editor or Admin
2. Check token is valid and not expired
3. Token should be in format: `Bearer <token>`

### Frontend Component Not Showing Data
**Solution:**
1. Check API_BASE_URL is correct
2. Ensure backend is running
3. Check browser console for errors
4. Verify CORS settings in backend

## Files Modified/Created

### Created:
- `database/add_youth_rep_columns.sql`
- `database/seed_youth_reps.sql`
- `add-youth-rep-info.py`
- `add-youth-rep-info.bat`
- `src/components/YouthRepManagement.jsx`
- `src/components/YouthRepManagement.css`
- `YOUTH_REPRESENTATIVE_GUIDE.md`
- `YOUTH_REP_FEATURE_SUMMARY.md`

### Modified:
- `database/models.py` - Added DistrictBoundary model
- `database/schema_enhanced.sql` - Updated district_boundaries table definition
- `app_db.py` - Added new API endpoints and updated existing ones

## Next Steps

1. ✅ **Database Migration** - Run the migration script
2. ✅ **Seed Data** - Add the initial youth representative data
3. ✅ **Test API** - Verify endpoints are working
4. 🔲 **Add to Navigation** - Add link to YouthRepManagement component
5. 🔲 **Customize UI** - Adjust colors/styling to match your theme
6. 🔲 **Add Permissions** - Restrict access based on user roles
7. 🔲 **Add Search/Filter** - Enhance the table with search functionality
8. 🔲 **Export Feature** - Add ability to export data to CSV/Excel

## Support

For questions or issues:
1. Check `YOUTH_REPRESENTATIVE_GUIDE.md` for detailed documentation
2. Review the API responses for error messages
3. Check backend logs for debugging information

## Feature Highlights

✨ **Easy to Use** - Simple UI for managing district information
✨ **Flexible** - Add as many health platforms as needed
✨ **Secure** - Requires authentication for updates
✨ **RESTful API** - Clean API design following best practices
✨ **Responsive** - Works on desktop, tablet, and mobile
✨ **Well Documented** - Complete guides and examples provided

---

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Production
