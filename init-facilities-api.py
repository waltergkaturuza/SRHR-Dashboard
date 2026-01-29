"""
Initialize facilities table via direct database connection
Run this locally - it will connect to your production database
"""

import psycopg2
import psycopg2.extras

# Database connection
DB_URL = "postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard"

print("=" * 70)
print("  Initializing Facilities Table")
print("=" * 70)
print()

try:
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    print("✅ Connected!")
    print()
    
    # Check if facilities table exists
    print("Checking if facilities table exists...")
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'facilities'
        );
    """)
    table_exists = cur.fetchone()[0]
    
    if table_exists:
        print("✅ Facilities table already exists!")
        
        # Count facilities
        cur.execute("SELECT category, COUNT(*) FROM facilities GROUP BY category;")
        results = cur.fetchall()
        print(f"\nFacilities by category:")
        for cat, count in results:
            print(f"   • {cat}: {count}")
            
    else:
        print("⚠️  Facilities table does NOT exist!")
        print("Creating facilities table...")
        
        # Read and execute schema
        with open('database/schema_facilities.sql', 'r') as f:
            schema_sql = f.read()
            cur.execute(schema_sql)
            conn.commit()
        
        print("✅ Facilities table created!")
        
        # Load sample data
        print("\nLoading sample facility data...")
        with open('database/seed_facilities.sql', 'r') as f:
            seed_sql = f.read()
            cur.execute(seed_sql)
            conn.commit()
        
        print("✅ Sample data loaded!")
    
    print()
    
    # Check health platforms
    print("Checking health platforms...")
    cur.execute("SELECT year, COUNT(*) FROM health_platforms GROUP BY year ORDER BY year;")
    results = cur.fetchall()
    print(f"Health platforms by year:")
    for year, count in results:
        print(f"   • {year}: {count} platforms")
    
    print()
    
    # Check recent uploads (last 5)
    print("Recent health platforms:")
    cur.execute("""
        SELECT name, type, year, ST_X(location) as lon, ST_Y(location) as lat 
        FROM health_platforms 
        ORDER BY id DESC LIMIT 5;
    """)
    results = cur.fetchall()
    for name, ptype, year, lon, lat in results:
        print(f"   • {name} ({ptype}, {year})")
        print(f"     Coords: [{lon:.4f}, {lat:.4f}]")
    
    cur.close()
    conn.close()
    
    print()
    print("=" * 70)
    print("  ✅ Diagnostic Complete!")
    print("=" * 70)
    print()
    print("If facilities table was created, your clinics upload should work now!")
    print("Re-upload your clinics JSON with category='clinic' and they will appear.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print()
    print("Make sure:")
    print("1. You have psycopg2 installed: pip install psycopg2-binary")
    print("2. Database URL is correct")
    print("3. Network connection is working")

print()
input("Press Enter to exit...")












