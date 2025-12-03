# Troubleshooting: Police Stations Not Appearing

## Issue
Police stations have been added to the database but are not appearing on the map.

## Possible Causes & Solutions

### 1. **Year Mismatch** (Most Common)
Police stations might have been uploaded with a different year than what's selected in the frontend.

**Check:**
- Open browser console (F12)
- Look for: "Fetching facilities from: ..." and "Facilities API response: ..."
- Check what year the police stations have vs. what year is selected

**Solution:**
- Change the year selector in the frontend to match the year of your police stations
- Or re-upload police stations with the correct year (2024)

### 2. **Layer Visibility**
The police layer might be turned off.

**Check:**
- Look at the "Map Layers" panel on the right side
- Make sure "Police" layer toggle is ON (blue)

**Solution:**
- Click the "Police" layer in the Map Layers panel to toggle it ON

### 3. **API Not Returning Data**
The backend API might not be returning police stations.

**Check:**
Open browser console (F12) and look for:
```
Fetching facilities from: https://srhr-dashboard.onrender.com/api/facilities?year=2024
Facilities API response: [...]
Police stations found: [...]
```

**Test API directly:**
```bash
curl "https://srhr-dashboard.onrender.com/api/facilities?year=2024" | python -m json.tool
```

Or check in browser:
```
https://srhr-dashboard.onrender.com/api/facilities?year=2024
```

### 4. **Database Year Issue**
Police stations might be in the database but with wrong year.

**Check via SQL:**
```sql
SELECT id, name, category, year, 
       ST_X(location) as lon, ST_Y(location) as lat 
FROM facilities 
WHERE category = 'police';
```

**Check all years with police stations:**
```sql
SELECT year, COUNT(*) 
FROM facilities 
WHERE category = 'police' 
GROUP BY year;
```

### 5. **Coordinates Issue**
Coordinates might be missing or invalid.

**Check in console:**
Look for warnings like:
```
Police station missing coordinates: [name] location: [object] lat: [value] lon: [value]
```

**Solution:**
- Verify coordinates are valid (Harare: lon ~31.0, lat ~-17.8)
- Re-upload with correct coordinates

## Debugging Steps Added

I've added console logging to help diagnose:

1. **Frontend (`MapView.jsx`):**
   - Logs API URL being called
   - Logs API response data
   - Logs facility counts by category
   - Logs police stations found
   - Warns if police stations are missing coordinates
   - Logs when rendering police stations

2. **Backend (`app_db.py`):**
   - Logs number of facilities found
   - Logs police station count
   - Logs details of each police station

## Quick Fix Checklist

- [ ] Check browser console (F12) for errors
- [ ] Verify year selector matches police station year
- [ ] Ensure "Police" layer is ON in Map Layers panel
- [ ] Test API endpoint directly in browser
- [ ] Check database for police stations: `SELECT * FROM facilities WHERE category = 'police';`
- [ ] Verify coordinates are valid
- [ ] Refresh browser after checking

## Test API Endpoint

Test the facilities API endpoint:
```bash
# Check all facilities for 2024
curl "https://srhr-dashboard.onrender.com/api/facilities?year=2024"

# Check only police stations
curl "https://srhr-dashboard.onrender.com/api/facilities?year=2024&category=police"
```

## Expected Behavior

When working correctly, you should see in browser console:
```
Fetching facilities from: https://srhr-dashboard.onrender.com/api/facilities?year=2024
Facilities API response: [{...}, {...}, ...]
Facility counts by category: {police: 2, ...}
Police stations found: [{name: "...", ...}, ...]
Rendering police station: [name] at [lat] [lon]
```

## Still Not Working?

1. Check backend logs for errors
2. Verify database connection
3. Ensure facilities table exists (run `/api/admin/init-tables` if needed)
4. Check CORS settings if testing locally

