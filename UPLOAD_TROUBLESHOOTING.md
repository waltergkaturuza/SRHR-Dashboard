# 🔍 Upload Troubleshooting Guide

## Why Uploaded Data Isn't Showing on Map

---

## 🎯 **Common Issues & Solutions**

### **Issue 1: Coordinate Order**

**Problem**: GeoJSON uses `[longitude, latitude]` but some systems use `[latitude, longitude]`

**Check your JSON:**
```json
"coordinates": [31.0492, -17.8252]  ✅ Correct (lon, lat)
"coordinates": [-17.8252, 31.0492]  ❌ Wrong (lat, lon)
```

**For Harare, Zimbabwe:**
- **Longitude**: 31.0 to 31.1 (positive number, ~31)
- **Latitude**: -17.78 to -17.87 (negative number, ~-17.8)

**If your coordinates are swapped:**
Your clinics might be plotted in the wrong country!

---

### **Issue 2: Data Saved But Not Fetched**

**Problem**: Upload succeeded but API doesn't return the data

**Solutions:**

1. **Check if facilities table exists:**
```bash
# Run this script:
check-uploaded-data.bat
```

2. **Verify backend is using app_db.py:**
   - Render → Backend → Settings
   - Start Command should be: `gunicorn app_db:app`

3. **Check API endpoint:**
```bash
curl https://srhr-dashboard.onrender.com/api/facilities?year=2024
```

---

### **Issue 3: Wrong Category**

**Problem**: Uploaded as "health" but should be "clinic"

**Solution:** Re-upload with correct category:
1. Upload Modal → Category: "🏥 Health Clinic"
2. Upload file again

---

### **Issue 4: Year Mismatch**

**Problem**: Uploaded for 2025 but viewing 2024

**Solution:** Change year selector to match upload year

---

## 🔧 **Diagnostic Steps**

### **Step 1: Run check-uploaded-data.bat**

This script will show:
- Last 10 platforms in health_platforms table
- Last 10 facilities in facilities table
- All data with valid Harare coordinates

### **Step 2: Check Coordinates**

Valid Harare coordinates should be:
```
Longitude (X): 31.0 to 31.1
Latitude (Y): -17.78 to -17.87
```

If you see coordinates like:
```
lon: -17.8252, lat: 31.0492  ← SWAPPED!
```

You need to fix your GeoJSON file.

---

## 📝 **Correct GeoJSON Format**

### **For Clinics:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [31.0492, -17.8252]
                        ↑         ↑
                      LONG      LAT
                     (31.x)   (-17.x)
      },
      "properties": {
        "name": "Mbare Clinic",
        "sub_type": "Primary Clinic",
        "address": "Mbare Township",
        "description": "Operating hours: 8am-5pm"
      }
    }
  ]
}
```

---

## 🔄 **How to Fix Swapped Coordinates**

If your coordinates are swapped in the file:

### **Option 1: Fix the JSON File**

Edit your JSON and swap the coordinates:
```json
// Before (wrong)
"coordinates": [-17.8252, 31.0492]

// After (correct)
"coordinates": [31.0492, -17.8252]
```

### **Option 2: Fix in Database (if already uploaded)**

```sql
-- If coordinates are swapped, flip them
UPDATE facilities 
SET location = ST_SetSRID(ST_MakePoint(ST_Y(location), ST_X(location)), 4326)
WHERE ST_X(location) < 0;  -- This finds swapped coords (negative longitude)
```

---

## 🧪 **Test Your Upload**

### **Before Uploading:**

1. **Open your JSON file**
2. **Check first feature coordinates:**
   ```
   First number (longitude): Should be ~31
   Second number (latitude): Should be ~-17.8
   ```
3. **If swapped**: Fix before uploading

### **After Uploading:**

1. **Run check-uploaded-data.bat**
2. **Look for your clinic names**
3. **Check coordinates are in Harare range**
4. **Refresh dashboard**
5. **Select correct year**

---

## 📊 **Quick Database Check**

Run these commands to see what was uploaded:

```bash
# Count facilities by category
psql [db-url] -c "SELECT category, COUNT(*) FROM facilities GROUP BY category;"

# See recent uploads
psql [db-url] -c "SELECT name, category, ST_X(location), ST_Y(location) FROM facilities ORDER BY id DESC LIMIT 5;"

# Check if coordinates are valid
psql [db-url] -c "SELECT name, CASE WHEN ST_X(location) BETWEEN 31.0 AND 31.1 THEN 'OK' ELSE 'WRONG' END as lon_check, CASE WHEN ST_Y(location) BETWEEN -17.87 AND -17.78 THEN 'OK' ELSE 'WRONG' END as lat_check FROM facilities;"
```

---

## ✅ **Checklist**

Before saying "upload failed", verify:

- [ ] Upload modal showed "Successfully uploaded X features"
- [ ] Run check-uploaded-data.bat to see data in DB
- [ ] Coordinates are in correct order [lon, lat]
- [ ] Longitude is ~31, Latitude is ~-17.8
- [ ] Year matches what you're viewing
- [ ] Category is correct (clinic, not health)
- [ ] Backend API `/api/facilities` returns data
- [ ] Layer toggle for that category is ON
- [ ] Browser cache cleared (Ctrl+Shift+R)

---

## 🚀 **Quick Fix Steps**

1. **Run**: `check-uploaded-data.bat`
2. **Check**: Are coordinates swapped?
3. **If YES**: Fix JSON and re-upload
4. **If NO**: Check year and category
5. **Verify**: API returns your data
6. **Toggle**: Enable clinic layer on map
7. **Refresh**: Hard refresh browser

---

**Run `check-uploaded-data.bat` first to see what's in the database!** 🔍












