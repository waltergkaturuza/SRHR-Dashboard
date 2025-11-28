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
    """Get all available years from database"""
    try:
        years = HealthPlatform.get_available_years()
        current_year = max(years) if years else 2024
        
        return jsonify({
            "years": years,
            "current_year": current_year
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/geospatial-data', methods=['GET'])
def get_geospatial_data():
    """Get geospatial data for a specific year"""
    year = request.args.get('year', type=int)
    
    if not year:
        # Get most recent year
        years = HealthPlatform.get_available_years()
        year = max(years) if years else 2024
    
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
        year = max(years) if years else 2024
    
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
        year = max(years) + 1 if years else 2024
    
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
                'center': [row.center_lon, row.center_lat]
            })
        
        return jsonify(boundaries_list)
    except Exception as e:
        print(f"Error fetching boundaries: {str(e)}")
        return jsonify([])


@app.route('/api/district/<district_name>/facilities', methods=['GET'])
def get_district_facilities(district_name):
    """Get all facilities within a specific district"""
    year = request.args.get('year', type=int, default=2024)
    
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
        year = years if years else 2024
    
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
                'location': {
                    'coordinates': [row.longitude, row.latitude]
                },
                'longitude': row.longitude,
                'latitude': row.latitude,
                'additional_info': row.additional_info
            })
        
        return jsonify(facilities_list)
    except Exception as e:
        # Return empty array if error (table might not exist yet)
        print(f"Error fetching facilities: {str(e)}")
        return jsonify([])


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

