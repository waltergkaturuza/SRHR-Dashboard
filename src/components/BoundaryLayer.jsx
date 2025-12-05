import React, { useEffect, useState } from 'react';
import { Polygon, Popup, Tooltip } from 'react-leaflet';
import axios from 'axios';
import { getApiUrl } from '../config';

const BoundaryLayer = ({ selectedYear, onDistrictClick, selectedFeature }) => {
  const [boundaries, setBoundaries] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtFacilities, setDistrictFacilities] = useState(null);

  // Update selected district when selectedFeature changes (from sidebar search)
  useEffect(() => {
    if (selectedFeature && selectedFeature.properties) {
      const props = selectedFeature.properties;
      if (props.isBoundary || props.resultType === 'boundary' || props.type === 'boundary') {
        setSelectedDistrict(props.boundaryName || props.name);
        // Trigger district click to load facilities
        const boundary = boundaries.find(b => b.name === (props.boundaryName || props.name));
        if (boundary) {
          handleDistrictClick(boundary);
        }
      }
    }
  }, [selectedFeature, boundaries]);

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
    setDistrictFacilities(null); // Clear previous data while loading
    
    try {
      // URL encode the district name to handle spaces and special characters
      const encodedName = encodeURIComponent(boundary.name);
      const response = await axios.get(
        getApiUrl(`api/district/${encodedName}/facilities?year=${selectedYear}`),
        { timeout: 30000 } // 30 second timeout
      );
      setDistrictFacilities(response.data);
      if (onDistrictClick) {
        onDistrictClick(boundary, response.data);
      }
    } catch (error) {
      console.error('Error fetching district facilities:', error);
      if (error.response?.status === 404) {
        // District not found - show error in popup
        setDistrictFacilities({
          district: boundary.name,
          year: selectedYear,
          error: error.response?.data?.error || 'District not found',
          suggestions: error.response?.data?.suggestions || [],
          statistics: {},
          facilities: [],
          health_platforms: []
        });
      } else {
        // Other error - show loading error
        setDistrictFacilities({
          district: boundary.name,
          year: selectedYear,
          error: 'Failed to load facilities. Please try again.',
          statistics: {},
          facilities: [],
          health_platforms: []
        });
      }
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
                      <p><strong>Population:</strong> {
                        (districtFacilities?.boundary_info?.population || boundary.population)?.toLocaleString() || 'N/A'
                      }</p>
                      <p><strong>Area:</strong> {
                        (districtFacilities?.boundary_info?.area_km2 || boundary.area_km2)?.toFixed(2) || 'N/A'
                      } km²</p>
                </div>

                {districtFacilities && districtFacilities.district === boundary.name && (
                  <div className="district-facilities">
                        <h4>Facilities Statistics ({districtFacilities.year || selectedYear}):</h4>
                        
                        {districtFacilities.statistics && (
                          <div className="facility-statistics">
                            {/* Health Platforms */}
                            <div className="stat-category">
                              <div className="stat-header">
                                <span className="stat-icon">🏥</span>
                                <span className="stat-title">Health Platforms</span>
                                <span className="stat-count">{districtFacilities.statistics.health_platforms || 0}</span>
                              </div>
                      </div>
                      
                            {/* Health Clinics */}
                            {(districtFacilities.statistics.clinics > 0 || districtFacilities.statistics.clinic_pharmacy > 0 || 
                              districtFacilities.statistics.clinic_hospital > 0 || districtFacilities.statistics.clinic_clinic > 0) && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">🏥</span>
                                  <span className="stat-title">Health Clinics</span>
                                  <span className="stat-count">{districtFacilities.statistics.clinics || 0}</span>
                                </div>
                                {(districtFacilities.statistics.clinic_pharmacy > 0 || 
                                  districtFacilities.statistics.clinic_hospital > 0 || 
                                  districtFacilities.statistics.clinic_clinic > 0) && (
                                  <div className="stat-subitems">
                                    {districtFacilities.statistics.clinic_clinic > 0 && (
                                      <div className="stat-subitem">
                                        <span>Clinics:</span>
                                        <span>{districtFacilities.statistics.clinic_clinic}</span>
                                      </div>
                                    )}
                                    {districtFacilities.statistics.clinic_hospital > 0 && (
                                      <div className="stat-subitem">
                                        <span>Hospitals:</span>
                                        <span>{districtFacilities.statistics.clinic_hospital}</span>
                                      </div>
                                    )}
                                    {districtFacilities.statistics.clinic_pharmacy > 0 && (
                                      <div className="stat-subitem">
                                        <span>Pharmacies:</span>
                                        <span>{districtFacilities.statistics.clinic_pharmacy}</span>
                                      </div>
                                    )}
                        </div>
                                )}
                    </div>
                            )}

                            {/* Schools */}
                            {districtFacilities.statistics.schools > 0 && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">🎓</span>
                                  <span className="stat-title">Schools</span>
                                  <span className="stat-count">{districtFacilities.statistics.schools || 0}</span>
                                </div>
                                {(districtFacilities.statistics.school_primary > 0 || 
                                  districtFacilities.statistics.school_secondary > 0 || 
                                  districtFacilities.statistics.school_tertiary > 0) && (
                                  <div className="stat-subitems">
                                    {districtFacilities.statistics.school_primary > 0 && (
                                      <div className="stat-subitem">
                                        <span>Primary:</span>
                                        <span>{districtFacilities.statistics.school_primary}</span>
                                      </div>
                                    )}
                                    {districtFacilities.statistics.school_secondary > 0 && (
                                      <div className="stat-subitem">
                                        <span>Secondary:</span>
                                        <span>{districtFacilities.statistics.school_secondary}</span>
                                      </div>
                                    )}
                                    {districtFacilities.statistics.school_tertiary > 0 && (
                                      <div className="stat-subitem">
                                        <span>Tertiary:</span>
                                        <span>{districtFacilities.statistics.school_tertiary}</span>
                      </div>
                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Churches */}
                            {districtFacilities.statistics.churches > 0 && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">⛪</span>
                                  <span className="stat-title">Churches</span>
                                  <span className="stat-count">{districtFacilities.statistics.churches || 0}</span>
                                </div>
                              </div>
                            )}

                            {/* Police Stations */}
                            {districtFacilities.statistics.police > 0 && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">🚔</span>
                                  <span className="stat-title">Police Stations</span>
                                  <span className="stat-count">{districtFacilities.statistics.police || 0}</span>
                                </div>
                              </div>
                            )}

                            {/* Shops */}
                            {districtFacilities.statistics.shops > 0 && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">🏪</span>
                                  <span className="stat-title">Shops</span>
                                  <span className="stat-count">{districtFacilities.statistics.shops || 0}</span>
                                </div>
                              </div>
                            )}

                            {/* Offices */}
                            {districtFacilities.statistics.offices > 0 && (
                              <div className="stat-category">
                                <div className="stat-header">
                                  <span className="stat-icon">🏢</span>
                                  <span className="stat-title">Offices</span>
                                  <span className="stat-count">{districtFacilities.statistics.offices || 0}</span>
                                </div>
                              </div>
                            )}

                            {/* Total Summary */}
                            <div className="stat-total">
                              <span className="total-label">Total Facilities:</span>
                              <span className="total-value">{districtFacilities.statistics.total_facilities || 0}</span>
                            </div>
                          </div>
                        )}

                        {/* Individual Facility Lists */}
                        {districtFacilities.facilities && districtFacilities.facilities.length > 0 && (
                          <div className="facility-details">
                            <h5>Facility Details:</h5>
                            
                            {/* Health Platforms List */}
                            {districtFacilities.health_platforms && districtFacilities.health_platforms.length > 0 && (
                              <div className="facility-group">
                                <strong className="facility-group-title">🏥 Health Platforms ({districtFacilities.health_platforms.length}):</strong>
                                <ul className="facility-list-detailed">
                                  {districtFacilities.health_platforms.map((hp) => (
                                    <li key={hp.id} className="facility-item">
                                      <div className="facility-name">{hp.name}</div>
                                      <div className="facility-meta">
                                        <span className="facility-type">{hp.type || hp.category}</span>
                                        {hp.youth_count !== null && hp.total_members !== null && (
                                          <span className="facility-stats">
                                            {hp.youth_count}/{hp.total_members} youth
                                          </span>
                                        )}
                                      </div>
                                      {hp.address && <div className="facility-address">{hp.address}</div>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Facilities by Category */}
                            {['health', 'school', 'church', 'police', 'shop', 'office'].map(category => {
                              const categoryFacilities = districtFacilities.facilities.filter(f => f.category === category);
                              if (categoryFacilities.length === 0) return null;
                              
                              const categoryIcons = {
                                'health': '🏥',
                                'school': '🎓',
                                'church': '⛪',
                                'police': '🚔',
                                'shop': '🏪',
                                'office': '🏢'
                              };
                              
                              const categoryLabels = {
                                'health': 'Health Clinics',
                                'school': 'Schools',
                                'church': 'Churches',
                                'police': 'Police Stations',
                                'shop': 'Shops',
                                'office': 'Offices'
                              };
                              
                              return (
                                <div key={category} className="facility-group">
                                  <strong className="facility-group-title">
                                    {categoryIcons[category]} {categoryLabels[category]} ({categoryFacilities.length}):
                                  </strong>
                                  <ul className="facility-list-detailed">
                                    {categoryFacilities.map((facility) => (
                                      <li key={facility.id} className="facility-item">
                                        <div className="facility-name">{facility.name}</div>
                                        <div className="facility-meta">
                                          {facility.sub_type && (
                                            <span className="facility-type">
                                              {facility.sub_type.charAt(0).toUpperCase() + facility.sub_type.slice(1)}
                                            </span>
                                          )}
                                        </div>
                                        {facility.address && (
                                          <div className="facility-address">{facility.address}</div>
                                        )}
                                        {facility.description && (
                                          <div className="facility-description">{facility.description}</div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(!districtFacilities.statistics || districtFacilities.statistics.total_facilities === 0) && (
                          <div className="no-facilities">
                            <p>No facilities found in this district for {districtFacilities.year || selectedYear}.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(!districtFacilities || districtFacilities.district !== boundary.name) && (
                      <div className="loading-facilities">
                        <p>Loading facilities...</p>
                      </div>
                    )}

                    {districtFacilities && districtFacilities.district === boundary.name && districtFacilities.error && (
                      <div className="facility-error">
                        <p className="error-message">{districtFacilities.error}</p>
                        {districtFacilities.suggestions && districtFacilities.suggestions.length > 0 && (
                          <div className="error-suggestions">
                            <p>Did you mean:</p>
                            <ul>
                              {districtFacilities.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
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




