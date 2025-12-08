# 📤 Enhanced Upload System Guide

## Complete Upload Workflow with Metadata

Your upload modal now has **intelligent category detection** and **metadata fields**!

---

## ✨ **What's New in Upload Modal**

### **Before:**
- ❌ Only uploaded generic GeoJSON
- ❌ Didn't know what type of facilities
- ❌ Couldn't specify year or district
- ❌ Limited metadata support

### **After:**
- ✅ **Category selector** - Choose facility type
- ✅ **Year field** - Specify data year
- ✅ **District dropdown** - Assign to area
- ✅ **Auto-detection** - Or let system detect from GeoJSON
- ✅ **Context-aware** - Shows relevant fields
- ✅ **Smart validation** - Guides correct format

---

## 🎯 **Enhanced Upload Form**

### **Upload Settings Section:**

```
┌────────────────────────────────────┐
│  Upload Settings                   │
├────────────────────────────────────┤
│  Facility Category *               │
│  ┌──────────────────────────────┐  │
│  │ 🏥 Health Platform        ▼ │  │
│  └──────────────────────────────┘  │
│  What type of facilities?          │
│                                    │
│  Year *                            │
│  [2025]                            │
│  Which year is this data for?      │
│                                    │
│  District (Optional)               │
│  [Auto-detect from data      ▼]   │
│  If all in one district, select    │
└────────────────────────────────────┘
```

---

## 📋 **Upload Steps**

### **Step 1: Select Category**

Choose what you're uploading:
- 🏥 **Health Platform** - Health decision-making spaces
- 🎓 **School** - Educational institutions
- ⛪ **Church** - Religious facilities
- 🚔 **Police Station** - Security infrastructure
- 🏪 **Shop/Market** - Commercial facilities
- 🏢 **Government Office** - Administrative buildings

### **Step 2: Set Year**

Enter the year this data represents:
- Default: Current year (2025)
- Range: 2000-2100
- Each year tracked separately

### **Step 3: Select District (Optional)**

If all facilities are in one district:
- Select from dropdown (Mbare, Borrowdale, etc.)
- Or leave as "Auto-detect from data"
- System will use `district` property from GeoJSON if available

### **Step 4: Upload File**

- Drag & drop GeoJSON file
- Or click "browse" to select
- File validates automatically

### **Step 5: Upload**

- Click "Upload" button
- System processes with metadata
- Facilities appear with correct:
  - Icon (based on category)
  - Color (based on category/sub-type)
  - Layer (can be toggled)
  - District assignment

---

## 📄 **GeoJSON Format by Category**

### **For Health Platforms:**

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
      "name": "Mbare Youth Committee",
      "type": "Youth Committee",
      "youth_count": 45,
      "total_members": 120,
      "district": "Mbare",
      "address": "Mbare Township",
      "description": "Meets every Tuesday at 6pm. Focus on SRHR education."
    }
  }]
}
```

### **For Schools:**

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.0320, -17.8360]
    },
    "properties": {
      "name": "Mbare Primary School",
      "sub_type": "primary",
      "district": "Mbare",
      "address": "123 School Road",
      "description": "450 students, 18 teachers. Health education program available.",
      "additional_info": {
        "students": 450,
        "teachers": 18,
        "established": 1965
      }
    }
  }]
}
```

### **For Churches:**

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.0480, -17.8240]
    },
    "properties": {
      "name": "St Mary's Cathedral",
      "sub_type": "catholic",
      "district": "Harare Central",
      "address": "Cathedral Square",
      "description": "Capacity 800. Sunday services at 8am and 10am.",
      "additional_info": {
        "denomination": "Catholic",
        "capacity": 800
      }
    }
  }]
}
```

### **For Police Stations:**

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.0485, -17.8245]
    },
    "properties": {
      "name": "Harare Central Police Station",
      "sub_type": "main",
      "district": "Harare Central",
      "address": "Kenneth Kaunda Avenue",
      "description": "24/7 emergency response. 120 officers.",
      "additional_info": {
        "officers": 120,
        "emergency": "999"
      }
    }
  }]
}
```

---

## 🎨 **Context-Aware Help**

The modal **dynamically shows** required fields based on category:

### **When "Health Platform" selected:**
Shows:
```
Required GeoJSON properties:
• name - Facility name
• type - Committee type
• youth_count - Youth participants
• total_members - Total members
• description - Notes (optional)
• district - Area (optional)
```

### **When "School" selected:**
Shows:
```
Required GeoJSON properties:
• name - School name
• sub_type - primary/secondary/tertiary
• description - Details (optional)
• district - Area (optional)
```

---

## 🔧 **Backend Processing**

### **What Happens on Upload:**

1. **File received** with metadata
2. **Category applied** to all features
3. **District assigned** if specified
4. **Year set** for all features
5. **Correct table** updated (health_platforms or facilities)
6. **Trends recalculated**
7. **Icons assigned** based on category
8. **Layers updated** on map

---

## 💡 **Smart Features**

### **Auto-Detection:**

If GeoJSON includes properties:
- `category` - Uses that category
- `district` - Assigns to district
- `sub_type` - Sets specific type
- `description` - Stores notes

### **Override with Form:**

Form metadata **overrides** file properties:
- Category from form always used
- Year from form always used
- District from form (if selected) overrides file

### **Validation:**

System checks:
- ✅ Valid GeoJSON structure
- ✅ All features have coordinates
- ✅ Required properties present
- ✅ Year within valid range
- ✅ Category matches expected type

---

## 📊 **Example Upload Scenarios**

### **Scenario 1: Bulk School Upload**

**File**: `harare_schools_2024.geojson` (15 schools)

**Settings:**
- Category: 🎓 School
- Year: 2024
- District: Auto-detect

**Result:**
- 15 schools added
- Each gets school icon (green/blue/purple based on level)
- Appears in "Schools" layer
- Can toggle on/off
- Shows in district popups

### **Scenario 2: Single District Health Upload**

**File**: `mbare_health_2025.geojson` (3 new platforms)

**Settings:**
- Category: 🏥 Health Platform
- Year: 2025
- District: Mbare

**Result:**
- 3 platforms added to Mbare
- All assigned to Mbare district
- Shows in health layer
- District popup updated with count

### **Scenario 3: Mixed Facilities**

**Not recommended! Use separate uploads per category**

But if needed:
- Upload once with category="shop"
- Upload again with category="church"
- System handles each appropriately

---

## 🎯 **Best Practices**

### **File Organization:**

```
✅ Good:
- schools_2024.geojson (all schools)
- churches_2024.geojson (all churches)
- health_mbare_2024.geojson (Mbare health)

❌ Avoid:
- mixed_facilities.geojson (multiple categories)
- unlabeled.geojson (no metadata)
```

### **GeoJSON Properties:**

**Always include:**
```json
{
  "name": "Required",
  "description": "Highly recommended for context"
}
```

**For health platforms:**
```json
{
  "youth_count": 45,
  "total_members": 120,
  "type": "Youth Committee"
}
```

**For schools:**
```json
{
  "sub_type": "primary",
  "additional_info": {
    "students": 450,
    "teachers": 18
  }
}
```

---

## 🔄 **Upload Workflow**

```
User Actions:
1. Click "Upload Data" button
   ↓
2. Upload modal opens
   ↓
3. Select category (🏥/🎓/⛪/🚔/🏪/🏢)
   ↓
4. Set year (e.g., 2025)
   ↓
5. Choose district (optional)
   ↓
6. Drag GeoJSON file
   ↓
7. Click "Upload"
   ↓
Backend Processing:
8. Parse GeoJSON
   ↓
9. Apply metadata
   ↓
10. Insert into correct table
    ↓
11. Assign icons based on category
    ↓
12. Update layer counts
    ↓
Result:
13. Facilities appear on map
    ↓
14. Correct icons displayed
    ↓
15. Toggle-able in layer control
    ↓
16. Show in district popups
```

---

## ✅ **Validation & Error Handling**

### **System Checks:**

**File validation:**
- ✅ Valid JSON format
- ✅ GeoJSON FeatureCollection
- ✅ Features have geometry
- ✅ Coordinates are valid

**Metadata validation:**
- ✅ Category selected
- ✅ Year within range
- ✅ District valid (if selected)

**Data validation:**
- ✅ Required properties present
- ✅ Numbers are numeric
- ✅ For health: youth_count ≤ total_members

### **Error Messages:**

Clear, helpful messages:
```
❌ "Invalid GeoJSON format"
❌ "Missing required property: name"
❌ "Youth count cannot exceed total members"
❌ "Invalid coordinates for feature"
✅ "Successfully uploaded 15 features"
```

---

## 📖 **Complete Property Reference**

### **All Facility Types:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | ✅ | Facility name |
| `description` | string | ❌ | Additional notes |
| `district` | string | ❌ | District name |
| `address` | string | ❌ | Physical address |

### **Health Platforms Only:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | ✅ | Committee type |
| `youth_count` | number | ✅ | Youth participants (≤24) |
| `total_members` | number | ✅ | Total committee members |

### **Schools Only:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sub_type` | string | ✅ | primary/secondary/tertiary |
| `additional_info.students` | number | ❌ | Student count |
| `additional_info.teachers` | number | ❌ | Teacher count |

### **Other Facilities:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sub_type` | string | ❌ | Specific type |
| `additional_info` | object | ❌ | Any extra data (JSON) |

---

## 🎉 **Benefits**

✅ **Clear categorization** - Know what you're uploading  
✅ **Correct icons** - Automatic based on category  
✅ **Proper layers** - Goes to right toggle group  
✅ **District linking** - Connects to geographic areas  
✅ **Rich metadata** - Descriptions preserved  
✅ **Flexible data** - additional_info for anything  
✅ **User-friendly** - Guided workflow  
✅ **Error prevention** - Validation at every step  

---

## 🚀 **Quick Start**

### **Upload Schools:**

1. Prepare `schools.geojson` with school data
2. Click "Upload Data"
3. **Category**: Select "🎓 School"
4. **Year**: 2025
5. **District**: Auto-detect (or select if all same)
6. Upload file
7. Schools appear with graduation cap icons!

### **Upload Health Platforms:**

1. Prepare `health_2025.geojson`
2. Click "Upload Data"
3. **Category**: "🏥 Health Platform" (default)
4. **Year**: 2025
5. **District**: Select if applicable
6. Upload
7. Platforms appear with medical cross icons!

---

**Your upload system now handles all facility types with proper metadata!** 📤✨

---

**Version**: 4.1.0  
**Updated**: November 2025  
**Status**: Complete ✅








