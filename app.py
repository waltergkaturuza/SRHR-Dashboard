from flask import Flask, request, jsonify
from flask_cors import CORS
import geopandas as gpd
import pandas as pd
import json
import os
from werkzeug.utils import secure_filename
import tempfile
import shutil
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
DATA_FOLDER = 'data'
ALLOWED_EXTENSIONS = {'geojson', 'json', 'shp', 'zip'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Sample data for Harare districts
HARARE_DISTRICTS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0492, -17.8252]},
            "properties": {
                "id": 1,
                "name": "Harare Central District Health Office",
                "type": "District Office",
                "youth_count": 45,
                "total_members": 120,
                "year": 2024,
                "address": "Corner 5th Street & Central Avenue"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0312, -17.8352]},
            "properties": {
                "id": 2,
                "name": "Mbare Health Decision Committee",
                "type": "Community Health Committee",
                "youth_count": 32,
                "total_members": 85,
                "year": 2024,
                "address": "Mbare Township"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0712, -17.8052]},
            "properties": {
                "id": 3,
                "name": "Borrowdale Health Forum",
                "type": "Health Forum",
                "youth_count": 28,
                "total_members": 95,
                "year": 2024,
                "address": "Borrowdale Shopping Center"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0212, -17.8452]},
            "properties": {
                "id": 4,
                "name": "Glen View Youth Health Committee",
                "type": "Youth Committee",
                "youth_count": 67,
                "total_members": 75,
                "year": 2024,
                "address": "Glen View 3"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0592, -17.8152]},
            "properties": {
                "id": 5,
                "name": "Avondale Clinic Committee",
                "type": "Clinic Committee",
                "youth_count": 19,
                "total_members": 60,
                "year": 2024,
                "address": "Avondale West"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0412, -17.8552]},
            "properties": {
                "id": 6,
                "name": "Highfield Community Health Platform",
                "type": "Community Platform",
                "youth_count": 54,
                "total_members": 110,
                "year": 2024,
                "address": "Highfield Township"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0812, -17.8352]},
            "properties": {
                "id": 7,
                "name": "Hatfield Youth SRHR Forum",
                "type": "SRHR Forum",
                "youth_count": 41,
                "total_members": 65,
                "year": 2024,
                "address": "Hatfield"
            }
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [31.0292, -17.8652]},
            "properties": {
                "id": 8,
                "name": "Dzivarasekwa Health Advisory Board",
                "type": "Advisory Board",
                "youth_count": 38,
                "total_members": 100,
                "year": 2024,
                "address": "Dzivarasekwa Extension"
            }
        }
    ]
}

# Historical trend data
TREND_DATA = [
    {"year": 2018, "youth_count": 156, "total_count": 520, "committees": 8},
    {"year": 2019, "youth_count": 189, "total_count": 580, "committees": 8},
    {"year": 2020, "youth_count": 215, "total_count": 610, "committees": 8},
    {"year": 2021, "youth_count": 245, "total_count": 640, "committees": 8},
    {"year": 2022, "youth_count": 278, "total_count": 670, "committees": 8},
    {"year": 2023, "youth_count": 302, "total_count": 695, "committees": 8},
    {"year": 2024, "youth_count": 324, "total_count": 710, "committees": 8}
]

@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "message": "SRHR Dashboard API is running"})

@app.route('/api/geospatial-data', methods=['GET'])
def get_geospatial_data():
    """Get all geospatial data"""
    year = request.args.get('year', '2024')
    
    # Check if custom data exists
    custom_data_path = os.path.join(DATA_FOLDER, 'districts.geojson')
    if os.path.exists(custom_data_path):
        with open(custom_data_path, 'r') as f:
            data = json.load(f)
    else:
        data = HARARE_DISTRICTS
    
    return jsonify(data)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload geospatial data file"""
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
        
        # Process the file based on type
        if filename.endswith('.geojson') or filename.endswith('.json'):
            with open(filepath, 'r') as f:
                geojson_data = json.load(f)
            
            # Validate GeoJSON structure
            if 'type' not in geojson_data or geojson_data['type'] != 'FeatureCollection':
                return jsonify({"error": "Invalid GeoJSON format. Must be a FeatureCollection"}), 400
            
            # Save to data folder
            output_path = os.path.join(DATA_FOLDER, 'districts.geojson')
            with open(output_path, 'w') as f:
                json.dump(geojson_data, f)
            
            feature_count = len(geojson_data.get('features', []))
            
        elif filename.endswith('.shp') or filename.endswith('.zip'):
            # Handle shapefile
            if filename.endswith('.zip'):
                # Extract zip file
                extract_folder = os.path.join(UPLOAD_FOLDER, 'temp_extract')
                os.makedirs(extract_folder, exist_ok=True)
                shutil.unpack_archive(filepath, extract_folder)
                
                # Find the .shp file
                shp_files = [f for f in os.listdir(extract_folder) if f.endswith('.shp')]
                if not shp_files:
                    return jsonify({"error": "No shapefile found in zip"}), 400
                
                shp_path = os.path.join(extract_folder, shp_files[0])
            else:
                shp_path = filepath
            
            # Read shapefile with geopandas
            gdf = gpd.read_file(shp_path)
            
            # Convert to GeoJSON
            geojson_data = json.loads(gdf.to_json())
            
            # Save to data folder
            output_path = os.path.join(DATA_FOLDER, 'districts.geojson')
            with open(output_path, 'w') as f:
                json.dump(geojson_data, f)
            
            feature_count = len(gdf)
            
            # Cleanup
            if filename.endswith('.zip'):
                shutil.rmtree(extract_folder)
        
        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "features": feature_count
        })
        
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500

@app.route('/api/trends', methods=['GET'])
def get_trends():
    """Get trend data for youth participation"""
    return jsonify(TREND_DATA)

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get summary statistics"""
    year = request.args.get('year', '2024')
    
    # Calculate statistics from current data
    custom_data_path = os.path.join(DATA_FOLDER, 'districts.geojson')
    if os.path.exists(custom_data_path):
        with open(custom_data_path, 'r') as f:
            data = json.load(f)
    else:
        data = HARARE_DISTRICTS
    
    features = data.get('features', [])
    
    total_youth = sum(f['properties'].get('youth_count', 0) for f in features)
    total_members = sum(f['properties'].get('total_members', 0) for f in features)
    total_committees = len(features)
    
    youth_percentage = (total_youth / total_members * 100) if total_members > 0 else 0
    
    return jsonify({
        "year": year,
        "total_youth": total_youth,
        "total_members": total_members,
        "total_committees": total_committees,
        "youth_percentage": round(youth_percentage, 1),
        "average_youth_per_committee": round(total_youth / total_committees, 1) if total_committees > 0 else 0
    })

@app.route('/api/reset', methods=['POST'])
def reset_data():
    """Reset to default data"""
    try:
        custom_data_path = os.path.join(DATA_FOLDER, 'districts.geojson')
        if os.path.exists(custom_data_path):
            os.remove(custom_data_path)
        
        return jsonify({"message": "Data reset to default successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

