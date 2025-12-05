import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { Edit2, Trash2, Plus, Save, X, Search, Filter, Download } from 'lucide-react';
import UploadModal from './UploadModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [platforms, setPlatforms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBoundaryUpload, setShowBoundaryUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Default to current year instead of 'all'
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('health'); // health, school, church, police, shop, office, boundaries
  const [availableYears, setAvailableYears] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'desc' });

  // New platform form
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    category: 'health',
    type: 'Youth Committee',
    sub_type: 'primary',
    youth_count: 0,
    total_members: 0,
    year: new Date().getFullYear(),
    address: '',
    description: '',
    district: '',
    latitude: -17.8252,
    longitude: 31.0492
  });

  const healthPlatformTypes = [
    'Advisory Board',
    'Clinic Committee',
    'Community Health Committee',
    'Community Platform',
    'District Office',
    'Health Forum',
    'SRHR Forum',
    'Youth Committee'
  ];

  const categories = [
    { value: 'health', label: '🏥 Health Platform', subTypes: healthPlatformTypes },
    { value: 'school', label: '🎓 School', subTypes: ['Primary', 'Secondary', 'Tertiary'] },
    { value: 'church', label: '⛪ Church', subTypes: ['Catholic', 'Pentecostal', 'Methodist', 'Anglican', 'Baptist', 'Other'] },
    { value: 'police', label: '🚔 Police Station', subTypes: ['Main Station', 'Branch Office', 'Police Post'] },
    { value: 'shop', label: '🏪 Shop/Market', subTypes: ['Market', 'Shopping Mall', 'Shopping Center', 'Retail Store', 'Supermarket'] },
    { value: 'office', label: '🏢 Government Office', subTypes: ['Municipal Office', 'Ministry', 'District Office', 'Provincial Office', 'Government Department'] },
    { value: 'clinic', label: '🏥 Health Clinic', subTypes: ['Primary Clinic', 'Polyclinic', 'Health Center', 'Medical Center', 'Maternity Clinic', 'Pharmacy'] }
  ];

  const normalizeSubType = (subType) => (subType || '').toLowerCase().replace(/\s+/g, '_');

  const suburbs = [
    'Alexandra Park',
    'Avenues',
    'Avondale',
    'Avondale West',
    'Avonlea',
    'Belgravia',
    'Belvedere',
    'Bluff Hill',
    'Borrowdale',
    'Borrowdale Brooke',
    'Borrowdale West',
    'Braeside',
    'Budiriro',
    'Chisipite',
    'Chitungwiza Town Centre',
    'Chizhanje',
    'Colne Valley',
    'Colray',
    'Cranborne',
    'Dawn Hill',
    'Donnybrook',
    'Dzivarasekwa',
    'Eastlea',
    'Emerald Hill',
    'Epworth',
    'Glen Lorne',
    'Glen Norah',
    'Glen View',
    'Glenwood',
    'Goromonzi',
    'Greendale',
    'Green Grove',
    'Greystone Park',
    'Gunhill',
    'Harare Central',
    'Harare South',
    'Hatcliffe',
    'Hatfield',
    'Helensvale',
    'Highfield',
    'Highlands',
    'Hillside',
    'Hogerty Hill',
    'Hopley',
    'Kambuzuma',
    'Kuwadzana',
    'Lewisam',
    'Loan-crest/Lochinvar',
    'Mabelreign',
    'Mabvuku',
    'Madokoro',
    'Mandara',
    'Manyame Park',
    'Marimba',
    'Marlborough',
    'Mbare',
    'Mayambara',
    'Milton Park',
    'Monavale',
    'Mount Pleasant',
    'Msasa Park',
    'Mufakose',
    'Newlands',
    'Northwood',
    'Nyatsime',
    'Parktown',
    'Pomona',
    'Prospect',
    'Queensdale',
    'Quinnington',
    'Rhodesville',
    'Rietfontein',
    'Rolf Valley',
    'Ruwa',
    'Saturday Retreat',
    'Seke Unit A',
    'Seke Unit B',
    'Seke Unit C',
    'Seke Unit D',
    'Seke Unit E',
    'Seke Unit F',
    'Seke Unit G',
    'Seke Unit H',
    'Seke Unit J',
    'Seke Unit K',
    'Seke Unit L',
    'Seke Unit M',
    'Seke Unit N',
    'Seke Unit O',
    'Seke Unit P',
    'Shawasha Hills',
    'Southerton',
    'Southlea Park',
    'St. Mary\'s',
    'St Mary\'s (Old)',
    'Strathaven',
    'Sunningdale',
    'Tafara',
    'Vainona',
    'Warren Park',
    'Waterfalls',
    'Westgate',
    'Westlea',
    'Zengeza 1',
    'Zengeza 2',
    'Zengeza 3',
    'Zengeza 4',
    'Zengeza 5',
    'Zengeza 5 Ext'
  ].sort(); // Alphabetically sorted for easier selection

  // Fetch years on mount
  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (filterCategory === 'boundaries') {
      fetchBoundaries();
    } else if (filterCategory === 'health') {
      fetchAllPlatforms();
    } else {
      fetchFacilities();
    }
  }, [filterCategory]);

  useEffect(() => {
    filterAndSortPlatforms();
  }, [platforms, searchTerm, filterYear, filterType, sortConfig]);

  const fetchAllPlatforms = async () => {
    setLoading(true);
    try {
      // Fetch data for all available years
      const yearsResponse = await axios.get(getApiUrl('api/years'));
      const years = yearsResponse.data.years || [];
      
      const allPlatforms = [];
      for (const year of years) {
        const response = await axios.get(getApiUrl(`api/geospatial-data?year=${year}`));
        if (response.data.features) {
          response.data.features.forEach(feature => {
            allPlatforms.push({
              ...feature.properties,
              category: 'health', // Health platforms from geospatial-data endpoint
              latitude: feature.geometry.coordinates[1],
              longitude: feature.geometry.coordinates[0]
            });
          });
        }
      }
      
      setPlatforms(allPlatforms);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const yearsResponse = await axios.get(getApiUrl('api/years'));
      const years = yearsResponse.data.years || [];
      
      const allFacilities = [];
      for (const year of years) {
        const response = await axios.get(getApiUrl(`api/facilities?year=${year}&category=${filterCategory}`));
        if (response.data && Array.isArray(response.data)) {
          allFacilities.push(...response.data);
        }
      }
      
      setFacilities(allFacilities);
      setPlatforms(allFacilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBoundaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(getApiUrl('api/boundaries'));
      if (response.data && Array.isArray(response.data)) {
        setBoundaries(response.data);
        // Map boundaries to platforms format for display
        setPlatforms(response.data.map(b => ({
          ...b,
          category: 'boundary',
          name: b.name,
          code: b.code,
          population: b.population,
          area_km2: b.area_km2
        })));
      } else {
        setBoundaries([]);
        setPlatforms([]);
      }
    } catch (error) {
      console.error('Error fetching boundaries:', error);
      setBoundaries([]);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await axios.get(getApiUrl('api/years'));
      const years = response.data.years || [];
      // Sort years descending (newest first)
      const sortedYears = [...years].sort((a, b) => b - a);
      setAvailableYears(sortedYears);
      
      // Set default to current year if available, otherwise latest year
      if (sortedYears.length > 0) {
        const defaultYear = sortedYears.includes(currentYear) 
          ? currentYear 
          : Math.max(...sortedYears);
        // Update filterYear if it's 'all', '2024', or not in available years
        if (filterYear === 'all' || filterYear === '2024' || !sortedYears.includes(parseInt(filterYear))) {
          setFilterYear(defaultYear.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      // Fallback: use current year and recent years
      const fallbackYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
      setAvailableYears(fallbackYears);
      if (filterYear === 'all' || filterYear === '2024' || !fallbackYears.includes(parseInt(filterYear))) {
        setFilterYear(currentYear.toString());
      }
    }
  };

  const filterAndSortPlatforms = () => {
    let filtered = filterCategory === 'boundaries' 
      ? [...boundaries].map(b => ({ ...b, category: 'boundary' }))
      : [...platforms];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.type && p.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Year filter (skip for boundaries as they don't have year)
    if (filterYear !== 'all' && filterCategory !== 'boundaries') {
      filtered = filtered.filter(p => p.year === parseInt(filterYear));
    }

    // Type filter (skip for boundaries)
    if (filterType !== 'all' && filterCategory !== 'boundaries') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredPlatforms(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (platform) => {
    // Ensure we track which record is being edited (used by PUT endpoints)
    setEditingId(platform.id);

    // Check if it's a boundary
    if (platform.category === 'boundary' || filterCategory === 'boundaries') {
      setEditForm({
        id: platform.id,
        name: platform.name || '',
        code: platform.code || '',
        population: platform.population || 0,
        area_km2: platform.area_km2 || 0,
        category: 'boundary'
      });
    } else {
      // Determine category from platform data
      const category = platform.category || (platform.type ? 'health' : 'health');
      
      // Prepare edit form with all fields
      setEditForm({
        id: platform.id,
        name: platform.name || '',
        category: category,
        type: platform.type || '',
        sub_type: platform.sub_type || '',
        youth_count: platform.youth_count || 0,
        total_members: platform.total_members || 0,
        year: platform.year || new Date().getFullYear(),
        address: platform.address || '',
        description: platform.description || '',
        district: platform.district || '',
        latitude: platform.latitude || -17.8252,
        longitude: platform.longitude || 31.0492
      });
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      // Check if it's a boundary
      if (editForm.category === 'boundary' || filterCategory === 'boundaries') {
        // Update boundary
        await axios.put(getApiUrl(`api/boundaries/${editingId}`), {
          name: editForm.name,
          code: editForm.code || null,
          population: editForm.population ? parseInt(editForm.population) : null,
          area_km2: editForm.area_km2 ? parseFloat(editForm.area_km2) : null
        });
        await fetchBoundaries();
      } else {
        // Determine if it's a health platform or facility
        const isHealthPlatform = editForm.category === 'health' || (!editForm.category && editForm.type);
        
        if (isHealthPlatform) {
          // Update health platform via existing endpoint
          await axios.put(getApiUrl(`api/platform/${editingId}`), {
            name: editForm.name,
            type: editForm.type,
            youth_count: parseInt(editForm.youth_count) || 0,
            total_members: parseInt(editForm.total_members) || 0,
            address: editForm.address,
            description: editForm.description,
            district: editForm.district
          });
        } else {
          // Update facility via new endpoint
          await axios.put(getApiUrl(`api/facility/${editingId}`), {
            name: editForm.name,
            category: editForm.category,
            sub_type: normalizeSubType(editForm.sub_type),
            year: parseInt(editForm.year),
            address: editForm.address,
            description: editForm.description,
            district: editForm.district,
            latitude: parseFloat(editForm.latitude),
            longitude: parseFloat(editForm.longitude)
          });
        }
        
        // Refresh data
        if (filterCategory === 'health') {
          await fetchAllPlatforms();
        } else {
          await fetchFacilities();
        }
      }
      
      setShowEditModal(false);
      setEditingId(null);
      setEditForm({});
      alert('Record updated successfully!');
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id, name, category) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        // Determine if it's a health platform or facility based on current filter category
        // This is more reliable than checking individual platform category
        const isHealthPlatform = filterCategory === 'health';
        
        if (isHealthPlatform) {
          await axios.delete(getApiUrl(`api/platform/${id}`));
        } else {
          await axios.delete(getApiUrl(`api/facility/${id}`));
        }
        
        // Refresh data based on current filter
        if (filterCategory === 'health') {
          await fetchAllPlatforms();
        } else {
          await fetchFacilities();
        }
        
        alert('Record deleted successfully!');
      } catch (error) {
        console.error('Error deleting record:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        alert(`Error deleting record: ${errorMessage}`);
      }
    }
  };

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    try {
      // Create GeoJSON for upload
          const geojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [parseFloat(newPlatform.longitude), parseFloat(newPlatform.latitude)]
          },
              properties: {
            name: newPlatform.name,
            type: newPlatform.category === 'health' ? newPlatform.type : undefined,
                sub_type: newPlatform.category !== 'health' ? normalizeSubType(newPlatform.sub_type) : undefined,
            youth_count: newPlatform.category === 'health' ? parseInt(newPlatform.youth_count) : undefined,
            total_members: newPlatform.category === 'health' ? parseInt(newPlatform.total_members) : undefined,
            year: parseInt(newPlatform.year),
            address: newPlatform.address,
            description: newPlatform.description,
            district: newPlatform.district
          }
        }]
      };

      // Upload via API with metadata
      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', blob, 'new_platform.geojson');
      formData.append('year', newPlatform.year);
      formData.append('category', newPlatform.category);
      if (newPlatform.district) {
        formData.append('district', newPlatform.district);
      }

      await axios.post(getApiUrl('api/upload'), formData);
      
      await fetchAllPlatforms();
      setShowAddForm(false);
      setNewPlatform({
        name: '',
        type: 'Youth Committee',
        youth_count: 0,
        total_members: 0,
        year: new Date().getFullYear(),
        address: '',
        latitude: -17.8252,
        longitude: 31.0492
      });
      alert('Platform added successfully!');
    } catch (error) {
      console.error('Error adding platform:', error);
      alert('Error adding platform: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Youth Count', 'Total Members', 'Year', 'Address', 'Latitude', 'Longitude', 'Youth %'];
    const rows = filteredPlatforms.map(p => [
      p.id,
      p.name,
      p.type,
      p.youth_count,
      p.total_members,
      p.year,
      p.address || '',
      p.latitude,
      p.longitude,
      ((p.youth_count / p.total_members) * 100).toFixed(1)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srhr_platforms_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage Health Decision-Making Platforms</p>
      </div>

      <div className="admin-toolbar">
        <div className="toolbar-left">
          <select 
            className="filter-select category-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="health">🏥 Health Platforms</option>
            <option value="clinic">🏥 Health Clinics</option>
            <option value="school">🎓 Schools</option>
            <option value="church">⛪ Churches</option>
            <option value="police">🚔 Police Stations</option>
            <option value="shop">🏪 Shops & Markets</option>
            <option value="office">🏢 Government Offices</option>
            <option value="boundaries">🗺️ Boundaries</option>
          </select>
          
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          {filterCategory === 'health' && (
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {healthPlatformTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
        </div>

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportToCSV}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="btn-add" onClick={() => setShowAddForm(true)}>
            <Plus size={18} />
            Add Platform
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-box">
          <span className="stat-label">Total Platforms</span>
          <span className="stat-value">{filteredPlatforms.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Youth</span>
          <span className="stat-value">
            {filteredPlatforms.reduce((sum, p) => sum + (p.youth_count || 0), 0)}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Members</span>
          <span className="stat-value">
            {filteredPlatforms.reduce((sum, p) => sum + (p.total_members || 0), 0)}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Avg Youth %</span>
          <span className="stat-value">
            {filteredPlatforms.length > 0
              ? ((filteredPlatforms.reduce((sum, p) => sum + (p.youth_count || 0), 0) /
                  filteredPlatforms.reduce((sum, p) => sum + (p.total_members || 1), 0)) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading platforms...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')}>
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                {filterCategory === 'boundaries' ? (
                  <>
                    <th onClick={() => handleSort('code')}>
                      Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('population')}>
                      Population {sortConfig.key === 'population' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('area_km2')}>
                      Area (km²) {sortConfig.key === 'area_km2' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </>
                ) : (
                  <>
                    <th onClick={() => handleSort('type')}>
                      Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('youth_count')}>
                      Youth (≤24) {sortConfig.key === 'youth_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('total_members')}>
                      Total Members {sortConfig.key === 'total_members' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('year')}>
                      Year {sortConfig.key === 'year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Youth %</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                  </>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlatforms.map(platform => (
                <tr key={platform.id}>
                  <td>{platform.id}</td>
                  <td className="name-cell">{platform.name}</td>
                  {filterCategory === 'boundaries' ? (
                    <>
                      <td>{platform.code || '-'}</td>
                      <td className="number-cell">{platform.population ? platform.population.toLocaleString() : '-'}</td>
                      <td className="number-cell">{platform.area_km2 ? platform.area_km2.toFixed(2) : '-'}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        <span className="type-badge">{platform.type || platform.sub_type || '-'}</span>
                      </td>
                      <td className="number-cell">{platform.youth_count || '-'}</td>
                      <td className="number-cell">{platform.total_members || '-'}</td>
                      <td className="year-cell">{platform.year}</td>
                      <td className="percent-cell">
                        {platform.youth_count && platform.total_members 
                          ? ((platform.youth_count / platform.total_members) * 100).toFixed(1) + '%'
                          : '-'}
                      </td>
                      <td className="address-cell">{platform.address || '-'}</td>
                      <td className="coords-cell">
                        {platform.latitude && platform.longitude 
                          ? `${platform.latitude.toFixed(4)}, ${platform.longitude.toFixed(4)}`
                          : '-'}
                      </td>
                    </>
                  )}
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(platform)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(platform.id, platform.name, platform.category)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPlatforms.length === 0 && (
            <div className="no-data">
              <p>No platforms found matching your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Add Platform Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Platform</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>
                <X size={24} />
              </button>
            </div>

            <form className="add-form" onSubmit={handleAddPlatform}>
              {/* Category Selection */}
              <div className="form-group">
                <label>Facility Category *</label>
                <select
                  value={newPlatform.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    const categoryConfig = categories.find(c => c.value === category);
                    setNewPlatform({
                      ...newPlatform, 
                      category,
                      type: categoryConfig?.subTypes[0] || '',
                      sub_type: categoryConfig?.subTypes[0] || ''
                    });
                  }}
                  className="category-select-large"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlatform.name}
                    onChange={(e) => setNewPlatform({...newPlatform, name: e.target.value})}
                    placeholder={`e.g., ${newPlatform.category === 'school' ? 'Avondale Primary School' : 
                                         newPlatform.category === 'church' ? 'St Mary\'s Cathedral' :
                                         newPlatform.category === 'police' ? 'Mbare Police Station' :
                                         'Facility Name'}`}
                  />
                </div>

                <div className="form-group">
                  <label>Type/Sub-Category *</label>
                  <select
                    value={newPlatform.category === 'health' ? newPlatform.type : newPlatform.sub_type}
                    onChange={(e) => setNewPlatform({
                      ...newPlatform, 
                      [newPlatform.category === 'health' ? 'type' : 'sub_type']: e.target.value
                    })}
                  >
                    {(categories.find(c => c.value === newPlatform.category)?.subTypes || []).map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Suburb/Location *</label>
                  <select
                    value={newPlatform.district}
                    onChange={(e) => setNewPlatform({...newPlatform, district: e.target.value})}
                    required
                  >
                    <option value="">Select Suburb/Location</option>
                    {suburbs.map(suburb => (
                      <option key={suburb} value={suburb}>{suburb}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Youth Count (≤24 years) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPlatform.youth_count}
                    onChange={(e) => setNewPlatform({...newPlatform, youth_count: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Total Members *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPlatform.total_members}
                    onChange={(e) => setNewPlatform({...newPlatform, total_members: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={newPlatform.year}
                    onChange={(e) => setNewPlatform({...newPlatform, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={newPlatform.address}
                  onChange={(e) => setNewPlatform({...newPlatform, address: e.target.value})}
                  placeholder="e.g., Corner 5th Street & Central Avenue"
                />
              </div>

              <div className="form-group">
                <label>Description / Additional Notes</label>
                <textarea
                  rows="3"
                  value={newPlatform.description}
                  onChange={(e) => setNewPlatform({...newPlatform, description: e.target.value})}
                  placeholder="Add any additional information, services offered, operating hours, contact details, etc."
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    value={newPlatform.latitude}
                    onChange={(e) => setNewPlatform({...newPlatform, latitude: e.target.value})}
                    placeholder="-17.8252"
                  />
                </div>

                <div className="form-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    value={newPlatform.longitude}
                    onChange={(e) => setNewPlatform({...newPlatform, longitude: e.target.value})}
                    placeholder="31.0492"
                  />
                </div>
              </div>

              <div className="form-note">
                <p><strong>Note:</strong> For Harare, Zimbabwe coordinates are approximately:</p>
                <p>Latitude: -17.78 to -17.87 | Longitude: 31.00 to 31.10</p>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <Plus size={18} />
                  Add Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Platform Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Platform</h2>
              <button className="close-btn" onClick={handleCancelEdit}>
                <X size={24} />
              </button>
            </div>

            <form className="add-form" onSubmit={handleSaveEdit}>
              {/* Boundary Fields */}
              {editForm.category === 'boundary' || filterCategory === 'boundaries' ? (
                <>
                  <div className="form-group">
                    <label>Boundary Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="e.g., Harare Central"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Code</label>
                      <input
                        type="text"
                        value={editForm.code || ''}
                        onChange={(e) => setEditForm({...editForm, code: e.target.value})}
                        placeholder="e.g., HRC"
                      />
                    </div>

                    <div className="form-group">
                      <label>Population</label>
                      <input
                        type="number"
                        value={editForm.population || ''}
                        onChange={(e) => setEditForm({...editForm, population: e.target.value})}
                        placeholder="e.g., 80000"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Area (km²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.area_km2 || ''}
                      onChange={(e) => setEditForm({...editForm, area_km2: e.target.value})}
                      placeholder="e.g., 6.0"
                    />
                  </div>

                  <div className="form-note">
                    <p><strong>Note:</strong> To update the boundary geometry, please upload a new GeoJSON or Shapefile via the Upload button.</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Category Selection (only if not health) */}
                  {editForm.category && editForm.category !== 'health' && (
                    <div className="form-group">
                      <label>Facility Category *</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => {
                          const category = e.target.value;
                          const categoryConfig = categories.find(c => c.value === category);
                          setEditForm({
                            ...editForm, 
                            category,
                            sub_type: categoryConfig?.subTypes[0] || ''
                          });
                        }}
                        className="category-select-large"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Platform name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Type/Sub-Category *</label>
                      {editForm.category === 'health' || !editForm.category ? (
                        <select
                          value={editForm.type || ''}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                          required
                    >
                      {healthPlatformTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={editForm.sub_type || ''}
                      onChange={(e) => setEditForm({...editForm, sub_type: e.target.value})}
                      required
                    >
                      {(categories.find(c => c.value === editForm.category)?.subTypes || []).map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Suburb/Location</label>
                  <select
                    value={editForm.district || ''}
                    onChange={(e) => setEditForm({...editForm, district: e.target.value})}
                  >
                    <option value="">Select Suburb/Location</option>
                    {suburbs.map(suburb => (
                      <option key={suburb} value={suburb}>{suburb}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(editForm.category === 'health' || !editForm.category) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Youth Count (≤24 years)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.youth_count || 0}
                      onChange={(e) => setEditForm({...editForm, youth_count: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Members</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.total_members || 0}
                      onChange={(e) => setEditForm({...editForm, total_members: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Year *</label>
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2100"
                      value={editForm.year}
                      onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {editForm.category && editForm.category !== 'health' && (
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={editForm.year}
                    onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  placeholder="e.g., Corner 5th Street & Central Avenue"
                />
              </div>

              <div className="form-group">
                <label>Description / Additional Notes</label>
                <textarea
                  rows="3"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Add any additional information..."
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                    placeholder="-17.8252"
                  />
                </div>

                <div className="form-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                    placeholder="31.0492"
                  />
                </div>
              </div>

                  <div className="form-note">
                    <p><strong>Note:</strong> For Harare, Zimbabwe coordinates are approximately:</p>
                    <p>Latitude: -17.78 to -17.87 | Longitude: 31.00 to 31.10</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude *</label>
                      <input
                        type="number"
                        required
                        step="0.000001"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                        placeholder="-17.8252"
                      />
                    </div>

                    <div className="form-group">
                      <label>Longitude *</label>
                      <input
                        type="number"
                        required
                        step="0.000001"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                        placeholder="31.0492"
                      />
                    </div>
                  </div>

                  <div className="form-note">
                    <p><strong>Note:</strong> For Harare, Zimbabwe coordinates are approximately:</p>
                    <p>Latitude: -17.78 to -17.87 | Longitude: 31.00 to 31.10</p>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boundary Upload Modal */}
      {showBoundaryUpload && (
        <UploadModal
          onClose={() => {
            setShowBoundaryUpload(false);
            fetchBoundaries();
          }}
          onUploadSuccess={() => {
            setShowBoundaryUpload(false);
            fetchBoundaries();
          }}
          defaultCategory="boundaries"
        />
      )}
    </div>
  );
};

export default AdminDashboard;

