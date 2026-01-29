# Youth Representative Information Management Guide

This guide explains how to add and manage youth representative information for districts in the SRHR Dashboard system.

## Overview

Each district can now store:
- **Youth Representative Name** - Name of the young people representative for the district
- **Youth Representative Title** - Title/position (e.g., "YPNHW District Facilitator")
- **Health Platforms** - List of health platforms that exist for young people in the district

## Database Changes

### New Columns Added to `district_boundaries` table:
- `youth_rep_name` (VARCHAR 200) - Name of youth representative
- `youth_rep_title` (VARCHAR 200) - Title/position of representative  
- `health_platforms` (JSONB) - JSON array of health platform names

### Migration

To add these columns to an existing database, run:

```bash
psql -d your_database_name -f database/add_youth_rep_columns.sql
```

Or through the PostgreSQL client:
```sql
\i database/add_youth_rep_columns.sql
```

## API Endpoints

### 1. Get All Districts with Youth Info
```
GET /api/districts/youth-info
```

Returns all districts with their youth representative information.

**Response:**
```json
[
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
]
```

### 2. Get Youth Info for Specific District (by ID)
```
GET /api/districts/{district_id}/youth-info
```

**Authentication:** Required (Editor or Admin role)

### 3. Update Youth Info for Specific District (by ID)
```
PUT /api/districts/{district_id}/youth-info
Content-Type: application/json
Authorization: Bearer {token}

{
  "youth_rep_name": "Tinotenda Craig Marimo",
  "youth_rep_title": "YPNHW District Facilitator",
  "health_platforms": [
    "District Health Committee",
    "District Aids Committee",
    "District Health stakeholders taskforce",
    "Child Protection Committee"
  ]
}
```

**Authentication:** Required (Editor or Admin role)

### 4. Get Youth Info by District Name
```
GET /api/districts/name/{district_name}/youth-info
```

Example:
```
GET /api/districts/name/Glen%20View/youth-info
```

### 5. Update Youth Info by District Name
```
PUT /api/districts/name/{district_name}/youth-info
Content-Type: application/json
Authorization: Bearer {token}

{
  "youth_rep_name": "Nokutenda Mukorera",
  "youth_rep_title": "YPNHW District Facilitator",
  "health_platforms": [
    "District Health Committee",
    "District Aids Committee"
  ]
}
```

**Authentication:** Required (Editor or Admin role)

### 6. Updated Boundaries Endpoint
The existing `/api/boundaries` endpoint now includes youth representative information:

```
GET /api/boundaries
```

## Adding Youth Representative Data

### Method 1: Using SQL Script (Recommended for bulk updates)

1. Edit `database/seed_youth_reps.sql` to add your district data
2. Run the script:
   ```bash
   psql -d your_database_name -f database/seed_youth_reps.sql
   ```

### Method 2: Using Python Script

1. Ensure your backend is running
2. Edit `add-youth-rep-info.py` to update the `DISTRICT_YOUTH_DATA` dictionary
3. Run the script:
   ```bash
   python add-youth-rep-info.py
   ```
4. Enter your admin credentials when prompted

### Method 3: Using API Directly

**Using curl:**

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}' \
  | jq -r '.token')

# Update district
curl -X PUT http://localhost:5000/api/districts/name/Glen%20View/youth-info \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youth_rep_name": "Tinotenda Craig Marimo",
    "youth_rep_title": "YPNHW District Facilitator",
    "health_platforms": [
      "District Health Committee",
      "District Aids Committee",
      "District Health stakeholders taskforce",
      "Child Protection Committee"
    ]
  }'
```

**Using Postman:**
1. Login to get token: `POST /api/auth/login`
2. Copy the token from response
3. Add token to headers: `Authorization: Bearer {token}`
4. Send PUT request to `/api/districts/name/{district_name}/youth-info`

## Current District Youth Representatives

Based on the provided data:

| District | Youth People Rep | Title | Health Platforms |
|----------|-----------------|-------|------------------|
| Glen View | Tinotenda Craig Marimo | YPNHW District Facilitator | District Health Committee, District Aids Committee, District Health stakeholders taskforce, Child Protection Committee |
| Chitungwiza | Leroy Ndambi | YPNHW District Facilitator | District Health Committee, District Aids Committee, District stakeholders taskforce |
| Mbare | Nokutenda Mukorera | YPNHW District Facilitator | District Health Committee, District Aids Committee, District stakeholders taskforce |
| Dzivarasekwa | Munashe Kawanje | YPNHW District Facilitator | District Aids Committee, District stakeholders, District health taskforce |
| Mufakose | (Not assigned) | | District Health Committee, District Aids Committee, District Health stakeholders taskforce, Child Protection Committee |
| Budiriro | (Not assigned) | | District Health Committee, District Aids Committee, District Health stakeholders taskforce, Child Protection Committee |
| Glaudina | (Not assigned) | | District Aids Committee, District stakeholders, District health taskforce |
| Belvedere | (Not assigned) | | District Aids Committee, District stakeholders, District health taskforce |

## Frontend Integration

To display this information in your React frontend:

```javascript
// Fetch districts with youth info
const response = await fetch('http://localhost:5000/api/districts/youth-info');
const districts = await response.json();

// Display in component
districts.forEach(district => {
  console.log(`${district.name}:`);
  console.log(`  Rep: ${district.youth_rep_name || 'Not assigned'}`);
  console.log(`  Title: ${district.youth_rep_title || ''}`);
  console.log(`  Platforms: ${district.health_platforms.length}`);
  district.health_platforms.forEach(platform => {
    console.log(`    - ${platform}`);
  });
});
```

## Data Format

### Health Platforms
Health platforms should be stored as a JSON array of strings:

```json
{
  "health_platforms": [
    "District Health Committee",
    "District Aids Committee",
    "District Health stakeholders taskforce",
    "Child Protection Committee"
  ]
}
```

## Troubleshooting

### Columns don't exist error
If you get an error about missing columns, run the migration script:
```bash
psql -d your_database_name -f database/add_youth_rep_columns.sql
```

### District not found error
- Check that the district name is spelled correctly
- District names are case-insensitive
- Spaces in URLs should be encoded as `%20` or `+`

### Authentication errors
- Ensure you're logged in as an Editor or Admin
- Check that your token is valid and not expired
- Token format in header should be: `Authorization: Bearer {token}`

## Next Steps

1. **Add the migration columns** to your database (if not already done)
2. **Seed the data** using the SQL script or Python script
3. **Create a UI component** in your frontend to display and edit this information
4. **Add filters/search** by youth representative name or health platform type

## Support

For issues or questions, check the main README or project documentation.
