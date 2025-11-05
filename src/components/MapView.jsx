import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import './MapView.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to update map view when selected feature changes
function MapUpdater({ selectedFeature }) {
  const map = useMap();

  useEffect(() => {
    if (selectedFeature && selectedFeature.geometry) {
      const coords = selectedFeature.geometry.coordinates;
      map.setView([coords[1], coords[0]], 13, { animate: true });
    }
  }, [selectedFeature, map]);

  return null;
}

const MapView = ({ geospatialData, selectedYear, onFeatureClick, selectedFeature, loading }) => {
  const mapRef = useRef();
  const { theme } = useTheme();
  
  // Harare center coordinates
  const center = [-17.8252, 31.0492];
  const zoom = 12;
  
  // Map tile URLs for different themes
  const tileUrls = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  };

  // Color coding for different types
  const getColorForType = (type) => {
    const colors = {
      'District Office': '#ff4444',
      'Community Health Committee': '#ff9800',
      'Health Forum': '#4caf50',
      'Youth Committee': '#00d4ff',
      'Clinic Committee': '#9c27b0',
      'Community Platform': '#ffeb3b',
      'SRHR Forum': '#e91e63',
      'Advisory Board': '#3f51b5',
    };
    return colors[type] || '#00d4ff';
  };

  const getRadiusForYouthCount = (youthCount) => {
    // Scale radius based on youth count (min 8, max 20)
    return Math.min(Math.max(youthCount / 3, 8), 20);
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    
    layer.on({
      click: () => {
        onFeatureClick(feature);
      },
      mouseover: (e) => {
        e.target.setStyle({
          fillOpacity: 0.9,
        });
      },
      mouseout: (e) => {
        const isSelected = selectedFeature && selectedFeature.properties.id === props.id;
        e.target.setStyle({
          fillOpacity: isSelected ? 0.9 : 0.7,
        });
      }
    });
  };

  const pointToLayer = (feature, latlng) => {
    const props = feature.properties;
    const isSelected = selectedFeature && selectedFeature.properties.id === props.id;
    
    return L.circleMarker(latlng, {
      radius: getRadiusForYouthCount(props.youth_count || 0),
      fillColor: getColorForType(props.type),
      color: '#ffffff',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillOpacity: isSelected ? 0.9 : 0.7,
    });
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-map"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrls[theme]}
          key={theme}
        />
        
        {geospatialData && geospatialData.features && (
          <>
            {geospatialData.features.map((feature, idx) => {
              const coords = feature.geometry.coordinates;
              const props = feature.properties;
              const isSelected = selectedFeature && selectedFeature.properties.id === props.id;
              
              return (
                <CircleMarker
                  key={idx}
                  center={[coords[1], coords[0]]}
                  radius={getRadiusForYouthCount(props.youth_count || 0)}
                  pathOptions={{
                    fillColor: getColorForType(props.type),
                    color: '#ffffff',
                    weight: isSelected ? 3 : 2,
                    opacity: 1,
                    fillOpacity: isSelected ? 0.9 : 0.7,
                  }}
                  eventHandlers={{
                    click: () => onFeatureClick(feature),
                    mouseover: (e) => {
                      e.target.setStyle({ fillOpacity: 0.9 });
                    },
                    mouseout: (e) => {
                      e.target.setStyle({ 
                        fillOpacity: isSelected ? 0.9 : 0.7 
                      });
                    }
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3>{props.name}</h3>
                      <p className="popup-type">{props.type}</p>
                      <div className="popup-stats">
                        <div className="popup-stat">
                          <span className="stat-label">Youth (≤24 years)</span>
                          <span className="stat-value">{props.youth_count || 0}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="stat-label">Total Members</span>
                          <span className="stat-value">{props.total_members || 0}</span>
                        </div>
                        <div className="popup-stat">
                          <span className="stat-label">Youth Percentage</span>
                          <span className="stat-value">
                            {props.total_members ? 
                              Math.round((props.youth_count / props.total_members) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      {props.address && (
                        <p className="popup-address">📍 {props.address}</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            <MapUpdater selectedFeature={selectedFeature} />
          </>
        )}
      </MapContainer>
      
      <div className="map-legend">
        <h4>Health Decision-Making Platforms</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-circle" style={{ backgroundColor: '#ff4444' }}></div>
            <span>District Office</span>
          </div>
          <div className="legend-item">
            <div className="legend-circle" style={{ backgroundColor: '#00d4ff' }}></div>
            <span>Youth Committee</span>
          </div>
          <div className="legend-item">
            <div className="legend-circle" style={{ backgroundColor: '#4caf50' }}></div>
            <span>Health Forum</span>
          </div>
          <div className="legend-item">
            <div className="legend-circle" style={{ backgroundColor: '#ff9800' }}></div>
            <span>Community Committee</span>
          </div>
        </div>
        <p className="legend-note">Circle size represents number of youth participants</p>
      </div>

      <div className="map-info">
        <p>Last update: <span className="update-time">8 seconds ago</span></p>
      </div>
    </div>
  );
};

export default MapView;

