from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database.models import db, HealthPlatform, TrendData, User, DistrictBoundary, YouthRepresentative, youth_rep_districts
from geoalchemy2.functions import ST_GeomFromText, ST_AsGeoJSON
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
import geopandas as gpd
import json
import tempfile
import shutil
from datetime import datetime, timedelta
import jwt
from functools import wraps

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

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def generate_token(user):
    """Generate JWT token for user"""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    """Get current user from request token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        token = auth_header.split(' ')[1]  # Bearer <token>
        payload = verify_token(token)
        if payload:
            user = User.query.get(payload['user_id'])
            if user and user.is_active:
                return user
    except (IndexError, KeyError):
        pass
    return None

def require_auth(required_role='viewer'):
    """Decorator to require authentication and optional role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if not user.has_role(required_role):
                return jsonify({'error': f'Insufficient permissions. Required role: {required_role}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


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


# Authentication Endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate token
        token = generate_token(user)
        
        return jsonify({
            'token': token,
            'user': user.to_dict(),
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed. Please try again.'}), 500


@app.route('/api/auth/register', methods=['POST'])
@require_auth('admin')  # Only admins can create new users
def register():
    """Register new user (admin only)"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', 'viewer')
        full_name = data.get('full_name', '').strip()
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if role not in ['admin', 'editor', 'viewer']:
            return jsonify({'error': 'Invalid role. Must be admin, editor, or viewer'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=username,
            email=email,
            role=role,
            full_name=full_name or username
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def get_current_user_info():
    """Get current authenticated user info"""
    user = get_current_user()
    return jsonify({'user': user.to_dict()}), 200


@app.route('/api/auth/logout', methods=['POST'])
@require_auth()
def logout():
    """Logout endpoint (client should discard token)"""
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/auth/users', methods=['GET'])
@require_auth('admin')
def list_users():
    """List all users (admin only)"""
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        print(f"List users error: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500


@app.route('/api/auth/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth('admin')
def manage_user(user_id):
    """Get, update, or delete a user (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if request.method == 'GET':
            return jsonify({'user': user.to_dict()}), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Prevent editing yourself (to avoid locking yourself out)
            current_user = get_current_user()
            if current_user.id == user_id and data.get('role') and data.get('role') != user.role:
                return jsonify({'error': 'You cannot change your own role'}), 400
            
            if current_user.id == user_id and data.get('is_active') == False:
                return jsonify({'error': 'You cannot deactivate your own account'}), 400
            
            # Update fields
            if 'username' in data:
                # Check if username already exists (excluding current user)
                existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
                if existing:
                    return jsonify({'error': 'Username already exists'}), 400
                user.username = data['username'].strip()
            
            if 'email' in data:
                # Check if email already exists (excluding current user)
                existing = User.query.filter(User.email == data['email'].lower().strip(), User.id != user_id).first()
                if existing:
                    return jsonify({'error': 'Email already exists'}), 400
                user.email = data['email'].strip().lower()
            
            if 'role' in data:
                if data['role'] not in ['admin', 'editor', 'viewer']:
                    return jsonify({'error': 'Invalid role'}), 400
                user.role = data['role']
            
            if 'full_name' in data:
                user.full_name = data['full_name'].strip()
            
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
            
            if 'password' in data and data['password']:
                user.set_password(data['password'])
            
            db.session.commit()
            
            return jsonify({
                'user': user.to_dict(),
                'message': 'User updated successfully'
            }), 200
        
        elif request.method == 'DELETE':
            # Prevent deleting yourself
            current_user = get_current_user()
            if current_user.id == user_id:
                return jsonify({'error': 'You cannot delete your own account'}), 400
            
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Manage user error: {e}")
        return jsonify({'error': 'Failed to manage user'}), 500


@app.route('/api/auth/init-admin', methods=['POST'])
def init_admin():
    """Initialize default admin user (only works if no users exist)"""
    try:
        # Ensure users table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        if 'users' not in inspector.get_table_names():
            # Create all tables including users
            with app.app_context():
                db.create_all()
        
        # Check if any users exist
        try:
            user_count = User.query.count()
            if user_count > 0:
                return jsonify({'error': 'Users already exist. Use admin account to create new users.'}), 400
        except Exception as query_error:
            # Table might exist but have issues, try to create it anyway
            print(f"Query error (might be expected on first run): {query_error}")
            with app.app_context():
                db.create_all()
            # Try query again
            user_count = User.query.count()
            if user_count > 0:
                return jsonify({'error': 'Users already exist. Use admin account to create new users.'}), 400
        
        data = request.get_json() or {}
        username = data.get('username', 'admin').strip()
        email = data.get('email', 'admin@srhr.local').strip().lower()
        password = data.get('password', 'admin123')
        full_name = data.get('full_name', 'Administrator')
        
        # Validate inputs
        if not username:
            username = 'admin'
        if not email:
            email = 'admin@srhr.local'
        if not password:
            password = 'admin123'
        
        # Create admin user
        admin = User(
            username=username,
            email=email,
            role='admin',
            full_name=full_name or username,
            is_active=True
        )
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        
        return jsonify({
            'user': admin.to_dict(),
            'message': f'Admin user "{username}" created successfully. Please change the default password.'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Init admin error: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            'error': 'Failed to create admin user',
            'details': str(e)
        }), 500


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
@require_auth('editor')  # Require editor role or higher
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
        import traceback
        error_trace = traceback.format_exc()
        print(f"Upload error: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Error processing file: {str(e)}",
            "details": error_trace
        }), 500


def import_geojson_to_db(geojson_data, year, category='health', district=None):
    """Import GeoJSON data into database"""
    feature_count = 0
    
    try:
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
                    youth_count=int(props.get('youth_count', 0)),
                    total_members=int(props.get('total_members', 1)),
                    year=int(props.get('year', year)),
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
                        'year': int(props.get('year', year)),
                        'address': props.get('address'),
                        'description': props.get('description'),
                        'district': props.get('district', district),
                        'lon': lon,
                        'lat': lat
                    })
            
            feature_count += 1
        
        db.session.commit()
        return feature_count
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Import error: {e}")
        print(f"Traceback: {error_trace}")
        raise  # Re-raise to be caught by upload_file


@app.route('/api/platform/<int:platform_id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth('editor')  # Require editor role or higher
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
@require_auth('admin')  # Only admins can initialize tables
def initialize_tables():
    """Initialize facilities, boundaries, and users tables"""
    try:
        results = []
        
        # Create all tables (including users)
        with app.app_context():
            db.create_all()
            results.append("✅ All tables initialized (including users table)")
        
        # Add missing columns to health_platforms if they don't exist
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        if 'health_platforms' in inspector.get_table_names():
            try:
                # Check if description column exists
                columns = [col['name'] for col in inspector.get_columns('health_platforms')]
                if 'description' not in columns:
                    db.session.execute(db.text("ALTER TABLE health_platforms ADD COLUMN description TEXT"))
                    results.append("✅ Added description column to health_platforms")
                if 'district' not in columns:
                    db.session.execute(db.text("ALTER TABLE health_platforms ADD COLUMN district VARCHAR(100)"))
                    results.append("✅ Added district column to health_platforms")
                db.session.commit()
            except Exception as e:
                print(f"Note: Could not add columns to health_platforms (may already exist): {e}")
        
        # Check and create facilities table
        
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
                ST_Y(center_point) as center_lat,
                youth_rep_name,
                youth_rep_title,
                health_platforms
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
                'center': [row.center_lon, row.center_lat] if row.center_lon and row.center_lat else None,
                'youth_rep_name': row.youth_rep_name,
                'youth_rep_title': row.youth_rep_title,
                'health_platforms': row.health_platforms or []
            })
        
        return jsonify(boundaries_list)
    except Exception as e:
        print(f"Error fetching boundaries: {str(e)}")
        return jsonify([])


@app.route('/api/boundaries/<int:boundary_id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth('editor')  # Require editor role or higher
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


@app.route('/api/boundaries/bulk-delete', methods=['POST'])
@require_auth('editor')  # Require editor role or higher
def bulk_delete_boundaries():
    """Bulk delete boundaries by IDs"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify({"error": "Boundaries table does not exist"}), 404
        
        data = request.json
        if not data or 'ids' not in data:
            return jsonify({"error": "Missing 'ids' array in request body"}), 400
        
        ids = data['ids']
        if not isinstance(ids, list) or len(ids) == 0:
            return jsonify({"error": "Invalid or empty 'ids' array"}), 400
        
        # Validate all IDs are integers
        try:
            ids = [int(id) for id in ids]
        except (ValueError, TypeError):
            return jsonify({"error": "All IDs must be integers"}), 400
        
        # Delete boundaries
        delete_query = db.text("""
            DELETE FROM district_boundaries 
            WHERE id = ANY(:ids)
        """)
        
        result = db.session.execute(delete_query, {'ids': ids})
        db.session.commit()
        
        deleted_count = result.rowcount
        return jsonify({
            "message": f"Successfully deleted {deleted_count} boundar{'y' if deleted_count == 1 else 'ies'}",
            "deleted": deleted_count
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error bulk deleting boundaries: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/districts/youth-info', methods=['GET'])
def get_districts_youth_info():
    """Get all districts with their youth representative information"""
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
                youth_rep_name,
                youth_rep_title,
                health_platforms,
                ST_X(center_point) as center_lon,
                ST_Y(center_point) as center_lat
            FROM district_boundaries
            ORDER BY name
        """)
        
        result = db.session.execute(query)
        
        districts_list = []
        for row in result:
            districts_list.append({
                'id': row.id,
                'name': row.name,
                'code': row.code,
                'population': row.population,
                'area_km2': float(row.area_km2) if row.area_km2 else None,
                'youth_rep_name': row.youth_rep_name,
                'youth_rep_title': row.youth_rep_title,
                'health_platforms': row.health_platforms or [],
                'center': [row.center_lon, row.center_lat] if row.center_lon and row.center_lat else None
            })
        
        return jsonify(districts_list)
    except Exception as e:
        print(f"Error fetching districts youth info: {str(e)}")
        return jsonify([])


@app.route('/api/districts/<int:district_id>/youth-info', methods=['GET', 'PUT'])
@require_auth('editor')  # Require editor role for updates
def manage_district_youth_info(district_id):
    """Get or update youth representative information for a specific district"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify({"error": "District boundaries table does not exist"}), 404
        
        if request.method == 'GET':
            # Get district youth info
            query = db.text("""
                SELECT 
                    id,
                    name,
                    code,
                    youth_rep_name,
                    youth_rep_title,
                    health_platforms
                FROM district_boundaries
                WHERE id = :id
            """)
            result = db.session.execute(query, {'id': district_id})
            row = result.fetchone()
            
            if not row:
                return jsonify({"error": "District not found"}), 404
            
            return jsonify({
                'id': row.id,
                'name': row.name,
                'code': row.code,
                'youth_rep_name': row.youth_rep_name,
                'youth_rep_title': row.youth_rep_title,
                'health_platforms': row.health_platforms or []
            })
        
        elif request.method == 'PUT':
            # Update district youth info
            data = request.json
            updates = []
            params = {'id': district_id}
            
            if 'youth_rep_name' in data:
                updates.append('youth_rep_name = :youth_rep_name')
                params['youth_rep_name'] = data['youth_rep_name']
            
            if 'youth_rep_title' in data:
                updates.append('youth_rep_title = :youth_rep_title')
                params['youth_rep_title'] = data['youth_rep_title']
            
            if 'health_platforms' in data:
                # Ensure health_platforms is a list
                platforms = data['health_platforms']
                if isinstance(platforms, str):
                    # If string, split by comma or convert to single-item list
                    platforms = [p.strip() for p in platforms.split(',') if p.strip()]
                elif not isinstance(platforms, list):
                    platforms = []
                
                updates.append('health_platforms = :health_platforms::jsonb')
                params['health_platforms'] = json.dumps(platforms)
            
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
            
            return jsonify({
                "message": "District youth information updated successfully",
                "district_id": district_id
            })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error managing district youth info: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/districts/name/<district_name>/youth-info', methods=['GET', 'PUT'])
def manage_district_youth_info_by_name(district_name):
    """Get or update youth representative information for a district by name"""
    try:
        from sqlalchemy import inspect
        from urllib.parse import unquote
        
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify({"error": "District boundaries table does not exist"}), 404
        
        decoded_name = unquote(district_name)
        
        # Find district by name (case-insensitive)
        find_query = db.text("""
            SELECT id 
            FROM district_boundaries
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(:district_name))
               OR LOWER(TRIM(name)) = LOWER(TRIM(:decoded_name))
            LIMIT 1
        """)
        
        result = db.session.execute(find_query, {
            'district_name': district_name,
            'decoded_name': decoded_name
        })
        row = result.fetchone()
        
        if not row:
            return jsonify({"error": f"District '{district_name}' not found"}), 404
        
        district_id = row.id
        
        if request.method == 'GET':
            # Get district youth info
            query = db.text("""
                SELECT 
                    id,
                    name,
                    code,
                    youth_rep_name,
                    youth_rep_title,
                    health_platforms
                FROM district_boundaries
                WHERE id = :id
            """)
            result = db.session.execute(query, {'id': district_id})
            row = result.fetchone()
            
            return jsonify({
                'id': row.id,
                'name': row.name,
                'code': row.code,
                'youth_rep_name': row.youth_rep_name,
                'youth_rep_title': row.youth_rep_title,
                'health_platforms': row.health_platforms or []
            })
        
        elif request.method == 'PUT':
            # Update district youth info
            data = request.json
            updates = []
            params = {'id': district_id}
            
            if 'youth_rep_name' in data:
                updates.append('youth_rep_name = :youth_rep_name')
                params['youth_rep_name'] = data['youth_rep_name']
            
            if 'youth_rep_title' in data:
                updates.append('youth_rep_title = :youth_rep_title')
                params['youth_rep_title'] = data['youth_rep_title']
            
            if 'health_platforms' in data:
                # Ensure health_platforms is a list
                platforms = data['health_platforms']
                if isinstance(platforms, str):
                    platforms = [p.strip() for p in platforms.split(',') if p.strip()]
                elif not isinstance(platforms, list):
                    platforms = []
                
                updates.append('health_platforms = :health_platforms::jsonb')
                params['health_platforms'] = json.dumps(platforms)
            
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
            
            return jsonify({
                "message": f"Youth information for district '{district_name}' updated successfully",
                "district_id": district_id
            })
    
    except Exception as e:
        db.session.rollback()
        print(f"Error managing district youth info by name: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# New API endpoints for many-to-many youth rep to districts relationship

@app.route('/api/youth-reps', methods=['GET'])
def get_youth_reps():
    """Get all youth representatives with their assigned districts"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'youth_representatives' not in inspector.get_table_names():
            return jsonify([])
        
        query = db.text("""
            SELECT 
                yr.id,
                yr.name,
                yr.title,
                yr.created_at,
                yr.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', db.id,
                            'name', db.name,
                            'code', db.code
                        )
                    ) FILTER (WHERE db.id IS NOT NULL),
                    '[]'::json
                ) as districts
            FROM youth_representatives yr
            LEFT JOIN youth_rep_districts yrd ON yr.id = yrd.youth_rep_id
            LEFT JOIN district_boundaries db ON yrd.district_id = db.id
            GROUP BY yr.id, yr.name, yr.title, yr.created_at, yr.updated_at
            ORDER BY yr.name
        """)
        
        result = db.session.execute(query)
        youth_reps = []
        for row in result:
            districts_list = row.districts if isinstance(row.districts, list) else json.loads(row.districts) if row.districts else []
            youth_reps.append({
                'id': row.id,
                'name': row.name,
                'title': row.title,
                'districts': districts_list,
                'created_at': row.created_at.isoformat() if row.created_at else None,
                'updated_at': row.updated_at.isoformat() if row.updated_at else None
            })
        
        return jsonify(youth_reps)
    except Exception as e:
        print(f"Error fetching youth reps: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/youth-reps', methods=['POST'])
@require_auth('editor')
def create_youth_rep():
    """Create a new youth representative and assign to districts"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'youth_representatives' not in inspector.get_table_names():
            return jsonify({"error": "Youth representatives table does not exist. Please run migration first."}), 500
        
        data = request.json
        name = data.get('name', '').strip()
        title = data.get('title', '').strip()
        district_ids = data.get('district_ids', [])
        
        if not name:
            return jsonify({"error": "Youth representative name is required"}), 400
        
        # Check if rep with same name and title already exists
        check_query = db.text("""
            SELECT id FROM youth_representatives 
            WHERE name = :name AND (title = :title OR (title IS NULL AND :title IS NULL))
        """)
        existing = db.session.execute(check_query, {'name': name, 'title': title or None}).fetchone()
        
        if existing:
            return jsonify({"error": f"Youth representative '{name}' with title '{title}' already exists"}), 400
        
        # Create the youth representative
        insert_query = db.text("""
            INSERT INTO youth_representatives (name, title, created_at, updated_at)
            VALUES (:name, :title, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """)
        result = db.session.execute(insert_query, {'name': name, 'title': title or None})
        youth_rep_id = result.fetchone().id
        
        # Assign districts
        if district_ids:
            for district_id in district_ids:
                try:
                    assign_query = db.text("""
                        INSERT INTO youth_rep_districts (youth_rep_id, district_id, created_at)
                        VALUES (:youth_rep_id, :district_id, CURRENT_TIMESTAMP)
                        ON CONFLICT (youth_rep_id, district_id) DO NOTHING
                    """)
                    db.session.execute(assign_query, {'youth_rep_id': youth_rep_id, 'district_id': district_id})
                except Exception as e:
                    print(f"Warning: Could not assign district {district_id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            "message": "Youth representative created successfully",
            "id": youth_rep_id
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating youth rep: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/youth-reps/<int:youth_rep_id>', methods=['PUT'])
@require_auth('editor')
def update_youth_rep(youth_rep_id):
    """Update a youth representative and their district assignments"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'youth_representatives' not in inspector.get_table_names():
            return jsonify({"error": "Youth representatives table does not exist"}), 500
        
        data = request.json
        
        # Check if rep exists
        check_query = db.text("SELECT id FROM youth_representatives WHERE id = :id")
        existing = db.session.execute(check_query, {'id': youth_rep_id}).fetchone()
        
        if not existing:
            return jsonify({"error": "Youth representative not found"}), 404
        
        # Update name and title if provided
        updates = []
        params = {'id': youth_rep_id}
        
        if 'name' in data:
            updates.append('name = :name')
            params['name'] = data['name'].strip()
        
        if 'title' in data:
            updates.append('title = :title')
            params['title'] = data['title'].strip() or None
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            update_query = db.text(f"""
                UPDATE youth_representatives 
                SET {', '.join(updates)}
                WHERE id = :id
            """)
            db.session.execute(update_query, params)
        
        # Update district assignments if provided
        if 'district_ids' in data:
            # Remove all existing assignments
            delete_query = db.text("DELETE FROM youth_rep_districts WHERE youth_rep_id = :id")
            db.session.execute(delete_query, {'id': youth_rep_id})
            
            # Add new assignments
            district_ids = data['district_ids']
            if district_ids:
                for district_id in district_ids:
                    assign_query = db.text("""
                        INSERT INTO youth_rep_districts (youth_rep_id, district_id, created_at)
                        VALUES (:youth_rep_id, :district_id, CURRENT_TIMESTAMP)
                    """)
                    db.session.execute(assign_query, {'youth_rep_id': youth_rep_id, 'district_id': district_id})
        
        db.session.commit()
        
        return jsonify({
            "message": "Youth representative updated successfully",
            "id": youth_rep_id
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating youth rep: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/youth-reps/<int:youth_rep_id>', methods=['DELETE'])
@require_auth('editor')
def delete_youth_rep(youth_rep_id):
    """Delete a youth representative (cascade will remove district assignments)"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'youth_representatives' not in inspector.get_table_names():
            return jsonify({"error": "Youth representatives table does not exist"}), 500
        
        delete_query = db.text("DELETE FROM youth_representatives WHERE id = :id")
        result = db.session.execute(delete_query, {'id': youth_rep_id})
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({"error": "Youth representative not found"}), 404
        
        return jsonify({"message": "Youth representative deleted successfully"})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting youth rep: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route('/api/districts', methods=['GET'])
def get_districts():
    """Get all districts (for use in forms)"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if 'district_boundaries' not in inspector.get_table_names():
            return jsonify([])
        
        query = db.text("""
            SELECT id, name, code
            FROM district_boundaries
            ORDER BY name
        """)
        
        result = db.session.execute(query)
        districts = [{'id': row.id, 'name': row.name, 'code': row.code} for row in result]
        
        return jsonify(districts)
    except Exception as e:
        print(f"Error fetching districts: {str(e)}")
        return jsonify([])


@app.route('/api/upload-boundaries', methods=['POST'])
@require_auth('editor')  # Require editor role or higher
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
        
        # Insert or update boundary using PostGIS
        # Transform geometry if needed, otherwise assume WGS84
        # Calculate center AFTER transformation to ensure WGS84 coordinates
        if needs_transform and source_srid:
            # Transform from source CRS to WGS84
            insert_query = text("""
                INSERT INTO district_boundaries 
                (name, code, population, area_km2, boundary, center_point)
                VALUES 
                (:name, :code, :population, :area_km2, 
                 ST_Force2D(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:boundary_geom), :source_srid), 4326))::geometry(MultiPolygon, 4326), 
                 ST_Centroid(ST_Force2D(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:boundary_geom), :source_srid), 4326))))
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
                'source_srid': source_srid
            }
        else:
            # Assume already in WGS84
            insert_query = text("""
                INSERT INTO district_boundaries 
                (name, code, population, area_km2, boundary, center_point)
                VALUES 
                (:name, :code, :population, :area_km2, 
                 ST_Force2D(ST_GeomFromGeoJSON(:boundary_geom))::geometry(MultiPolygon, 4326), 
                 ST_Centroid(ST_Force2D(ST_GeomFromGeoJSON(:boundary_geom))))
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
                'boundary_geom': geometry_json
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
    """Get all facilities within a specific district using spatial queries"""
    year = request.args.get('year', type=int, default=get_current_year())
    
    try:
        # First, get the boundary geometry for this district (case-insensitive match)
        # Also try URL-decoded name in case of encoding issues
        from urllib.parse import unquote
        decoded_name = unquote(district_name)
        
        boundary_query = db.text("""
            SELECT id, name, code, population, area_km2, boundary
            FROM district_boundaries
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(:district_name))
               OR LOWER(TRIM(name)) = LOWER(TRIM(:decoded_name))
            LIMIT 1
        """)
        
        boundary_result = db.session.execute(boundary_query, {
            'district_name': district_name,
            'decoded_name': decoded_name
        })
        boundary_row = boundary_result.fetchone()
        
        if not boundary_row:
            # Try to find similar names for better error message
            similar_query = db.text("""
                SELECT name
                FROM district_boundaries
                WHERE LOWER(name) LIKE '%' || LOWER(:district_name) || '%'
                LIMIT 5
            """)
            similar_result = db.session.execute(similar_query, {'district_name': district_name})
            similar_names = [row.name for row in similar_result]
            
            error_msg = f'District boundary "{district_name}" not found'
            if similar_names:
                error_msg += f'. Did you mean: {", ".join(similar_names)}?'
            
            print(f"District not found: {district_name} (decoded: {decoded_name})")
            return jsonify({
                'district': district_name,
                'year': year,
                'error': error_msg,
                'suggestions': similar_names,
                'statistics': {},
                'facilities': [],
                'health_platforms': []
            }), 404
        
        boundary_id = boundary_row.id
        boundary_population = boundary_row.population
        boundary_area = float(boundary_row.area_km2) if boundary_row.area_km2 else None
        
        # Get health platforms within the boundary using spatial query
        # Using ST_Contains with the actual boundary polygon (not bounding box)
        # Optimized: Use JOIN instead of CROSS JOIN, and ensure spatial index is used
        health_query = db.text("""
            SELECT 
                hp.id, 
                hp.name, 
                hp.type as category, 
                hp.youth_count, 
                hp.total_members,
                hp.address,
                hp.description,
                ST_X(hp.location) as longitude,
                ST_Y(hp.location) as latitude
            FROM health_platforms hp
            JOIN district_boundaries db ON db.id = :boundary_id
            WHERE hp.year = :year
              AND ST_Contains(db.boundary, hp.location)
            ORDER BY hp.name
        """)
        
        health_result = db.session.execute(health_query, {'boundary_id': boundary_id, 'year': year})
        health_platforms = []
        for row in health_result:
            health_platforms.append({
                'id': row.id,
                'name': row.name,
                'category': row.category,
                'type': row.category,
                'youth_count': row.youth_count,
                'total_members': row.total_members,
                'address': row.address,
                'description': row.description,
                'latitude': float(row.latitude) if row.latitude else None,
                'longitude': float(row.longitude) if row.longitude else None
            })
        
        # Get all facilities within the boundary using spatial query
        # Using ST_Contains with the actual boundary polygon (not bounding box)
        # Optimized: Use JOIN instead of CROSS JOIN for better performance
        facilities_query = db.text("""
            SELECT 
                f.id, 
                f.name, 
                f.category, 
                f.sub_type,
                f.address,
                f.description,
                f.district,
                ST_X(f.location) as longitude,
                ST_Y(f.location) as latitude
            FROM facilities f
            JOIN district_boundaries db ON db.id = :boundary_id
            WHERE f.year = :year
              AND ST_Contains(db.boundary, f.location)
            ORDER BY f.category, f.name
        """)
        
        facilities_result = db.session.execute(facilities_query, {'boundary_id': boundary_id, 'year': year})
        facilities = []
        for row in facilities_result:
            facilities.append({
                'id': row.id,
                'name': row.name,
                'category': row.category,
                'sub_type': row.sub_type,
                'address': row.address,
                'description': row.description,
                'district': row.district,
                'latitude': float(row.latitude) if row.latitude else None,
                'longitude': float(row.longitude) if row.longitude else None
            })
        
        # Calculate statistics
        category_counts = {}
        school_subtypes = {}
        clinic_subtypes = {}
        
        for facility in facilities:
            category = facility['category']
            category_counts[category] = category_counts.get(category, 0) + 1
            
            if category == 'school' and facility.get('sub_type'):
                sub_type = facility['sub_type']
                school_subtypes[sub_type] = school_subtypes.get(sub_type, 0) + 1
            
            if category == 'health' and facility.get('sub_type'):
                sub_type = facility['sub_type']
                clinic_subtypes[sub_type] = clinic_subtypes.get(sub_type, 0) + 1
        
        # Calculate total population from facilities if available
        total_population = boundary_population  # Use boundary population as base
        
        summary = {
            'district': district_name,
            'district_code': boundary_row.code,
            'year': year,
            'boundary_info': {
                'population': int(boundary_population) if boundary_population else None,
                'area_km2': boundary_area,
                'code': boundary_row.code
            },
            'health_platforms': health_platforms,
            'facilities': facilities,
            'statistics': {
                'health_platforms': len(health_platforms),
                'clinics': category_counts.get('health', 0),
                'schools': category_counts.get('school', 0),
                'churches': category_counts.get('church', 0),
                'police': category_counts.get('police', 0),
                'shops': category_counts.get('shop', 0),
                'offices': category_counts.get('office', 0),
                'school_primary': school_subtypes.get('primary', 0),
                'school_secondary': school_subtypes.get('secondary', 0),
                'school_tertiary': school_subtypes.get('tertiary', 0),
                'clinic_pharmacy': clinic_subtypes.get('pharmacy', 0),
                'clinic_hospital': clinic_subtypes.get('hospital', 0),
                'clinic_clinic': clinic_subtypes.get('clinic', 0),
                'total_facilities': len(facilities) + len(health_platforms)
            }
        }
        
        return jsonify(summary)
    except Exception as e:
        print(f"Error fetching district facilities: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/api/search', methods=['GET'])
def advanced_search():
    """Advanced search endpoint with autocomplete and filters"""
    query = request.args.get('q', '').strip()
    suburb = request.args.get('suburb', '').strip()
    facility_type = request.args.get('facility_type', '').strip()
    category = request.args.get('category', '').strip()
    min_population = request.args.get('min_population', type=int)
    max_population = request.args.get('max_population', type=int)
    year = request.args.get('year', type=int, default=get_current_year())
    limit = request.args.get('limit', type=int, default=50)
    
    try:
        results = {
            'boundaries': [],
            'health_platforms': [],
            'facilities': [],
            'suggestions': []
        }
        
        # Search boundaries/suburbs
        if query or suburb:
            boundary_query = db.text("""
                SELECT 
                    id, 
                    name, 
                    code, 
                    population, 
                    area_km2,
                    ST_X(center_point) as center_lon,
                    ST_Y(center_point) as center_lat,
                    ST_AsGeoJSON(boundary) as boundary_geojson
                FROM district_boundaries
                WHERE (:query = '' OR LOWER(name) LIKE '%' || LOWER(:query) || '%')
                  AND (:suburb = '' OR LOWER(name) = LOWER(:suburb))
                ORDER BY 
                    CASE WHEN LOWER(name) = LOWER(:query) THEN 1
                         WHEN LOWER(name) LIKE LOWER(:query) || '%' THEN 2
                         ELSE 3 END,
                    name
                LIMIT :limit
            """)
            boundary_result = db.session.execute(boundary_query, {
                'query': query if not suburb else suburb,
                'suburb': suburb,
                'limit': limit
            })
            import json
            results['boundaries'] = []
            for row in boundary_result:
                boundary_data = {
                    'id': row.id,
                    'name': row.name,
                    'code': row.code,
                    'population': int(row.population) if row.population else None,
                    'area_km2': float(row.area_km2) if row.area_km2 else None,
                    'type': 'boundary',
                    'latitude': float(row.center_lat) if row.center_lat else None,
                    'longitude': float(row.center_lon) if row.center_lon else None
                }
                # Include boundary geometry for fitting bounds
                if row.boundary_geojson:
                    try:
                        boundary_data['boundary'] = json.loads(row.boundary_geojson)
                    except:
                        pass
                results['boundaries'].append(boundary_data)
        
        # Search health platforms
        health_conditions = ["hp.year = :year"]
        health_params = {'year': year, 'limit': limit}
        
        if query:
            health_conditions.append("(LOWER(hp.name) LIKE '%' || LOWER(:query) || '%' OR LOWER(hp.type) LIKE '%' || LOWER(:query) || '%')")
            health_params['query'] = query
        
        if suburb:
            health_conditions.append("hp.district = :suburb")
            health_params['suburb'] = suburb
        
        if min_population or max_population:
            # For health platforms, use total_members as population proxy
            if min_population:
                health_conditions.append("hp.total_members >= :min_pop")
                health_params['min_pop'] = min_population
            if max_population:
                health_conditions.append("hp.total_members <= :max_pop")
                health_params['max_pop'] = max_population
        
        health_query = db.text(f"""
            SELECT hp.id, hp.name, hp.type, hp.youth_count, hp.total_members, 
                   hp.address, hp.district,
                   ST_X(hp.location) as longitude,
                   ST_Y(hp.location) as latitude
            FROM health_platforms hp
            WHERE {' AND '.join(health_conditions)}
            ORDER BY 
                CASE WHEN :query = '' THEN 1
                     WHEN LOWER(hp.name) LIKE LOWER(:query) || '%' THEN 2
                     ELSE 3 END,
                hp.name
            LIMIT :limit
        """)
        
        health_result = db.session.execute(health_query, health_params)
        results['health_platforms'] = [{
            'id': row.id,
            'name': row.name,
            'type': row.type,
            'category': 'health_platform',
            'youth_count': row.youth_count,
            'total_members': row.total_members,
            'address': row.address,
            'district': row.district,
            'latitude': float(row.latitude) if row.latitude else None,
            'longitude': float(row.longitude) if row.longitude else None
        } for row in health_result]
        
        # Search facilities
        facility_conditions = ["f.year = :year"]
        facility_params = {'year': year, 'limit': limit}
        
        if query:
            facility_conditions.append("(LOWER(f.name) LIKE '%' || LOWER(:query) || '%' OR LOWER(f.category) LIKE '%' || LOWER(:query) || '%' OR LOWER(f.sub_type) LIKE '%' || LOWER(:query) || '%')")
            facility_params['query'] = query
        
        if suburb:
            facility_conditions.append("f.district = :suburb")
            facility_params['suburb'] = suburb
        
        if category:
            facility_conditions.append("f.category = :category")
            facility_params['category'] = category
        
        if facility_type:
            facility_conditions.append("f.sub_type = :facility_type")
            facility_params['facility_type'] = facility_type
        
        facility_query = db.text(f"""
            SELECT f.id, f.name, f.category, f.sub_type, f.address, f.description, f.district,
                   ST_X(f.location) as longitude,
                   ST_Y(f.location) as latitude
            FROM facilities f
            WHERE {' AND '.join(facility_conditions)}
            ORDER BY 
                CASE WHEN :query = '' THEN 1
                     WHEN LOWER(f.name) LIKE LOWER(:query) || '%' THEN 2
                     ELSE 3 END,
                f.name
            LIMIT :limit
        """)
        
        facility_result = db.session.execute(facility_query, facility_params)
        results['facilities'] = [{
            'id': row.id,
            'name': row.name,
            'category': row.category,
            'sub_type': row.sub_type,
            'address': row.address,
            'description': row.description,
            'district': row.district,
            'latitude': float(row.latitude) if row.latitude else None,
            'longitude': float(row.longitude) if row.longitude else None
        } for row in facility_result]
        
        # Generate suggestions for autocomplete
        if query and len(query) >= 2:
            suggestions = []
            
            # Boundary suggestions
            boundary_suggestions = db.text("""
                SELECT DISTINCT name
                FROM district_boundaries
                WHERE LOWER(name) LIKE LOWER(:query) || '%'
                ORDER BY name
                LIMIT 5
            """)
            boundary_sug_result = db.session.execute(boundary_suggestions, {'query': query})
            suggestions.extend([{'text': row.name, 'type': 'suburb'} for row in boundary_sug_result])
            
            # Facility name suggestions
            facility_suggestions = db.text("""
                SELECT DISTINCT name
            FROM facilities
                WHERE LOWER(name) LIKE LOWER(:query) || '%'
                ORDER BY name
                LIMIT 5
            """)
            facility_sug_result = db.session.execute(facility_suggestions, {'query': query})
            suggestions.extend([{'text': row.name, 'type': 'facility'} for row in facility_sug_result])
            
            # Health platform suggestions
            platform_suggestions = db.text("""
                SELECT DISTINCT name
                FROM health_platforms
                WHERE LOWER(name) LIKE LOWER(:query) || '%'
                ORDER BY name
                LIMIT 5
            """)
            platform_sug_result = db.session.execute(platform_suggestions, {'query': query})
            suggestions.extend([{'text': row.name, 'type': 'health_platform'} for row in platform_sug_result])
            
            results['suggestions'] = suggestions[:10]  # Limit to 10 total suggestions
        
        # Calculate total counts
        results['total'] = len(results['boundaries']) + len(results['health_platforms']) + len(results['facilities'])
        
        return jsonify(results)
    except Exception as e:
        print(f"Error in advanced search: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/api/search/autocomplete', methods=['GET'])
def search_autocomplete():
    """Quick autocomplete endpoint for search suggestions"""
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', type=int, default=10)
    
    if len(query) < 2:
        return jsonify({'suggestions': []})
    
    try:
        suggestions = []
        
        # Boundaries
        boundary_query = db.text("""
            SELECT name, 'suburb' as type
            FROM district_boundaries
            WHERE LOWER(name) LIKE LOWER(:query) || '%'
            ORDER BY name
            LIMIT :limit
        """)
        boundary_result = db.session.execute(boundary_query, {'query': query, 'limit': limit})
        suggestions.extend([{'text': row.name, 'type': row.type} for row in boundary_result])
        
        # Facilities
        facility_query = db.text("""
            SELECT DISTINCT name, category as type
            FROM facilities
            WHERE LOWER(name) LIKE LOWER(:query) || '%'
            ORDER BY name
            LIMIT :limit
        """)
        facility_result = db.session.execute(facility_query, {'query': query, 'limit': limit})
        suggestions.extend([{'text': row.name, 'type': row.type} for row in facility_result])
        
        # Health platforms
        platform_query = db.text("""
            SELECT DISTINCT name, type
            FROM health_platforms
            WHERE LOWER(name) LIKE LOWER(:query) || '%'
            ORDER BY name
            LIMIT :limit
        """)
        platform_result = db.session.execute(platform_query, {'query': query, 'limit': limit})
        suggestions.extend([{'text': row.name, 'type': row.type} for row in platform_result])
        
        return jsonify({'suggestions': suggestions[:limit]})
    except Exception as e:
        print(f"Error in autocomplete: {str(e)}")
        return jsonify({'suggestions': []})


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
@require_auth('editor')  # Require editor role or higher
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

