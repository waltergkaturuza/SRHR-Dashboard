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
          console.log(`BoundaryLayer: Fetched ${response.data.length} boundaries`);
          console.log('Sample boundary:', response.data[0]);
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
        if (!boundary.boundary || !boundary.boundary.coordinates) {
          console.warn(`BoundaryLayer: Skipping ${boundary?.name || 'unknown'} - missing boundary or coordinates`);
          return null;
        }

        const geometryType = boundary.boundary.type;
        const isSelected = selectedDistrict === boundary.name;

        // Handle both Polygon and MultiPolygon geometries
        let polygonPositions = [];
        
        try {
          if (geometryType === 'Polygon') {
            // Single polygon: coordinates is an array of rings
            // Leaflet Polygon expects: [[[lat, lng], [lat, lng], ...]] for outer ring
            // Additional rings are holes: [[[lat, lng], ...], [[lat, lng], ...]]
            if (boundary.boundary.coordinates && Array.isArray(boundary.boundary.coordinates[0])) {
              const rings = boundary.boundary.coordinates.map(ring => {
                if (!Array.isArray(ring)) return null;
                const coords = ring
                  .filter(coord => Array.isArray(coord) && coord.length >= 2)
                  .map(coord => {
                    const lon = coord[0];
                    const lat = coord[1];
                    // Validate coordinates are numbers
                    if (typeof lon === 'number' && typeof lat === 'number' && 
                        !isNaN(lon) && !isNaN(lat) &&
                        lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
                      return [lat, lon]; // [lat, lng] for Leaflet
                    }
                    // Log invalid coordinates for debugging
                    if (typeof lon === 'number' && typeof lat === 'number') {
                      console.warn(`BoundaryLayer: Invalid coordinates for ${boundary.name}: lon=${lon}, lat=${lat} (outside WGS84 range)`);
                    }
                    return null;
                  })
                  .filter(Boolean);
                return coords.length > 0 ? coords : null;
              }).filter(Boolean);
              
              if (rings.length > 0 && rings[0].length > 0) {
                polygonPositions = [rings]; // Wrap in array for Polygon component
              }
            }
          } else if (geometryType === 'MultiPolygon') {
            // MultiPolygon: coordinates is an array of polygons, each polygon has rings
            // Leaflet Polygon expects each polygon as: [[[lat, lng], [lat, lng], ...]]
            polygonPositions = boundary.boundary.coordinates
              .filter(polygon => Array.isArray(polygon) && polygon[0] && Array.isArray(polygon[0]))
              .map(polygon => {
                const rings = polygon
                  .filter(ring => Array.isArray(ring))
                  .map(ring => {
                    if (!Array.isArray(ring)) return null;
                    const coords = ring
                      .filter(coord => Array.isArray(coord) && coord.length >= 2)
                      .map(coord => {
                        const lon = coord[0];
                        const lat = coord[1];
                        // Validate coordinates are numbers
                        if (typeof lon === 'number' && typeof lat === 'number' && 
                            !isNaN(lon) && !isNaN(lat) &&
                            lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
                          return [lat, lon]; // [lat, lng] for Leaflet
                        }
                        return null;
                      })
                      .filter(Boolean);
                    return coords.length > 0 ? coords : null;
                  })
                  .filter(Boolean);
                return rings.length > 0 && rings[0].length > 0 ? rings : null;
              })
              .filter(Boolean);
          } else {
            console.warn(`BoundaryLayer: Unsupported geometry type: ${geometryType} for boundary ${boundary.name}`);
            return null;
          }
        } catch (error) {
          console.error(`BoundaryLayer: Error processing boundary ${boundary.name}:`, error);
          console.error('Boundary data:', boundary);
          return null;
        }

        // Skip if no valid positions found
        if (!polygonPositions || polygonPositions.length === 0) {
          console.warn(`BoundaryLayer: Skipping ${boundary.name} - no valid polygon positions after processing`);
          return null;
        }

        // Render each polygon (for MultiPolygon, render multiple Polygon components)
        // Popup and Tooltip only on the first polygon
        return polygonPositions.map((positions, polyIndex) => {
          // Validate positions structure
          if (!positions || !Array.isArray(positions) || positions.length === 0) {
            return null;
          }
          
          // Ensure first ring (outer boundary) exists and has valid coordinates
          const outerRing = positions[0];
          if (!outerRing || !Array.isArray(outerRing) || outerRing.length < 3) {
            // Need at least 3 points for a valid polygon
            return null;
          }
          
          // Validate all coordinates in outer ring
          const validOuterRing = outerRing.filter(coord => 
            Array.isArray(coord) && 
            coord.length === 2 && 
            typeof coord[0] === 'number' && 
            typeof coord[1] === 'number' &&
            !isNaN(coord[0]) && !isNaN(coord[1])
          );
          
          if (validOuterRing.length < 3) {
            return null;
          }
          
          // Reconstruct positions with validated outer ring
          const validatedPositions = [validOuterRing];
          // Add holes if they exist and are valid
          if (positions.length > 1) {
            const holes = positions.slice(1)
              .filter(hole => Array.isArray(hole) && hole.length >= 3)
              .map(hole => hole.filter(coord => 
                Array.isArray(coord) && 
                coord.length === 2 && 
                typeof coord[0] === 'number' && 
                typeof coord[1] === 'number' &&
                !isNaN(coord[0]) && !isNaN(coord[1])
              ))
              .filter(hole => hole.length >= 3);
            validatedPositions.push(...holes);
          }
          
          return (
            <Polygon
              key={`${boundary.id}-${polyIndex}`}
              positions={validatedPositions}
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




