import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDashboardStore } from '../store/dashboardStore';
import { HealthDecisionSpace } from '../types';

// Harare bounds
const harareBounds: LatLngBoundsExpression = [
  [-18.1, 30.85],
  [-17.7, 31.2],
];

interface MapUpdaterProps {
  spaces: HealthDecisionSpace[];
}

function MapUpdater({ spaces }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (spaces.length > 0) {
      const bounds: [number, number][] = spaces.map((space) => space.coordinates);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [spaces, map]);

  return null;
}

export function Map() {
  const { healthSpaces, filterState } = useDashboardStore();

  const filteredSpaces = useMemo(() => {
    return healthSpaces.filter((space) => {
      const yearMatch = space.year === filterState.selectedYear;
      const districtMatch =
        filterState.selectedDistricts.length === 0 ||
        filterState.selectedDistricts.includes(space.districtId);
      const typeMatch = !filterState.selectedType || space.type === filterState.selectedType;
      return yearMatch && districtMatch && typeMatch;
    });
  }, [healthSpaces, filterState]);

  const getMarkerColor = (space: HealthDecisionSpace) => {
    const percentage = (space.youthParticipants / space.totalParticipants) * 100;
    if (percentage >= 50) return '#00ff88';
    if (percentage >= 30) return '#ffd700';
    if (percentage >= 20) return '#ff9500';
    return '#ff4444';
  };

  const getMarkerSize = (space: HealthDecisionSpace) => {
    return Math.max(8, Math.min(20, space.youthParticipants));
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[-17.829, 31.054]}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
        maxBounds={harareBounds}
        maxBoundsViscosity={1.0}
        minZoom={10}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {filteredSpaces.map((space) => (
          <CircleMarker
            key={space.id}
            center={space.coordinates}
            radius={getMarkerSize(space)}
            fillColor={getMarkerColor(space)}
            color="#ffffff"
            weight={2}
            opacity={1}
            fillOpacity={0.7}
          >
            <Popup>
              <div className="popup-content">
                <h4>{space.name}</h4>
                <p>
                  <strong>Type:</strong> {space.type.replace(/_/g, ' ')}
                </p>
                <p>
                  <strong>Youth Participants (≤24):</strong> {space.youthParticipants}
                </p>
                <p>
                  <strong>Total Participants:</strong> {space.totalParticipants}
                </p>
                <p>
                  <strong>Youth Percentage:</strong>{' '}
                  {((space.youthParticipants / space.totalParticipants) * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Year:</strong> {space.year}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        
        <MapUpdater spaces={filteredSpaces} />
      </MapContainer>

      <div className="info-panel">
        <h4>Map Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ff88' }}></div>
            <span>≥50% Youth Participation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffd700' }}></div>
            <span>30-49% Youth Participation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff9500' }}></div>
            <span>20-29% Youth Participation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff4444' }}></div>
            <span>&lt;20% Youth Participation</span>
          </div>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.7rem' }}>
          Marker size indicates number of youth participants
        </p>
      </div>
    </div>
  );
}

