#!/usr/bin/env python3
"""
Diagnostic script to check police stations in the database
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/srhr_dashboard')

# Fix for Render.com (uses postgres:// instead of postgresql://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

def check_police_stations():
    """Check police stations in the database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=" * 60)
        print("POLICE STATIONS DIAGNOSTIC")
        print("=" * 60)
        print()
        
        # Check if facilities table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'facilities'
            );
        """)
        table_exists = cur.fetchone()['exists']
        
        if not table_exists:
            print("❌ ERROR: 'facilities' table does not exist!")
            print("   Run: curl -X POST https://srhr-dashboard.onrender.com/api/admin/init-tables")
            return
        
        print("✅ 'facilities' table exists")
        print()
        
        # Get all police stations
        cur.execute("""
            SELECT 
                id,
                name,
                category,
                sub_type,
                year,
                address,
                ST_X(location) as longitude,
                ST_Y(location) as latitude,
                created_at
            FROM facilities
            WHERE category = 'police'
            ORDER BY year DESC, id DESC;
        """)
        
        police_stations = cur.fetchall()
        
        print(f"Found {len(police_stations)} police station(s) in database:")
        print()
        
        if len(police_stations) == 0:
            print("⚠️  No police stations found!")
            print()
            print("Checking all facilities by category:")
            cur.execute("""
                SELECT category, COUNT(*) as count, 
                       MIN(year) as min_year, MAX(year) as max_year
                FROM facilities
                GROUP BY category
                ORDER BY category;
            """)
            categories = cur.fetchall()
            for cat in categories:
                print(f"  - {cat['category']}: {cat['count']} facilities (years: {cat['min_year']}-{cat['max_year']})")
        else:
            for station in police_stations:
                print(f"  ID: {station['id']}")
                print(f"  Name: {station['name']}")
                print(f"  Year: {station['year']}")
                print(f"  Location: {station['latitude']}, {station['longitude']}")
                if station['address']:
                    print(f"  Address: {station['address']}")
                print(f"  Created: {station['created_at']}")
                print()
        
        # Check by year
        print("Police stations by year:")
        cur.execute("""
            SELECT year, COUNT(*) as count
            FROM facilities
            WHERE category = 'police'
            GROUP BY year
            ORDER BY year DESC;
        """)
        by_year = cur.fetchall()
        for row in by_year:
            print(f"  Year {row['year']}: {row['count']} station(s)")
        
        print()
        print("=" * 60)
        print("TESTING API ENDPOINT")
        print("=" * 60)
        print()
        print("To test the API endpoint, run:")
        print("  curl 'https://srhr-dashboard.onrender.com/api/facilities?year=2024'")
        print()
        print("Or check specific year:")
        if len(police_stations) > 0:
            years = set(s['year'] for s in police_stations)
            for year in sorted(years, reverse=True):
                print(f"  curl 'https://srhr-dashboard.onrender.com/api/facilities?year={year}'")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_police_stations()

