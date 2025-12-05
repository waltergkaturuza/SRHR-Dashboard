import React, { useEffect, useState } from 'react';
import { Polygon, Popup, Tooltip } from 'react-leaflet';
import axios from 'axios';
import { getApiUrl } from '../config';

const BoundaryLayer = ({ selectedYear, onDistrictClick }) => {
  const [boundaries, setBoundaries] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtFacilities, setDistrictFacilities] = useState(null);

  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const response = await axios.get(getApiUrl('api/boundaries'));
        if (response.data && Array.isArray(response.data)) {
          setBoundaries(response.data);
        }
      } catch (error) {
        console.error('Error fetching boundaries:', error);
      }
    };

    fetchBoundaries();
  }, []);

  const handleDistrictClick = async (boundary) => {
    setSelectedDistrict(boundary.name);
    
    try {
      const response = await axios.get(
        getApiUrl(`api/district/${boundary.name}/facilities?year=${selectedYear}`)
      );
      setDistrictFacilities(response.data);
      if (onDistrictClick) {
        onDistrictClick(boundary, response.data);
      }
    } catch (error) {
      console.error('Error fetching district facilities:', error);
    }
  };

  return (
    <>
      {boundaries.map((boundary) => {
        if (!boundary.boundary || !boundary.boundary.coordinates) return null;

        const geometryType = boundary.boundary.type;
        const isSelected = selectedDistrict === boundary.name;

        // Handle both Polygon and MultiPolygon geometries
        let polygonPositions = [];
        
        if (geometryType === 'Polygon') {
          // Single polygon: coordinates is an array of rings
          polygonPositions = [boundary.boundary.coordinates[0].map(ring => 
            ring.map(coord => [coord[1], coord[0]]) // [lat, lng]
          )];
        } else if (geometryType === 'MultiPolygon') {
          // MultiPolygon: coordinates is an array of polygons, each polygon has rings
          polygonPositions = boundary.boundary.coordinates.map(polygon => 
            polygon[0].map(ring => 
              ring.map(coord => [coord[1], coord[0]]) // [lat, lng]
            )
          );
        } else {
          console.warn(`Unsupported geometry type: ${geometryType} for boundary ${boundary.name}`);
          return null;
        }

        // Skip if no valid positions found
        if (!polygonPositions || polygonPositions.length === 0) {
          return null;
        }

        // Render each polygon (for MultiPolygon, render multiple Polygon components)
        // Popup and Tooltip only on the first polygon
        return polygonPositions.map((positions, polyIndex) => {
          if (!positions || positions.length === 0) return null;
          
          return (
            <Polygon
              key={`${boundary.id}-${polyIndex}`}
              positions={positions}
            pathOptions={{
              color: isSelected ? '#00d4ff' : '#ffeb3b',
              weight: isSelected ? 3 : 2,
              fillColor: isSelected ? '#00d4ff' : '#ffeb3b',
              fillOpacity: isSelected ? 0.2 : 0.1,
              dashArray: isSelected ? '' : '5, 5'
            }}
            eventHandlers={{
              click: () => handleDistrictClick(boundary),
              mouseover: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.3,
                  weight: 3
                });
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillOpacity: isSelected ? 0.2 : 0.1,
                  weight: isSelected ? 3 : 2
                });
              }
            }}
          >
            {polyIndex === 0 && (
              <>
                <Tooltip permanent={isSelected} direction="center" className="district-tooltip">
                  <strong>{boundary.name}</strong>
                </Tooltip>
                
                <Popup>
                  <div className="district-popup">
                    <h3>{boundary.name}</h3>
                    <div className="district-info">
                      {boundary.code && <p><strong>Code:</strong> {boundary.code}</p>}
                      <p><strong>Population:</strong> {boundary.population?.toLocaleString() || 'N/A'}</p>
                      {boundary.area_km2 && <p><strong>Area:</strong> {boundary.area_km2} km²</p>}
                    </div>

                    {districtFacilities && districtFacilities.district === boundary.name && (
                      <div className="district-facilities">
                        <h4>Facilities in this District:</h4>
                        
                        <div className="facility-summary">
                          <div className="summary-item">
                            <span className="summary-label">🏥 Health Platforms:</span>
                            <span className="summary-value">{districtFacilities.health_platforms?.length || 0}</span>
                          </div>
                          
                          {Object.entries(districtFacilities.counts || {}).map(([key, count]) => (
                            <div key={key} className="summary-item">
                              <span className="summary-label">
                                {key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                              </span>
                              <span className="summary-value">{count}</span>
                            </div>
                          ))}
                        </div>

                        {districtFacilities.health_platforms && districtFacilities.health_platforms.length > 0 && (
                          <div className="facility-list">
                            <strong>Health Platforms:</strong>
                            <ul>
                              {districtFacilities.health_platforms.slice(0, 5).map((hp, idx) => (
                                <li key={idx}>{hp.name} ({hp.category})</li>
                              ))}
                              {districtFacilities.health_platforms.length > 5 && (
                                <li><em>... and {districtFacilities.health_platforms.length - 5} more</em></li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </>
            )}
            </Polygon>
          );
        });
      }).flat().filter(Boolean)}
    </>
  );
};

export default BoundaryLayer;




