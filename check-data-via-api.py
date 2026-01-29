"""
Check uploaded data via API endpoints
No psql required - uses your backend API
"""

import requests
import json

# Your API URLs
API_BASE = "https://srhr-dashboard.onrender.com"  # Production
# API_BASE = "http://localhost:5000"  # Uncomment for local testing

print("=" * 60)
print("  Checking Uploaded Data via API")
print("=" * 60)
print()

# Check if backend is running
print("1. Testing backend health...")
try:
    response = requests.get(f"{API_BASE}/api/health", timeout=10)
    health = response.json()
    print(f"   ✅ Backend Status: {health.get('status')}")
    print(f"   ✅ Database: {health.get('database')}")
except Exception as e:
    print(f"   ❌ Backend Error: {e}")
    print("   Make sure backend is running!")
    exit(1)

print()

# Check available years
print("2. Checking available years...")
try:
    response = requests.get(f"{API_BASE}/api/years", timeout=10)
    years_data = response.json()
    years = years_data.get('years', [])
    print(f"   ✅ Years with data: {years}")
    current_year = years_data.get('current_year', 2024)
    print(f"   ✅ Current year: {current_year}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()

# Check health platforms
print("3. Checking health platforms...")
for year in years:
    try:
        response = requests.get(f"{API_BASE}/api/geospatial-data?year={year}", timeout=10)
        data = response.json()
        count = len(data.get('features', []))
        print(f"   Year {year}: {count} health platforms")
        
        # Show first 3 with coordinates
        if count > 0:
            for i, feature in enumerate(data['features'][:3]):
                props = feature['properties']
                coords = feature['geometry']['coordinates']
                lon, lat = coords[0], coords[1]
                print(f"      • {props.get('name', 'Unknown')}")
                print(f"        Coords: [{lon:.4f}, {lat:.4f}]", end="")
                
                # Check if in Harare range
                if 31.0 <= lon <= 31.1 and -17.87 <= lat <= -17.78:
                    print(" ✅ Valid Harare coords")
                else:
                    print(" ⚠️  Outside Harare range!")
    except Exception as e:
        print(f"   ❌ Error for year {year}: {e}")

print()

# Check facilities (schools, clinics, etc.)
print("4. Checking other facilities...")
for year in years:
    try:
        response = requests.get(f"{API_BASE}/api/facilities?year={year}", timeout=10)
        
        if response.status_code == 200:
            facilities = response.json()
            
            if isinstance(facilities, list):
                print(f"   Year {year}: {len(facilities)} facilities")
                
                # Group by category
                by_category = {}
                for fac in facilities:
                    cat = fac.get('category', 'unknown')
                    by_category[cat] = by_category.get(cat, 0) + 1
                
                for cat, count in by_category.items():
                    print(f"      • {cat}: {count}")
                
                # Show first 3 with coordinates
                if facilities:
                    print(f"   Sample facilities:")
                    for fac in facilities[:3]:
                        name = fac.get('name', 'Unknown')
                        cat = fac.get('category', 'unknown')
                        lon = fac.get('longitude', fac.get('location', {}).get('coordinates', [0])[0])
                        lat = fac.get('latitude', fac.get('location', {}).get('coordinates', [0, 0])[1])
                        print(f"      • {name} ({cat})")
                        print(f"        Coords: [{lon:.4f}, {lat:.4f}]", end="")
                        
                        if 31.0 <= lon <= 31.1 and -17.87 <= lat <= -17.78:
                            print(" ✅ Valid")
                        else:
                            print(" ⚠️  Outside Harare!")
            else:
                print(f"   Year {year}: No facilities data")
        else:
            print(f"   Year {year}: API returned {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error for year {year}: {e}")

print()
print("=" * 60)
print("  Diagnostic Complete")
print("=" * 60)
print()
print("Next steps:")
print("1. If coordinates are outside Harare range: Your JSON has swapped coords")
print("2. If no facilities found: Backend needs facilities table")
print("3. If data looks good: Toggle layer ON and refresh browser")
print()

input("Press Enter to exit...")












