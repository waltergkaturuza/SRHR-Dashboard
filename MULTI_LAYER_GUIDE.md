# 🗺️ Multi-Layer Map System Guide

## Comprehensive Community Infrastructure Mapping

Your SRHR Dashboard now supports **multiple facility types** with custom icons and layer toggle controls!

---

## 🎯 **New Facility Categories**

### **1. 🏥 Health Platforms** (Original)
- District Offices
- Youth Committees  
- Health Forums
- Community Health Committees
- Clinic Committees
- SRHR Forums
- Advisory Boards

### **2. 🎓 Schools**
- **Primary Schools** (Green icon)
- **Secondary Schools** (Blue icon)
- **Tertiary Institutions** (Purple icon)

### **3. ⛪ Churches**
- All denominations
- Places of worship
- (Orange icon)

### **4. 🚔 Police Stations**
- Main stations
- Branch offices
- Police posts
- (Dark Blue icon)

### **5. 🏪 Shops & Markets**
- Markets
- Shopping malls
- Shopping centers
- (Pink icon)

### **6. 🏢 Government Offices**
- Municipal offices
- Ministry buildings
- District administration
- (Gray icon)

---

## 🎨 **Custom Icons for Each Type**

Each facility type has a unique, professional icon:

| Category | Icon | Color | Description |
|----------|------|-------|-------------|
| Health | 🏥 | Red (#ff4444) | Medical cross |
| Primary School | 🎓 | Green (#4caf50) | Graduation cap |
| Secondary School | 🎓 | Blue (#2196f3) | Graduation cap |
| Tertiary | 🎓 | Purple (#9c27b0) | Graduation cap |
| Church | ⛪ | Orange (#ff9800) | Church building |
| Police | 🚔 | Dark Blue (#1976d2) | Shield |
| Shop | 🏪 | Pink (#e91e63) | Shopping bag |
| Office | 🏢 | Gray (#607d8b) | Building |

---

## 🎮 **Layer Toggle Control**

### **Location:**
Top-right corner of map (below map layer switcher)

### **Features:**
```
┌─────────────────────────┐
│  Map Layers        [−]  │
├─────────────────────────┤
│  [Show All] [Hide All]  │
├─────────────────────────┤
│ ⚫ Health Platforms  ☑  │
│ 🟢 Primary Schools   ☑  │
│ 🔵 Secondary Schools ☑  │
│ 🟣 Tertiary Inst.    ☑  │
│ 🟠 Churches          ☑  │
│ 🔵 Police Stations   ☑  │
│ 🔴 Shops & Markets   ☑  │
│ ⚪ Gov't Offices      ☑  │
└─────────────────────────┘
```

### **How to Use:**

1. **Toggle Individual Layers:**
   - Click on any layer to show/hide
   - Toggle switch shows on/off state
   - Markers appear/disappear instantly

2. **Show All:**
   - Click "Show All" button
   - All layers become visible

3. **Hide All:**
   - Click "Hide All" button
   - All layers hidden (clean map)

4. **Collapse Panel:**
   - Click "−" to minimize
   - Click "+" to expand

---

## 📊 **Database Structure**

### **New Table: `facilities`**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR | Facility name |
| category | VARCHAR | school/church/police/shop/office |
| sub_type | VARCHAR | primary/secondary/tertiary, etc. |
| year | INTEGER | Data year |
| address | TEXT | Physical address |
| location | GEOMETRY | PostGIS coordinates |
| additional_info | JSONB | Flexible extra data |

---

## 🗄️ **Sample Data Included**

The `seed_facilities.sql` includes:

**Schools:**
- 3 Primary schools
- 2 Secondary schools
- 2 Tertiary institutions

**Churches:**
- 3 Different denominations

**Police:**
- 1 Main station
- 1 Branch
- 1 Post

**Shops:**
- 1 Market
- 1 Mall
- 1 Shopping center

**Offices:**
- 3 Government buildings

**Total: 18 new facilities**

---

## 🚀 **Setup Instructions**

### **Step 1: Run Facility Schema**

```bash
# From your Render backend shell or local terminal with psql

# Create facilities table
psql "postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard" -f database/schema_facilities.sql

# Load sample data
psql "postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard" -f database/seed_facilities.sql
```

### **Step 2: Verify Data**

```bash
psql "postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard" -c "SELECT category, sub_type, COUNT(*) FROM facilities GROUP BY category, sub_type;"
```

Should show all facility types!

### **Step 3: Restart Backend**

1. Go to Render → Backend Service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait ~2 minutes

### **Step 4: Test**

Open dashboard and see:
- Layer control panel on map
- Toggle layers on/off
- Different icons for each type
- All facilities displayed!

---

## 🎯 **Admin Panel Integration**

### **Category Selector:**

In Admin Panel, new dropdown at top:

```
[🏥 Health Platforms ▼]
 ├─ 🏥 Health Platforms
 ├─ 🎓 Schools
 ├─ ⛪ Churches  
 ├─ 🚔 Police Stations
 ├─ 🏪 Shops & Markets
 └─ 🏢 Government Offices
```

Select category to view/edit that type of data!

---

## 📝 **Adding New Facilities**

### **Via Admin Panel:**

1. Select category (e.g., Schools)
2. Click "+ Add Platform"
3. Fill form:
   - Name: "Avondale Primary School"
   - Category: Automatically set
   - Sub-type: "primary"
   - Year: 2024
   - Coordinates: Lat/Long
4. Submit
5. Appears on map with school icon!

### **Via SQL:**

```sql
INSERT INTO facilities 
  (name, category, sub_type, year, address, location, additional_info)
VALUES 
  ('New School', 'school', 'primary', 2025, 'Harare',
   ST_SetSRID(ST_MakePoint(31.05, -17.83), 4326),
   '{"students": 300}'::jsonb);
```

---

## 🎨 **Visual Features**

### **Map Display:**
- Each category has unique icon
- Color-coded by type
- Custom SVG icons (professional)
- Click for details popup
- Toggle on/off independently

### **Layer Control:**
- Shows count for each layer
- Visual toggle switches
- Show All / Hide All buttons
- Collapsible panel
- Theme-aware styling

---

## 💡 **Use Cases**

### **Youth Health Access Analysis:**
```
1. Show: Health Platforms + Schools
2. Hide: Other layers
3. See proximity of health services to schools
4. Identify coverage gaps
```

### **Safety Mapping:**
```
1. Show: Police Stations + Schools
2. Analyze safety coverage
3. Plan new police posts
```

### **Community Planning:**
```
1. Show: All layers
2. Understand infrastructure distribution
3. Identify underserved areas
4. Plan new facilities
```

### **Religious Services:**
```
1. Show: Churches only
2. Map faith-based organizations
3. Plan outreach programs
```

---

## 🔧 **Technical Implementation**

### **Frontend:**
- Custom icon components with SVG
- Layer state management
- Real-time toggle
- Efficient rendering

### **Backend:**
- New `/api/facilities` endpoint
- Category filtering
- Year filtering
- JSONB for flexible data

### **Database:**
- `facilities` table with PostGIS
- Category and sub_type indexing
- Spatial queries support
- JSONB for extensibility

---

## 📋 **Icon Design**

All icons are:
- ✅ SVG-based (crisp at any size)
- ✅ Circular background
- ✅ Color-coded borders
- ✅ Shadow for depth
- ✅ White filled design
- ✅ Responsive sizes
- ✅ Theme-aware

---

## 🆕 **Features Summary**

| Feature | Description |
|---------|-------------|
| **8 Layer Types** | Health, 3 school types, church, police, shop, office |
| **Custom Icons** | Unique SVG icon for each category |
| **Toggle Control** | Show/hide any combination of layers |
| **Show/Hide All** | Quick buttons for all layers |
| **Layer Counts** | See number of facilities per category |
| **Color Coded** | Each category has distinct color |
| **Admin Support** | Manage all facility types |
| **Database Backed** | All data in PostgreSQL |

---

## 📊 **Data Management**

### **Admin Panel by Category:**

**Health Platforms Tab:**
- See all health decision-making platforms
- Standard table with youth counts

**Schools Tab:**
- See all schools (primary, secondary, tertiary)
- Add student/teacher counts
- Manage education infrastructure

**Churches Tab:**
- Map religious facilities
- Track denominations
- Capacity information

**Police Tab:**
- Security infrastructure
- Officer counts
- Coverage analysis

**Shops Tab:**
- Commercial facilities
- Vendor/store counts
- Economic mapping

**Offices Tab:**
- Government buildings
- Department information
- Administrative mapping

---

## 🎯 **Next Steps**

### **1. Initialize Facilities Database:**
```bash
# Run schema
psql [your-db-url] -f database/schema_facilities.sql

# Add sample data
psql [your-db-url] -f database/seed_facilities.sql
```

### **2. Restart Backend:**
- Render will auto-deploy with new code
- New `/api/facilities` endpoint active

### **3. Test Map:**
- Open dashboard
- See layer control panel
- Toggle layers on/off
- View different facility icons

### **4. Test Admin:**
- Go to Admin Panel
- Switch categories dropdown
- Manage different facility types

---

## 🎊 **Complete Feature Set**

Your dashboard now has:

✅ **Multi-Category Mapping**  
✅ **Custom Icon System**  
✅ **Layer Toggle Controls**  
✅ **8 Different Facility Types**  
✅ **Show/Hide Individual Layers**  
✅ **Admin Panel for All Types**  
✅ **Professional Icons**  
✅ **PostgreSQL Storage**  
✅ **Scalable Architecture**  

---

**Your SRHR Dashboard is now a comprehensive GIS platform for community infrastructure mapping!** 🗺️🎉

---

**Version**: 3.0.0 (Multi-Layer Edition)  
**Added**: November 2025  
**Status**: Complete ✅


