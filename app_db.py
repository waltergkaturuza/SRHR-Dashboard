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
            feature_count = import_geojson_to_db(geojson_data, year)
            
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
            
            feature_count = import_geojson_to_db(geojson_data, year)
            
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


def import_geojson_to_db(geojson_data, year):
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
        
        # Create new platform
        platform = HealthPlatform(
            name=props.get('name', 'Unknown'),
            type=props.get('type', 'Other'),
            youth_count=props.get('youth_count', 0),
            total_members=props.get('total_members', 1),
            year=props.get('year', year),
            address=props.get('address'),
            location=ST_GeomFromText(wkt_point, 4326)
        )
        
        db.session.add(platform)
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
    
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')

