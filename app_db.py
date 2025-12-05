from flask import Flask, request, jsonify
from flask_cors import CORS
from database.models import db, HealthPlatform, TrendData
from geoalchemy2.functions import ST_GeomFromText, ST_AsGeoJSON
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
import geopandas as gpd
import json
import tempfile
import shutil
from datetime import datetime

# Helper function to get current year
def get_current_year():
    return datetime.now().year
from datetime import datetime

# Helper function to get current year
def get_current_year():
    return datetime.now().year

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/srhr_dashboard')

# Fix for Render.com (uses postgres:// instead of postgresql://)
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_UPLOAD_SIZE', 16 * 1024 * 1024))  # 16MB default

# Upload configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
ALLOWED_EXTENSIONS = {'geojson', 'json', 'shp', 'zip'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database
db.init_app(app)

# CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    }
})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        "status": "ok",
        "message": "SRHR Dashboard API is running",
        "database": db_status
    })


@app.route('/api/years', methods=['GET'])
def get_available_years():
    """Get all available years from database (health_platforms and facilities)"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        # Get years from health_platforms
        health_years = HealthPlatform.get_available_years()
        
        # Get years from facilities table if it exists
        facilities_years = []
        if 'facilities' in inspector.get_table_names():
            try:
                result = db.session.execute(db.text("SELECT DISTINCT year FROM facilities ORDER BY year"))
                facilities_years = [row[0] for row in result]
            except Exception as e:
                print(f"Error fetching facilities years: {e}")
        
        # Combine and deduplicate years
        all_years = list(set(health_years + facilities_years))
        all_years.sort(reverse=True)  # Sort descending (newest first)
        
        # Default to current year (2025) if no years found
        from datetime import datetime
        current_year = datetime.now().year if not all_years else max(all_years)
        
        return jsonify({
            "years": all_years,
            "current_year": current_year
        })
    except Exception as e:
        # Fallback to current year on error
        from datetime import datetime
        current_year = datetime.now().year
        return jsonify({
            "years": [current_year],
            "current_year": current_year,
            "error": str(e)
        }), 500


@app.route('/api/geospatial-data', methods=['GET'])
def get_geospatial_data():
    """Get geospatial data for a specific year"""
    year = request.args.get('year', type=int)
    
    if not year:
        # Get most recent year
        years = HealthPlatform.get_available_years()
        year = max(years) if years else get_current_year()
    
    try:
        platforms = HealthPlatform.query.filter_by(year=year).all()
        
        features = [platform.to_geojson_feature() for platform in platforms]
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        return jsonify(geojson)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/trends', methods=['GET'])
def get_trends():
    """Get trend data for all years"""
    try:
        trends = TrendData.get_all_trends()
        return jsonify(trends)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get summary statistics for a specific year"""
    year = request.args.get('year', type=int)
    
    if not year:
        years = HealthPlatform.get_available_years()
        year = max(years) if years else get_current_year()
    
    try:
        stats = HealthPlatform.get_statistics_by_year(year)
        
        if not stats:
            return jsonify({
                "year": year,
                "total_youth": 0,
                "total_members": 0,
                "total_committees": 0,
                "youth_percentage": 0,
                "average_youth_per_committee": 0
            })
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload geospatial data file"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    year = request.form.get('year', type=int)
    category = request.form.get('category', 'health')
    district = request.form.get('district', None)
    
    if not year:
        years = HealthPlatform.get_available_years()
        year = max(years) + 1 if years else get_current_year()
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Please upload GeoJSON, JSON, or Shapefile"}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Process the file
        if filename.endswith('.geojson') or filename.endswith('.json'):
            with open(filepath, 'r') as f:
                geojson_data = json.load(f)
            
            if 'type' not in geojson_data or geojson_data['type'] != 'FeatureCollection':
                return jsonify({"error": "Invalid GeoJSON format. Must be a FeatureCollection"}), 400
            
            # Import data into database
            feature_count = import_geojson_to_db(geojson_data, year, category, district)
            
        elif filename.endswith('.shp') or filename.endswith('.zip'):
            if filename.endswith('.zip'):
                extract_folder = os.path.join(UPLOAD_FOLDER, 'temp_extract')
                os.makedirs(extract_folder, exist_ok=True)
                shutil.unpack_archive(filepath, extract_folder)
                
                shp_files = [f for f in os.listdir(extract_folder) if f.endswith('.shp')]
                if not shp_files:
                    return jsonify({"error": "No shapefile found in zip"}), 400
                
                shp_path = os.path.join(extract_folder, shp_files[0])
            else:
                shp_path = filepath
            
            gdf = gpd.read_file(shp_path)
            geojson_data = json.loads(gdf.to_json())
            
            feature_count = import_geojson_to_db(geojson_data, year, category, district)
            
            if filename.endswith('.zip'):
                shutil.rmtree(extract_folder)
        
        # Update trend data
        TrendData.update_trends()
        
        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "features": feature_count,
            "year": year
        })
        
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


def import_geojson_to_db(geojson_data, year, category='health', district=None):
    """Import GeoJSON data into database"""
    feature_count = 0
    
    for feature in geojson_data.get('features', []):
        props = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        
        if geometry.get('type') != 'Point':
            continue
        
        coords = geometry.get('coordinates', [])
        if len(coords) < 2:
            continue
        
        # Create WKT point
        lon, lat = coords[0], coords[1]
        wkt_point = f'POINT({lon} {lat})'
        
        # Determine which table to use
        if category == 'health':
            # Health platforms table
            platform = HealthPlatform(
                name=props.get('name', 'Unknown'),
                type=props.get('type', 'Other'),
                youth_count=props.get('youth_count', 0),
                total_members=props.get('total_members', 1),
                year=props.get('year', year),
                address=props.get('address'),
                description=props.get('description'),
                district=props.get('district', district),
                location=ST_GeomFromText(wkt_point, 4326)
            )
            db.session.add(platform)
        else:
            # Facilities table for schools, churches, police, shops, offices
            from sqlalchemy import text, inspect
            
            # Check if facilities table exists
            inspector = inspect(db.engine)
            if 'facilities' in inspector.get_table_names():
                # Insert into facilities table
                insert_query = text("""
                    INSERT INTO facilities 
                    (name, category, sub_type, year, address, description, district, location)
                    VALUES 
                    (:name, :category, :sub_type, :year, :address, :description, :district, 
                     ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
                """)
                
                db.session.execute(insert_query, {
                    'name': props.get('name', 'Unknown'),
                    'category': category,
                    'sub_type': props.get('sub_type') or props.get('type', ''),
                    'year': props.get('year', year),
                    'address': props.get('address'),
                    'description': props.get('description'),
                    'district': props.get('district', district),
                    'lon': lon,
                    'lat': lat
                })
        
        feature_count += 1
    
    db.session.commit()
    return feature_count


@app.route('/api/platform/<int:platform_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_platform(platform_id):
    """Get, update, or delete a specific platform"""
    platform = HealthPlatform.query.get_or_404(platform_id)
    
    if request.method == 'GET':
        return jsonify(platform.to_dict())
    
    elif request.method == 'PUT':
        data = request.json
        
        if 'name' in data:
            platform.name = data['name']
        if 'type' in data:
            platform.type = data['type']
        if 'youth_count' in data:
            platform.youth_count = data['youth_count']
        if 'total_members' in data:
            platform.total_members = data['total_members']
        if 'address' in data:
            platform.address = data['address']
        
        try:
            db.session.commit()
            TrendData.update_trends()
            return jsonify(platform.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            db.session.delete(platform)
            db.session.commit()
            TrendData.update_trends()
            return jsonify({"message": "Platform deleted successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


@app.route('/api/refresh-trends', methods=['POST'])
def refresh_trends():
    """Manually refresh trend data"""
    try:
        TrendData.update_trends()
        return jsonify({"message": "Trends updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/init-tables', methods=['POST'])
def initialize_tables():
    """Initialize facilities and boundaries tables"""
    try:
        results = []
        
        # Check and create facilities table
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        if 'facilities' not in inspector.get_table_names():
            results.append("Creating facilities table...")
            db.session.execute(db.text("""
                CREATE TABLE IF NOT EXISTS facilities (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    sub_type VARCHAR(100),
                    year INTEGER NOT NULL,
                    address TEXT,
                    description TEXT,
                    district VARCHAR(100),
                    location GEOMETRY(Point, 4326) NOT NULL,
                    additional_info JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT valid_year CHECK (year >= 2000 AND year <= 2100),
                    CONSTRAINT valid_category CHECK (category IN ('school', 'church', 'police', 'shop', 'office', 'health', 'clinic'))
                );
            """))
            
            db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);"))
            db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_facilities_year ON facilities(year);"))
            db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);"))
            
            db.session.commit()
            results.append("✅ Facilities table created!")
        else:
            results.append("✅ Facilities table already exists")
        
        # Check and create boundaries table
        if 'district_boundaries' not in inspector.get_table_names():
            results.append("Creating district_boundaries table...")
            db.session.execute(db.text("""
                CREATE TABLE IF NOT EXISTS district_boundaries (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    code VARCHAR(20),
                    population INTEGER,
                    area_km2 NUMERIC(10, 2),
                    boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
                    center_point GEOMETRY(Point, 4326),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_district_boundaries_boundary ON district_boundaries USING GIST(boundary);"))
            
            db.session.commit()
            results.append("✅ Boundaries table created!")
        else:
            results.append("✅ Boundaries table already exists")
        
        # Add description columns if missing
        try:
            db.session.execute(db.text("ALTER TABLE health_platforms ADD COLUMN IF NOT EXISTS description TEXT;"))
            db.session.execute(db.text("ALTER TABLE health_platforms ADD COLUMN IF NOT EXISTS district VARCHAR(100);"))
            db.session.commit()
            results.append("✅ Health platforms table updated with description and district columns")
        except:
            pass
        
        return jsonify({
            "message": "Database tables initialized successfully",
            "details": results
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "message": "Error initializing tables"}), 500


@app.route('/api/boundaries', methods=['GET'])
def get_boundaries():
    """Get district boundaries"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify([])
        
        query = db.text("""
            SELECT 
                id,
                name,
                code,
                population,
                area_km2,
                ST_AsGeoJSON(boundary) as boundary_geojson,
                ST_X(center_point) as center_lon,
                ST_Y(center_point) as center_lat
            FROM district_boundaries
            ORDER BY name
        """)
        
        result = db.session.execute(query)
        
        boundaries_list = []
        for row in result:
            import json
            boundaries_list.append({
                'id': row.id,
                'name': row.name,
                'code': row.code,
                'population': row.population,
                'area_km2': float(row.area_km2) if row.area_km2 else 0,
                'boundary': json.loads(row.boundary_geojson),
                'center': [row.center_lon, row.center_lat] if row.center_lon and row.center_lat else None
            })
        
        return jsonify(boundaries_list)
    except Exception as e:
        print(f"Error fetching boundaries: {str(e)}")
        return jsonify([])


@app.route('/api/boundaries/<int:boundary_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_boundary(boundary_id):
    """Get, update, or delete a specific boundary"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify({"error": "Boundaries table does not exist"}), 404
        
        if request.method == 'GET':
            # Get boundary
            query = db.text("""
                SELECT 
                    id,
                    name,
                    code,
                    population,
                    area_km2,
                    ST_AsGeoJSON(boundary) as boundary_geojson,
                    ST_X(center_point) as center_lon,
                    ST_Y(center_point) as center_lat
                FROM district_boundaries
                WHERE id = :id
            """)
            result = db.session.execute(query, {'id': boundary_id})
            row = result.fetchone()
            
            if not row:
                return jsonify({"error": "Boundary not found"}), 404
            
            import json
            return jsonify({
                'id': row.id,
                'name': row.name,
                'code': row.code,
                'population': row.population,
                'area_km2': float(row.area_km2) if row.area_km2 else 0,
                'boundary': json.loads(row.boundary_geojson),
                'center': [row.center_lon, row.center_lat] if row.center_lon and row.center_lat else None
            })
        
        elif request.method == 'PUT':
            # Update boundary
            data = request.json
            updates = []
            params = {'id': boundary_id}
            
            if 'name' in data:
                updates.append('name = :name')
                params['name'] = data['name']
            if 'code' in data:
                updates.append('code = :code')
                params['code'] = data['code']
            if 'population' in data:
                updates.append('population = :population')
                params['population'] = int(data['population']) if data['population'] else None
            if 'area_km2' in data:
                updates.append('area_km2 = :area_km2')
                params['area_km2'] = float(data['area_km2']) if data['area_km2'] else None
            
            if not updates:
                return jsonify({"error": "No fields to update"}), 400
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            
            update_query = db.text(f"""
                UPDATE district_boundaries 
                SET {', '.join(updates)}
                WHERE id = :id
            """)
            
            db.session.execute(update_query, params)
            db.session.commit()
            
            return jsonify({"message": "Boundary updated successfully"})
        
        elif request.method == 'DELETE':
            # Delete boundary
            delete_query = db.text("DELETE FROM district_boundaries WHERE id = :id")
            result = db.session.execute(delete_query, {'id': boundary_id})
            db.session.commit()
            
            if result.rowcount > 0:
                return jsonify({"message": "Boundary deleted successfully"})
            else:
                return jsonify({"error": "Boundary not found"}), 404
        
    except Exception as e:
        db.session.rollback()
        print(f"Error managing boundary: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/boundaries/delete-seed', methods=['POST'])
def delete_seed_boundaries():
    """Delete hardcoded seed boundaries (Mbare, Borrowdale, Harare Central, Glen View, Highfield, Avondale)"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify({"error": "Boundaries table does not exist"}), 404
        
        delete_query = db.text("""
            DELETE FROM district_boundaries 
            WHERE name IN ('Mbare', 'Borrowdale', 'Harare Central', 'Glen View', 'Highfield', 'Avondale')
        """)
        
        result = db.session.execute(delete_query)
        db.session.commit()
        
        deleted_count = result.rowcount
        return jsonify({
            "message": f"Deleted {deleted_count} seed boundaries",
            "deleted": deleted_count
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting seed boundaries: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/upload-boundaries', methods=['POST'])
def upload_boundaries():
    """Upload boundary files (Polygon or MultiPolygon geometries)"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Please upload GeoJSON, JSON, or Shapefile"}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        geojson_data = None
        
        # Process the file
        if filename.endswith('.geojson') or filename.endswith('.json'):
            with open(filepath, 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)
            
            if 'type' not in geojson_data or geojson_data['type'] != 'FeatureCollection':
                return jsonify({"error": "Invalid GeoJSON format. Must be a FeatureCollection"}), 400
            
        elif filename.endswith('.shp') or filename.endswith('.zip'):
            if filename.endswith('.zip'):
                extract_folder = os.path.join(UPLOAD_FOLDER, 'temp_extract')
                os.makedirs(extract_folder, exist_ok=True)
                shutil.unpack_archive(filepath, extract_folder)
                
                shp_files = [f for f in os.listdir(extract_folder) if f.endswith('.shp')]
                if not shp_files:
                    return jsonify({"error": "No shapefile found in zip"}), 400
                
                shp_path = os.path.join(extract_folder, shp_files[0])
            else:
                shp_path = filepath
            
            # Read shapefile with geopandas (handles MultiPolygon automatically)
            gdf = gpd.read_file(shp_path)
            geojson_data = json.loads(gdf.to_json())
            
            if filename.endswith('.zip'):
                shutil.rmtree(extract_folder)
        
        # Import boundaries into database
        feature_count = import_boundaries_to_db(geojson_data)
        
        # Cleanup uploaded file
        os.remove(filepath)
        
        return jsonify({
            "message": "Boundaries uploaded successfully",
            "filename": filename,
            "features": feature_count
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error uploading boundaries: {error_details}")
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


def import_boundaries_to_db(geojson_data):
    """Import boundary GeoJSON (Polygon/MultiPolygon) into district_boundaries table"""
    from sqlalchemy import inspect, text
    
    feature_count = 0
    
    # Check if table exists
    inspector = inspect(db.engine)
    if 'district_boundaries' not in inspector.get_table_names():
        raise Exception("district_boundaries table does not exist. Please initialize tables first.")
    
    for feature in geojson_data.get('features', []):
        props = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        
        geometry_type = geometry.get('type', '').upper()
        
        # Only process Polygon and MultiPolygon geometries
        if geometry_type not in ['POLYGON', 'MULTIPOLYGON']:
            print(f"Skipping feature {props.get('name', 'unknown')}: geometry type {geometry_type} not supported for boundaries")
            continue
        
        # Get properties - handle various property name formats
        name = (props.get('name') or props.get('NAME') or props.get('name_1') or 
                props.get('district') or props.get('DISTRICT') or 
                props.get('Suburb') or props.get('SUBURB') or 
                f"Boundary {feature_count + 1}")
        
        code = (props.get('code') or props.get('CODE') or 
                props.get('Dist_Code') or props.get('DIST_CODE') or
                props.get('district_code') or props.get('DISTRICT_CODE'))
        
        population = (props.get('population') or props.get('POPULATION') or 
                     props.get('Population') or props.get('POP'))
        
        # Handle area - could be in m², km², or other units
        area_raw = (props.get('area_km2') or props.get('AREA_KM2') or 
                   props.get('area') or props.get('AREA') or
                   props.get('Shape_Area') or props.get('SHAPE_AREA'))
        
        # Convert area to km² if it's likely in square meters (Shape_Area from shapefiles)
        area_km2 = None
        if area_raw:
            try:
                area_value = float(area_raw)
                # If area is very large (> 1000), likely in m², convert to km²
                if area_value > 1000:
                    area_km2 = area_value / 1000000  # Convert m² to km²
                else:
                    area_km2 = area_value  # Assume already in km²
            except (ValueError, TypeError):
                area_km2 = None
        
        # Strip Z dimension from coordinates if present (convert 3D to 2D)
        def strip_z_dimension(coords):
            """Recursively remove Z dimension from coordinate arrays"""
            if isinstance(coords, (list, tuple)):
                if len(coords) > 0 and isinstance(coords[0], (int, float)):
                    # This is a coordinate pair/triple - return only first 2 elements
                    return coords[:2]
                else:
                    # This is a nested array - process recursively
                    return [strip_z_dimension(coord) for coord in coords]
            return coords
        
        # Remove Z dimension from geometry coordinates
        if geometry.get('coordinates'):
            geometry['coordinates'] = strip_z_dimension(geometry['coordinates'])
        
        # Convert geometry to GeoJSON string for PostGIS
        geometry_json = json.dumps(geometry)
        
        # Check if coordinates need transformation (detect projected vs geographic)
        crs_info = geojson_data.get('crs', {})
        sample_coord = None
        needs_transform = False
        source_srid = None
        
        if geometry.get('coordinates'):
            try:
                if geometry_type == 'POLYGON':
                    # Polygon: coordinates[0] = outer ring, coordinates[0][0] = first point [lon, lat]
                    if (geometry['coordinates'] and len(geometry['coordinates']) > 0 and
                        geometry['coordinates'][0] and len(geometry['coordinates'][0]) > 0 and
                        geometry['coordinates'][0][0] and len(geometry['coordinates'][0][0]) >= 2):
                        sample_coord = geometry['coordinates'][0][0]  # This should be [lon, lat]
                elif geometry_type == 'MULTIPOLYGON':
                    # MultiPolygon: coordinates[0] = first polygon, coordinates[0][0] = outer ring, coordinates[0][0][0] = first point [lon, lat]
                    if (geometry['coordinates'] and len(geometry['coordinates']) > 0 and
                        geometry['coordinates'][0] and len(geometry['coordinates'][0]) > 0 and
                        geometry['coordinates'][0][0] and len(geometry['coordinates'][0][0]) > 0 and
                        geometry['coordinates'][0][0][0] and len(geometry['coordinates'][0][0][0]) >= 2):
                        sample_coord = geometry['coordinates'][0][0][0]  # This should be [lon, lat]
            except (IndexError, TypeError) as e:
                print(f"Error extracting sample coordinate for {name}: {e}")
                sample_coord = None
        
        # Detect if coordinates are in projected system (large numbers) vs lat/lon
        if sample_coord and isinstance(sample_coord, (list, tuple)) and len(sample_coord) >= 2:
            try:
                lon = float(sample_coord[0])
                lat = float(sample_coord[1])
            except (ValueError, TypeError, IndexError):
                print(f"Warning: Could not parse coordinates for {name}. Skipping coordinate transformation check.")
                lon = None
                lat = None
            
            # If coordinates are very large (> 1000), likely projected (not lat/lon)
            if lon is not None and lat is not None and (abs(lon) > 1000 or abs(lat) > 1000):
                needs_transform = True
                # Try to detect UTM zone (common for Zimbabwe is UTM Zone 35S or 36S)
                # Zimbabwe coordinates typically fall in these ranges
                if 200000 < abs(lon) < 1000000 and 7000000 < abs(lat) < 9000000:
                    # Likely UTM Zone 35S (EPSG:32735) or 36S (EPSG:32736)
                    # Default to 35S for Harare area
                    source_srid = 32735
                    print(f"Detected projected coordinates for {name}. Attempting transformation from EPSG:{source_srid} to WGS84.")
                else:
                    print(f"Warning: Geometry for {name} appears to be in a projected coordinate system but SRID could not be determined.")
        
        # Calculate center point from geometry using PostGIS function
        # If geometry needs transformation, PostGIS will handle it if SRID is set correctly
        center_query = text("""
            SELECT 
                ST_X(ST_Centroid(ST_GeomFromGeoJSON(:geom))) as center_lon,
                ST_Y(ST_Centroid(ST_GeomFromGeoJSON(:geom))) as center_lat
        """)
        
        try:
            center_result = db.session.execute(center_query, {'geom': geometry_json})
            center_row = center_result.fetchone()
            center_lon = center_row[0] if center_row else None
            center_lat = center_row[1] if center_row else None
            
            # Validate coordinates are in valid lat/lon range
            if center_lon and center_lat:
                if abs(center_lon) > 180 or abs(center_lat) > 90:
                    print(f"Warning: Center coordinates for {name} are outside valid WGS84 range. May need coordinate transformation.")
                    # Try to use geometry centroid anyway, but log warning
        except Exception as e:
            print(f"Error calculating center for {name}: {str(e)}")
            center_lon = None
            center_lat = None
        
        # Insert or update boundary using PostGIS
        # Transform geometry if needed, otherwise assume WGS84
        if needs_transform and source_srid:
            # Transform from source CRS to WGS84
            insert_query = text("""
                INSERT INTO district_boundaries 
                (name, code, population, area_km2, boundary, center_point)
                VALUES 
                (:name, :code, :population, :area_km2, 
                 ST_Force2D(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:boundary_geom), :source_srid), 4326))::geometry(MultiPolygon, 4326), 
                 CASE WHEN :center_lon IS NOT NULL AND :center_lat IS NOT NULL 
                      THEN ST_SetSRID(ST_MakePoint(:center_lon, :center_lat), 4326) 
                      ELSE NULL END)
                ON CONFLICT (name) 
                DO UPDATE SET
                    code = EXCLUDED.code,
                    population = EXCLUDED.population,
                    area_km2 = EXCLUDED.area_km2,
                    boundary = EXCLUDED.boundary,
                    center_point = EXCLUDED.center_point,
                    updated_at = CURRENT_TIMESTAMP
            """)
            insert_params = {
                'name': name,
                'code': code,
                'population': int(population) if population else None,
                'area_km2': area_km2,
                'boundary_geom': geometry_json,
                'source_srid': source_srid,
                'center_lon': center_lon,
                'center_lat': center_lat
            }
        else:
            # Assume already in WGS84
            insert_query = text("""
                INSERT INTO district_boundaries 
                (name, code, population, area_km2, boundary, center_point)
                VALUES 
                (:name, :code, :population, :area_km2, 
                 ST_Force2D(ST_GeomFromGeoJSON(:boundary_geom))::geometry(MultiPolygon, 4326), 
                 CASE WHEN :center_lon IS NOT NULL AND :center_lat IS NOT NULL 
                      THEN ST_SetSRID(ST_MakePoint(:center_lon, :center_lat), 4326) 
                      ELSE NULL END)
                ON CONFLICT (name) 
                DO UPDATE SET
                    code = EXCLUDED.code,
                    population = EXCLUDED.population,
                    area_km2 = EXCLUDED.area_km2,
                    boundary = EXCLUDED.boundary,
                    center_point = EXCLUDED.center_point,
                    updated_at = CURRENT_TIMESTAMP
            """)
            insert_params = {
                'name': name,
                'code': code,
                'population': int(population) if population else None,
                'area_km2': area_km2,
                'boundary_geom': geometry_json,
                'center_lon': center_lon,
                'center_lat': center_lat
            }
        
        try:
            db.session.execute(insert_query, insert_params)
            feature_count += 1
        except Exception as e:
            print(f"Error inserting boundary {name}: {str(e)}")
            import traceback
            print(traceback.format_exc())
            db.session.rollback()
            continue
    
    try:
        db.session.commit()
        print(f"Successfully imported {feature_count} boundaries")
    except Exception as e:
        db.session.rollback()
        print(f"Error committing boundaries: {str(e)}")
        raise
    
    return feature_count


@app.route('/api/district/<district_name>/facilities', methods=['GET'])
def get_district_facilities(district_name):
    """Get all facilities within a specific district"""
    year = request.args.get('year', type=int, default=get_current_year())
    
    try:
        # Get health platforms in district
        health_query = db.text("""
            SELECT id, name, type as category, youth_count, total_members
            FROM health_platforms
            WHERE district = :district AND year = :year
        """)
        
        health_result = db.session.execute(health_query, {'district': district_name, 'year': year})
        
        # Get other facilities in district
        facilities_query = db.text("""
            SELECT id, name, category, sub_type
            FROM facilities
            WHERE district = :district AND year = :year
        """)
        
        facilities_result = db.session.execute(facilities_query, {'district': district_name, 'year': year})
        
        summary = {
            'district': district_name,
            'year': year,
            'health_platforms': [dict(row._mapping) for row in health_result],
            'facilities': [dict(row._mapping) for row in facilities_result],
            'counts': {}
        }
        
        # Count by category
        count_query = db.text("""
            SELECT category, sub_type, COUNT(*) as count
            FROM facilities
            WHERE district = :district AND year = :year
            GROUP BY category, sub_type
        """)
        
        count_result = db.session.execute(count_query, {'district': district_name, 'year': year})
        for row in count_result:
            key = f"{row.category}_{row.sub_type}" if row.sub_type else row.category
            summary['counts'][key] = row.count
        
        return jsonify(summary)
    except Exception as e:
        print(f"Error fetching district facilities: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/facilities', methods=['GET'])
def get_facilities():
    """Get all community facilities (schools, churches, police, shops, offices)"""
    year = request.args.get('year', type=int)
    category = request.args.get('category')  # Optional filter by category
    
    if not year:
        years = db.session.query(db.func.max(db.text('year'))).select_from(db.text('facilities')).scalar()
        year = years if years else get_current_year()
    
    try:
        # Check if facilities table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'facilities' not in inspector.get_table_names():
            # Return empty array if table doesn't exist yet
            return jsonify([])
        
        query = db.text("""
            SELECT 
                id,
                name,
                category,
                sub_type,
                year,
                address,
                description,
                ST_X(location) as longitude,
                ST_Y(location) as latitude,
                additional_info
            FROM facilities
            WHERE year = :year
        """)
        
        params = {'year': year}
        
        if category:
            query = db.text("""
                SELECT 
                    id,
                    name,
                    category,
                    sub_type,
                    year,
                    address,
                    description,
                    ST_X(location) as longitude,
                    ST_Y(location) as latitude,
                    additional_info
                FROM facilities
                WHERE year = :year AND category = :category
            """)
            params['category'] = category
        
        result = db.session.execute(query, params)
        
        facilities_list = []
        for row in result:
            facilities_list.append({
                'id': row.id,
                'name': row.name,
                'category': row.category,
                'sub_type': row.sub_type,
                'year': row.year,
                'address': row.address,
                'description': getattr(row, 'description', None),  # Add description if exists
                'location': {
                    'coordinates': [row.longitude, row.latitude]
                },
                'longitude': row.longitude,
                'latitude': row.latitude,
                'additional_info': row.additional_info
            })
        
        # Log for debugging
        print(f"Found {len(facilities_list)} facilities for year {year}")
        police_count = len([f for f in facilities_list if f['category'] == 'police'])
        if police_count > 0:
            print(f"Found {police_count} police stations")
            for f in facilities_list:
                if f['category'] == 'police':
                    print(f"  - {f['name']}: lat={f['latitude']}, lon={f['longitude']}")
        
        return jsonify(facilities_list)
    except Exception as e:
        # Return empty array if error (table might not exist yet)
        print(f"Error fetching facilities: {str(e)}")
        return jsonify([])


@app.route('/api/facility/<int:facility_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_facility(facility_id):
    """Get, update, or delete a specific facility"""
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        
        if 'facilities' not in inspector.get_table_names():
            return jsonify({"error": "Facilities table does not exist"}), 404
        
        if request.method == 'GET':
            query = db.text("""
                SELECT 
                    id, name, category, sub_type, year, address, description, district,
                    ST_X(location) as longitude,
                    ST_Y(location) as latitude,
                    additional_info
                FROM facilities
                WHERE id = :id
            """)
            result = db.session.execute(query, {'id': facility_id}).fetchone()
            
            if not result:
                return jsonify({"error": "Facility not found"}), 404
            
            return jsonify({
                'id': result.id,
                'name': result.name,
                'category': result.category,
                'sub_type': result.sub_type,
                'year': result.year,
                'address': result.address,
                'description': result.description,
                'district': result.district,
                'longitude': result.longitude,
                'latitude': result.latitude,
                'additional_info': result.additional_info
            })
        
        elif request.method == 'PUT':
            data = request.json
            
            # Build update query dynamically
            updates = []
            params = {'id': facility_id}
            
            if 'name' in data:
                updates.append('name = :name')
                params['name'] = data['name']
            if 'category' in data:
                updates.append('category = :category')
                params['category'] = data['category']
            if 'sub_type' in data:
                updates.append('sub_type = :sub_type')
                params['sub_type'] = data['sub_type']
            if 'year' in data:
                updates.append('year = :year')
                params['year'] = data['year']
            if 'address' in data:
                updates.append('address = :address')
                params['address'] = data['address']
            if 'description' in data:
                updates.append('description = :description')
                params['description'] = data['description']
            if 'district' in data:
                updates.append('district = :district')
                params['district'] = data['district']
            
            # Update location if coordinates provided
            if 'latitude' in data and 'longitude' in data:
                updates.append('location = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)')
                params['lon'] = data['longitude']
                params['lat'] = data['latitude']
            
            if not updates:
                return jsonify({"error": "No fields to update"}), 400
            
            update_query = db.text(f"""
                UPDATE facilities
                SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """)
            
            db.session.execute(update_query, params)
            db.session.commit()
            
            # Return updated facility
            query = db.text("""
                SELECT 
                    id, name, category, sub_type, year, address, description, district,
                    ST_X(location) as longitude,
                    ST_Y(location) as latitude
                FROM facilities
                WHERE id = :id
            """)
            result = db.session.execute(query, {'id': facility_id}).fetchone()
            
            return jsonify({
                'id': result.id,
                'name': result.name,
                'category': result.category,
                'sub_type': result.sub_type,
                'year': result.year,
                'address': result.address,
                'description': result.description,
                'district': result.district,
                'longitude': result.longitude,
                'latitude': result.latitude
            })
        
        elif request.method == 'DELETE':
            delete_query = db.text("DELETE FROM facilities WHERE id = :id")
            db.session.execute(delete_query, {'id': facility_id})
            db.session.commit()
            return jsonify({"message": "Facility deleted successfully"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Database initialization commands
@app.cli.command('init-db')
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database initialized successfully!")


@app.cli.command('seed-db')
def seed_db():
    """Seed the database with sample data"""
    # You can run the seed.sql file or add Python seeding here
    print("Please run: psql -d srhr_dashboard -f database/seed.sql")


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Auto-create facilities table if it doesn't exist
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            if 'facilities' not in inspector.get_table_names():
                print("Creating facilities table...")
                # Execute schema
                schema_path = os.path.join('database', 'schema_facilities.sql')
                if os.path.exists(schema_path):
                    with open(schema_path, 'r') as f:
                        schema_sql = f.read()
                        # Split and execute statements
                        for statement in schema_sql.split(';'):
                            if statement.strip():
                                try:
                                    db.session.execute(db.text(statement))
                                except Exception as e:
                                    print(f"Note: {e}")
                        db.session.commit()
                    print("✅ Facilities table created!")
        except Exception as e:
            print(f"Note: Could not auto-create facilities table: {e}")
            print("You can create it manually later.")
    
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')

