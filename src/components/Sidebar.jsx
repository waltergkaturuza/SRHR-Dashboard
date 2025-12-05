import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, TrendingUp, Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';
import './Sidebar.css';

const Sidebar = ({ geospatialData, selectedFeature, onFeatureSelect, selectedYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    suburb: '',
    category: '',
    facilityType: '',
    minPopulation: '',
    maxPopulation: ''
  });
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(getApiUrl(`api/search/autocomplete?q=${encodeURIComponent(searchTerm)}&limit=8`));
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      };
      
      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Perform advanced search
  const performSearch = async () => {
    if (!searchTerm && !activeFilters.suburb && !activeFilters.category && !activeFilters.facilityType) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (activeFilters.suburb) params.append('suburb', activeFilters.suburb);
      if (activeFilters.category) params.append('category', activeFilters.category);
      if (activeFilters.facilityType) params.append('facility_type', activeFilters.facilityType);
      if (activeFilters.minPopulation) params.append('min_population', activeFilters.minPopulation);
      if (activeFilters.maxPopulation) params.append('max_population', activeFilters.maxPopulation);
      if (selectedYear) params.append('year', selectedYear);

      const response = await axios.get(getApiUrl(`api/search?${params.toString()}`));
      setSearchResults(response.data);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults({ boundaries: [], health_platforms: [], facilities: [], total: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || activeFilters.suburb || activeFilters.category || activeFilters.facilityType) {
        performSearch();
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeFilters, selectedYear]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    if (suggestion.type === 'suburb') {
      setActiveFilters({ ...activeFilters, suburb: suggestion.text });
    }
  };

  const handleFilterChange = (filterName, value) => {
    setActiveFilters({ ...activeFilters, [filterName]: value });
  };

  const removeFilter = (filterName) => {
    setActiveFilters({ ...activeFilters, [filterName]: '' });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilters({
      suburb: '',
      category: '',
      facilityType: '',
      minPopulation: '',
      maxPopulation: ''
    });
    setSearchResults(null);
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v) || searchTerm;

  // Determine what to display
  const displayData = searchResults || (geospatialData?.features || []);

  // Render results based on search or default
  const renderResults = () => {
    if (searchResults) {
      // Render search results
      const allResults = [
        ...searchResults.boundaries.map(b => ({ ...b, resultType: 'boundary' })),
        ...searchResults.health_platforms.map(hp => ({ ...hp, resultType: 'health_platform' })),
        ...searchResults.facilities.map(f => ({ ...f, resultType: 'facility' }))
      ];

      if (allResults.length === 0) {
        return (
          <div className="no-results">
            <p>No results found</p>
            <p className="no-results-hint">Try adjusting your search or filters</p>
          </div>
        );
      }

      return (
        <div className="search-results">
          <div className="results-header">
            <span className="results-count">{searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found</span>
          </div>
          {allResults.map((item, index) => (
            <div
              key={`${item.resultType}-${item.id}-${index}`}
              className={`location-card ${selectedFeature?.properties?.id === item.id ? 'selected' : ''}`}
              onClick={() => {
                // Handle boundaries differently - they need polygon geometry for proper zooming
                if (item.resultType === 'boundary') {
                  // For boundaries, use center point if available, or fetch boundary geometry
                  const feature = {
                    type: 'Feature',
                    geometry: item.boundary || {
                      type: 'Point',
                      coordinates: item.longitude && item.latitude 
                        ? [item.longitude, item.latitude] 
                        : [31.0492, -17.8252] // Default to Harare center
                    },
                    properties: {
                      ...item,
                      isBoundary: true,
                      boundaryName: item.name
                    }
                  };
                  onFeatureSelect(feature);
                } else {
                  // For facilities and health platforms, use point geometry
                  const feature = {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: item.longitude && item.latitude 
                        ? [item.longitude, item.latitude] 
                        : [31.0492, -17.8252] // Default to Harare center
                    },
                    properties: item
                  };
                  onFeatureSelect(feature);
                }
              }}
            >
              <div className="location-header">
                <h3 className="location-name">{item.name}</h3>
                <span className="location-type">{item.type || item.category || item.resultType}</span>
              </div>
              {item.resultType === 'health_platform' && (
                <div className="location-stats">
                  <div className="stat-item">
                    <Users size={16} className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Youth (≤24)</span>
                      <span className="stat-value">{item.youth_count || 0}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <MapPin size={16} className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Total Members</span>
                      <span className="stat-value">{item.total_members || 0}</span>
                    </div>
                  </div>
                </div>
              )}
              {item.district && (
                <div className="location-district">
                  <MapPin size={12} /> {item.district}
                </div>
              )}
              {item.address && (
                <div className="location-address">{item.address}</div>
              )}
            </div>
          ))}
        </div>
      );
    } else if (hasGeospatialData) {
      // Render default geospatial data
      const filteredFeatures = geospatialData.features.filter(feature =>
        feature.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.properties.type.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFeatures.length === 0) {
        return (
          <div className="no-results">
            <p>No locations match your search</p>
            {!hasGeospatialData && (
              <p className="no-results-hint">Start typing to search across all facilities and boundaries</p>
            )}
          </div>
        );
      }

      return filteredFeatures.map((feature, index) => {
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
      });
    } else {
      // No geospatial data and no search results
      return (
        <div className="no-results">
          <p>No data available</p>
          <p className="no-results-hint">Use the search above to find facilities and boundaries</p>
        </div>
      );
    }
  };

  // Always show search functionality, even if no geospatial data
  const hasGeospatialData = geospatialData && geospatialData.features;

  const features = hasGeospatialData ? geospatialData.features : [];
  const resultCount = searchResults ? searchResults.total : features.length;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>District Health Platforms</h2>
        <p className="location-count">{resultCount} Location{resultCount !== 1 ? 's' : ''}</p>
      </div>

      <div className="search-section">
        <div className="search-box-wrapper">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search suburbs, facilities, health platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search size={14} />
                  <span className="suggestion-text">{suggestion.text}</span>
                  <span className="suggestion-type">{suggestion.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Toggle */}
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Advanced Filters
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Suburb/Boundary</label>
              <input
                type="text"
                placeholder="e.g., Harare CBD, Mbare"
                value={activeFilters.suburb}
                onChange={(e) => handleFilterChange('suburb', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select
                value={activeFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="health">Health</option>
                <option value="school">School</option>
                <option value="church">Church</option>
                <option value="police">Police</option>
                <option value="shop">Shop</option>
                <option value="office">Office</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Facility Type</label>
              <select
                value={activeFilters.facilityType}
                onChange={(e) => handleFilterChange('facilityType', e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {activeFilters.category === 'school' && (
                  <>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="tertiary">Tertiary</option>
                  </>
                )}
                {activeFilters.category === 'health' && (
                  <>
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="pharmacy">Pharmacy</option>
                  </>
                )}
              </select>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Min Population</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.minPopulation}
                  onChange={(e) => handleFilterChange('minPopulation', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Max Population</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.maxPopulation}
                  onChange={(e) => handleFilterChange('maxPopulation', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                <X size={14} />
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="filter-chips">
            {activeFilters.suburb && (
              <span className="filter-chip">
                Suburb: {activeFilters.suburb}
                <button onClick={() => removeFilter('suburb')}><X size={12} /></button>
              </span>
            )}
            {activeFilters.category && (
              <span className="filter-chip">
                Category: {activeFilters.category}
                <button onClick={() => removeFilter('category')}><X size={12} /></button>
              </span>
            )}
            {activeFilters.facilityType && (
              <span className="filter-chip">
                Type: {activeFilters.facilityType}
                <button onClick={() => removeFilter('facilityType')}><X size={12} /></button>
              </span>
            )}
            {(activeFilters.minPopulation || activeFilters.maxPopulation) && (
              <span className="filter-chip">
                Population: {activeFilters.minPopulation || '0'}-{activeFilters.maxPopulation || '∞'}
                <button onClick={() => {
                  removeFilter('minPopulation');
                  removeFilter('maxPopulation');
                }}><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-content">
        {isSearching && (
          <div className="searching-indicator">
            <div className="spinner-small"></div>
            <span>Searching...</span>
          </div>
        )}
        <div className="location-list">
          {renderResults()}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
