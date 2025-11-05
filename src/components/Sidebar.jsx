import React, { useState } from 'react';
import { MapPin, Users, TrendingUp } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ geospatialData, selectedFeature, onFeatureSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!geospatialData || !geospatialData.features) {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>District Locations</h2>
        </div>
        <div className="sidebar-content">
          <p className="no-data">No data available</p>
        </div>
      </aside>
    );
  }

  const features = geospatialData.features || [];
  const filteredFeatures = features.filter(feature =>
    feature.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.properties.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>District Health Platforms</h2>
        <p className="location-count">{features.length} Locations</p>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sidebar-content">
        <div className="location-list">
          {filteredFeatures.map((feature, index) => {
            const props = feature.properties;
            const isSelected = selectedFeature && selectedFeature.properties.id === props.id;
            const youthPercentage = props.total_members ? 
              Math.round((props.youth_count / props.total_members) * 100) : 0;

            return (
              <div
                key={index}
                className={`location-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onFeatureSelect(feature)}
              >
                <div className="location-header">
                  <h3 className="location-name">{props.name}</h3>
                  <span className="location-type">{props.type}</span>
                </div>

                <div className="location-stats">
                  <div className="stat-item">
                    <Users size={16} className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Youth (≤24)</span>
                      <span className="stat-value">{props.youth_count || 0}</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MapPin size={16} className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Total Members</span>
                      <span className="stat-value">{props.total_members || 0}</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <TrendingUp size={16} className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Youth %</span>
                      <span className="stat-value">{youthPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${youthPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="no-results">
            <p>No locations match your search</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

