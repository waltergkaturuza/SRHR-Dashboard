from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from datetime import datetime
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class HealthPlatform(db.Model):
    """Health Decision-Making Platform Model"""
    __tablename__ = 'health_platforms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    youth_count = db.Column(db.Integer, nullable=False, default=0)
    total_members = db.Column(db.Integer, nullable=False, default=0)
    year = db.Column(db.Integer, nullable=False)
    address = db.Column(db.Text)
    description = db.Column(db.Text)
    district = db.Column(db.String(100))
    location = db.Column(Geometry('POINT', srid=4326), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_geojson_feature(self):
        """Convert to GeoJSON feature"""
        # Extract coordinates from PostGIS geometry
        coords = db.session.scalar(func.ST_AsGeoJSON(self.location))
        import json
        geometry = json.loads(coords)
        
        return {
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "id": self.id,
                "name": self.name,
                "type": self.type,
                "youth_count": self.youth_count,
                "total_members": self.total_members,
                "year": self.year,
                "address": self.address,
                "description": self.description,
                "district": self.district
            }
        }
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "youth_count": self.youth_count,
            "total_members": self.total_members,
            "year": self.year,
            "address": self.address,
            "description": self.description,
            "district": self.district,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_available_years():
        """Get all years that have data"""
        years = db.session.query(HealthPlatform.year).distinct().order_by(HealthPlatform.year).all()
        return [year[0] for year in years]
    
    @staticmethod
    def get_statistics_by_year(year):
        """Get aggregated statistics for a specific year"""
        result = db.session.query(
            func.count(HealthPlatform.id).label('total_committees'),
            func.sum(HealthPlatform.youth_count).label('total_youth'),
            func.sum(HealthPlatform.total_members).label('total_members'),
            func.avg(HealthPlatform.youth_count).label('avg_youth_per_committee')
        ).filter(HealthPlatform.year == year).first()
        
        if not result or result.total_youth is None:
            return None
        
        youth_percentage = (result.total_youth / result.total_members * 100) if result.total_members > 0 else 0
        
        return {
            "year": year,
            "total_youth": int(result.total_youth),
            "total_members": int(result.total_members),
            "total_committees": int(result.total_committees),
            "youth_percentage": round(youth_percentage, 1),
            "average_youth_per_committee": round(result.avg_youth_per_committee, 1)
        }
    
    def __repr__(self):
        return f'<HealthPlatform {self.name} ({self.year})>'


class TrendData(db.Model):
    """Trend Data Model for aggregate statistics"""
    __tablename__ = 'trend_data'
    
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, unique=True, nullable=False)
    youth_count = db.Column(db.Integer, nullable=False, default=0)
    total_count = db.Column(db.Integer, nullable=False, default=0)
    committees = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "year": self.year,
            "youth_count": self.youth_count,
            "total_count": self.total_count,
            "committees": self.committees
        }
    
    @staticmethod
    def get_all_trends():
        """Get all trend data ordered by year"""
        trends = TrendData.query.order_by(TrendData.year).all()
        return [trend.to_dict() for trend in trends]
    
    @staticmethod
    def update_trends():
        """Recalculate trend data from health_platforms table"""
        # Delete existing trends
        TrendData.query.delete()
        
        # Aggregate data by year
        results = db.session.query(
            HealthPlatform.year,
            func.sum(HealthPlatform.youth_count).label('youth_count'),
            func.sum(HealthPlatform.total_members).label('total_count'),
            func.count(HealthPlatform.id).label('committees')
        ).group_by(HealthPlatform.year).all()
        
        # Insert new trend data
        for result in results:
            trend = TrendData(
                year=result.year,
                youth_count=int(result.youth_count),
                total_count=int(result.total_count),
                committees=int(result.committees)
            )
            db.session.add(trend)
        
        db.session.commit()
    
    def __repr__(self):
        return f'<TrendData {self.year}>'


class User(db.Model):
    """User Model for Authentication and Authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')  # admin, editor, viewer
    full_name = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary (without password)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }
    
    def has_role(self, required_role):
        """Check if user has required role or higher"""
        role_hierarchy = {'viewer': 1, 'editor': 2, 'admin': 3}
        user_level = role_hierarchy.get(self.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        return user_level >= required_level
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


class DistrictBoundary(db.Model):
    """District Boundary Model with Youth Representative Information"""
    __tablename__ = 'district_boundaries'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    code = db.Column(db.String(20))
    population = db.Column(db.Integer)
    area_km2 = db.Column(db.Numeric(10, 2))
    boundary = db.Column(Geometry('MultiPolygon', srid=4326), nullable=False)
    center_point = db.Column(Geometry('Point', srid=4326))
    
    # Youth Representative Information
    youth_rep_name = db.Column(db.String(200))
    youth_rep_title = db.Column(db.String(200))
    
    # Health Platforms (stored as JSON array)
    health_platforms = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_geojson_feature(self):
        """Convert to GeoJSON feature"""
        # Extract coordinates from PostGIS geometry
        boundary_coords = db.session.scalar(func.ST_AsGeoJSON(self.boundary))
        center_coords = db.session.scalar(func.ST_AsGeoJSON(self.center_point)) if self.center_point else None
        
        import json
        boundary_geom = json.loads(boundary_coords)
        center_geom = json.loads(center_coords) if center_coords else None
        
        return {
            "type": "Feature",
            "geometry": boundary_geom,
            "properties": {
                "id": self.id,
                "name": self.name,
                "code": self.code,
                "population": self.population,
                "area_km2": float(self.area_km2) if self.area_km2 else None,
                "center": center_geom,
                "youth_rep_name": self.youth_rep_name,
                "youth_rep_title": self.youth_rep_title,
                "health_platforms": self.health_platforms or []
            }
        }
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "population": self.population,
            "area_km2": float(self.area_km2) if self.area_km2 else None,
            "youth_rep_name": self.youth_rep_name,
            "youth_rep_title": self.youth_rep_title,
            "health_platforms": self.health_platforms or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<DistrictBoundary {self.name}>'

