import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { getApiUrl } from '../config';
import { useTheme } from '../context/ThemeContext';
import { createCustomIcon, getCategoryColor } from './FacilityIcons';
import LayerControl from './LayerControl';
import BoundaryLayer from './BoundaryLayer';
import './MapView.css';
import './BoundaryLayer.css';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLayer, setMapLayer] = useState('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const containerRef = useRef(null);
  
  // Multi-layer support
  const [facilities, setFacilities] = useState([]);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState({
    'health': true,
    'clinic': true,
    'school-primary': true,
    'school-secondary': true,
    'school-tertiary': true,
    'church': true,
    'police': true,
    'shop': true,
    'office': true,
    'boundaries': true
  });
  const [layerCounts, setLayerCounts] = useState({});
  
  // Harare center coordinates
  const center = [-17.8252, 31.0492];
  const zoom = 12;
  
  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Fetch facilities data
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const url = getApiUrl(`api/facilities?year=${selectedYear}`);
        console.log('Fetching facilities from:', url);
        const response = await axios.get(url);
        console.log('Facilities API response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setFacilities(response.data);
          
          // Calculate counts for layer control
          const counts = {
            health: response.data.filter(f => f.category === 'health').length,
            clinic: response.data.filter(f => f.category === 'clinic').length,
            schoolPrimary: response.data.filter(f => f.category === 'school' && f.sub_type === 'primary').length,
            schoolSecondary: response.data.filter(f => f.category === 'school' && f.sub_type === 'secondary').length,
            schoolTertiary: response.data.filter(f => f.category === 'school' && f.sub_type === 'tertiary').length,
            church: response.data.filter(f => f.category === 'church').length,
            police: response.data.filter(f => f.category === 'police').length,
            shop: response.data.filter(f => f.category === 'shop').length,
            office: response.data.filter(f => f.category === 'office').length
          };
          
          console.log('Facility counts by category:', counts);
          console.log('Police stations found:', response.data.filter(f => f.category === 'police'));
          setLayerCounts(counts);
        } else {
          console.warn('Facilities API returned non-array data:', response.data);
          setFacilities([]);
          setLayerCounts({});
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        console.error('Error details:', error.response?.data || error.message);
        setFacilities([]);
        setLayerCounts({});
      }
    };
    
    fetchFacilities();
  }, [selectedYear]);
  
  // Toggle layer visibility
  const handleToggleLayer = (layerId, visible) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: visible !== undefined ? visible : !prev[layerId]
    }));
  };
  
  // Map layer configurations
  const mapLayers = {
    street: {
      dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | CartoDB'
      },
      light: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | CartoDB'
      }
    },
    satellite: {
      dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery'
      },
      light: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery'
      }
    },
    terrain: {
      dark: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
      },
      light: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
      }
    },
    hybrid: {
      dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
        overlay: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      },
      light: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
        overlay: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
      }
    }
  };
  
  // Get current tile configuration
  const getCurrentTileConfig = () => {
    return mapLayers[mapLayer][theme];
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
    <div className={`map-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-map"
        ref={mapRef}
      >
        <TileLayer
          attribution={getCurrentTileConfig().attribution}
          url={getCurrentTileConfig().url}
          key={`${mapLayer}-${theme}`}
        />
        
        {/* Overlay for hybrid mode */}
        {mapLayer === 'hybrid' && getCurrentTileConfig().overlay && (
          <TileLayer
            url={getCurrentTileConfig().overlay}
            key={`overlay-${theme}`}
          />
        )}
        
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
                  {props.district && (
                    <p className="popup-district">📍 District: {props.district}</p>
                  )}
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
                  {props.description && (
                    <div className="popup-description">
                      <strong>Description:</strong>
                      <p>{props.description}</p>
                    </div>
                  )}
                </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            <MapUpdater selectedFeature={selectedFeature} />
          </>
        )}
        
        {/* Facility Markers */}
        {facilities.map((facility, idx) => {
          const layerId = facility.category === 'school' 
            ? `school-${facility.sub_type}` 
            : facility.category;
          
          if (!visibleLayers[layerId]) {
            if (facility.category === 'police') {
              console.log('Police station hidden by layer visibility:', facility.name, 'layerId:', layerId, 'visibleLayers:', visibleLayers);
            }
            return null;
          }
          
          const lat = facility.location?.coordinates?.[1] || facility.latitude;
          const lon = facility.location?.coordinates?.[0] || facility.longitude;
          
          if (!lat || !lon) {
            if (facility.category === 'police') {
              console.warn('Police station missing coordinates:', facility.name, 'location:', facility.location, 'lat:', facility.latitude, 'lon:', facility.longitude);
            }
            return null;
          }
          
          if (facility.category === 'police') {
            console.log('Rendering police station:', facility.name, 'at', lat, lon);
          }
          
          const color = getCategoryColor(facility.category, facility.sub_type);
          const icon = createCustomIcon(facility.category, facility.sub_type, color, 'medium');
          
          return (
            <Marker
              key={`facility-${idx}`}
              position={[lat, lon]}
              icon={icon}
            >
              <Popup>
                <div className="popup-content">
                  <h3>{facility.name}</h3>
                  <p className="popup-type">
                    {facility.category === 'school' 
                      ? `${facility.sub_type} School` 
                      : facility.category}
                  </p>
                  {facility.address && (
                    <p className="popup-address">📍 {facility.address}</p>
                  )}
                  {facility.additional_info && (
                    <div className="popup-stats">
                      {Object.entries(facility.additional_info).map(([key, value]) => (
                        <div key={key} className="popup-stat">
                          <span className="stat-label">{key}</span>
                          <span className="stat-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* District Boundaries */}
        {visibleLayers['boundaries'] && (
          <BoundaryLayer selectedYear={selectedYear} />
        )}
      </MapContainer>
      
      {/* Layer Control Panel */}
      <LayerControl 
        visibleLayers={visibleLayers}
        onToggleLayer={handleToggleLayer}
        layerCounts={layerCounts}
      />
      
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

      {/* Layer Switcher */}
      <div className="layer-switcher">
        <button 
          className="layer-button"
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          title="Change map layer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </button>
        
        {showLayerMenu && (
          <div className="layer-menu">
            <h4>Map Layers</h4>
            <button 
              className={`layer-option ${mapLayer === 'street' ? 'active' : ''}`}
              onClick={() => { setMapLayer('street'); setShowLayerMenu(false); }}
            >
              <div className="layer-preview street-preview"></div>
              <span>Street</span>
            </button>
            <button 
              className={`layer-option ${mapLayer === 'satellite' ? 'active' : ''}`}
              onClick={() => { setMapLayer('satellite'); setShowLayerMenu(false); }}
            >
              <div className="layer-preview satellite-preview"></div>
              <span>Satellite</span>
            </button>
            <button 
              className={`layer-option ${mapLayer === 'terrain' ? 'active' : ''}`}
              onClick={() => { setMapLayer('terrain'); setShowLayerMenu(false); }}
            >
              <div className="layer-preview terrain-preview"></div>
              <span>Terrain</span>
            </button>
            <button 
              className={`layer-option ${mapLayer === 'hybrid' ? 'active' : ''}`}
              onClick={() => { setMapLayer('hybrid'); setShowLayerMenu(false); }}
            >
              <div className="layer-preview hybrid-preview"></div>
              <span>Hybrid</span>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Toggle Button */}
      <button 
        className="fullscreen-toggle"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default MapView;

