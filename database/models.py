from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from datetime import datetime
from sqlalchemy import func

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
                "address": self.address
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

