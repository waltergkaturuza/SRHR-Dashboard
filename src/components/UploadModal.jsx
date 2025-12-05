import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import './UploadModal.css';

const UploadModal = ({ onClose, onUploadSuccess, defaultCategory = 'health' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Upload metadata
  const [uploadMetadata, setUploadMetadata] = useState({
    category: defaultCategory,
    year: new Date().getFullYear(),
    district: '',
    autoDetect: true
  });

  const categories = [
    { value: 'health', label: '🏥 Health Platform' },
    { value: 'clinic', label: '🏥 Health Clinic' },
    { value: 'school', label: '🎓 School' },
    { value: 'church', label: '⛪ Church' },
    { value: 'police', label: '🚔 Police Station' },
    { value: 'shop', label: '🏪 Shop/Market' },
    { value: 'office', label: '🏢 Government Office' },
    { value: 'boundaries', label: '🗺️ Boundaries' }
  ];

  const suburbs = [
    'Alexandra Park', 'Avenues', 'Avondale', 'Avondale West', 'Avonlea',
    'Belgravia', 'Belvedere', 'Bluff Hill', 'Borrowdale', 'Borrowdale Brooke',
    'Borrowdale West', 'Braeside', 'Budiriro', 'Chisipite', 'Chizhanje',
    'Colne Valley', 'Colray', 'Cranborne', 'Dawn Hill', 'Donnybrook',
    'Dzivarasekwa', 'Eastlea', 'Emerald Hill', 'Epworth', 'Glen Lorne',
    'Glen Norah', 'Glen View', 'Glenwood', 'Greendale', 'Green Grove',
    'Greystone Park', 'Gunhill', 'Hatcliffe', 'Hatfield', 'Helensvale',
    'Highfield', 'Highlands', 'Hillside', 'Hogerty Hill', 'Hopley',
    'Kambuzuma', 'Kuwadzana', 'Lewisam', 'Loan-crest/Lochinvar',
    'Mabelreign', 'Mabvuku', 'Mandara', 'Marlborough', 'Mbare',
    'Milton Park', 'Monavale', 'Mount Pleasant', 'Msasa Park', 'Mufakose',
    'Newlands', 'Northwood', 'Parktown', 'Pomona', 'Prospect',
    'Queensdale', 'Quinnington', 'Rhodesville', 'Rietfontein', 'Rolf Valley',
    'Saturday Retreat', 'Shawasha Hills', 'Southerton', 'Southlea Park',
    'St. Mary\'s', 'Strathaven', 'Tafara', 'Vainona', 'Warren Park',
    'Waterfalls', 'Westgate', 'Westlea'
  ].sort();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
      setMessage('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadStatus(null);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error');
      setMessage('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Boundaries use a different endpoint and don't need year/district
    const isBoundary = uploadMetadata.category === 'boundaries';
    
    if (!isBoundary) {
      formData.append('year', uploadMetadata.year);
      formData.append('category', uploadMetadata.category);
      if (uploadMetadata.district) {
        formData.append('district', uploadMetadata.district);
      }
    }

    setUploading(true);
    setUploadStatus(null);
    setMessage('');

    try {
      // Use different endpoint for boundaries
      const endpoint = isBoundary ? '/api/upload-boundaries' : '/api/upload';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('success');
      if (isBoundary) {
        setMessage(`Successfully uploaded ${response.data.features} boundaries from ${response.data.filename}`);
      } else {
        setMessage(`Successfully uploaded ${response.data.features} ${uploadMetadata.category} features from ${response.data.filename} for year ${uploadMetadata.year}`);
      }
      
      setTimeout(() => {
        onUploadSuccess();
      }, 2000);
    } catch (error) {
      setUploadStatus('error');
      setMessage(error.response?.data?.error || 'Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset to default data? This will remove any uploaded data.')) {
      return;
    }

    try {
      await axios.post('/api/reset');
      setUploadStatus('success');
      setMessage('Data reset to default successfully');
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      setMessage('Error resetting data');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Geospatial Data</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="upload-info">
            <FileJson size={24} className="info-icon" />
            <div>
              <h3>Supported Formats</h3>
              <p>GeoJSON (.geojson, .json), Shapefile (.shp, .zip)</p>
            </div>
          </div>

          {/* Upload Metadata */}
          <div className="upload-metadata">
            <h3>Upload Settings</h3>
            
            <div className="metadata-row">
              <div className="metadata-field">
                <label>{uploadMetadata.category === 'boundaries' ? 'Data Type *' : 'Facility Category *'}</label>
                <select
                  value={uploadMetadata.category}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, category: e.target.value})}
                  className="metadata-select"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <small>{uploadMetadata.category === 'boundaries' ? 'Select Boundaries to upload boundary polygons' : 'What type of facilities are in this file?'}</small>
              </div>

              {uploadMetadata.category !== 'boundaries' && (
                <div className="metadata-field">
                  <label>Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={uploadMetadata.year}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, year: parseInt(e.target.value)})}
                    className="metadata-input"
                  />
                  <small>Which year is this data for?</small>
                </div>
              )}
            </div>

            {uploadMetadata.category !== 'boundaries' && (
              <div className="metadata-field">
                <label>Suburb/Location (Optional)</label>
                <select
                  value={uploadMetadata.district}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, district: e.target.value})}
                  className="metadata-select"
                >
                  <option value="">Auto-detect from data</option>
                  {suburbs.map(suburb => (
                    <option key={suburb} value={suburb}>{suburb}</option>
                  ))}
                </select>
                <small>If all facilities are in one suburb, select it here</small>
              </div>
            )}

            <div className="metadata-note">
              <strong>Note:</strong> The GeoJSON file should include these properties for each feature:
              <ul>
                {uploadMetadata.category === 'boundaries' ? (
                  <>
                    <li><code>name</code> - Boundary/suburb name (required)</li>
                    <li><code>code</code> or <code>Dist_Code</code> - Boundary code (optional)</li>
                    <li><code>population</code> - Population count (optional)</li>
                    <li><code>area_km2</code> or <code>Shape_Area</code> - Area in km² (will be converted from m² if needed)</li>
                    <li><strong>Geometry:</strong> Must be Polygon or MultiPolygon (not Point)</li>
                  </>
                ) : (
                  <>
                    <li><code>name</code> - Facility name (required)</li>
                    <li><code>type</code> or <code>sub_type</code> - Specific type (e.g., "primary" for schools)</li>
                    <li><code>description</code> - Additional notes (optional)</li>
                    <li><code>district</code> - District name (optional, can set above)</li>
                    {uploadMetadata.category === 'health' && (
                      <>
                        <li><code>youth_count</code> - Number of youth participants</li>
                        <li><code>total_members</code> - Total committee members</li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>

          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={48} className="upload-icon" />
            <p className="upload-text">
              Drag and drop your file here, or{' '}
              <label htmlFor="file-input" className="file-input-label">
                browse
              </label>
            </p>
            <input
              id="file-input"
              type="file"
              accept=".geojson,.json,.shp,.zip"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {selectedFile && (
              <div className="selected-file">
                <FileJson size={20} />
                <span>{selectedFile.name}</span>
                <span className="file-size">
                  ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>

          {uploadStatus && (
            <div className={`status-message ${uploadStatus}`}>
              {uploadStatus === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{message}</span>
            </div>
          )}

          <div className="data-format-info">
            <h4>Expected Data Format (GeoJSON)</h4>
            <pre className="code-block">
{uploadMetadata.category === 'boundaries' ? `{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[31.0, -17.8], [31.1, -17.8], [31.1, -17.9], [31.0, -17.9], [31.0, -17.8]]]
    },
    "properties": {
      "name": "Boundary Name",
      "code": "HRC",
      "population": 80000,
      "area_km2": 6.5
    }
  }]
}` : `{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [31.0492, -17.8252]
    },
    "properties": {
      "name": "Location Name",
      "type": "Committee Type",
      "youth_count": 25,
      "total_members": 100,
      "year": 2024,
      "address": "Address"
    }
  }]
}`}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-secondary"
            onClick={handleReset}
            disabled={uploading}
          >
            Reset to Default
          </button>
          <div className="footer-right">
            <button 
              className="btn-secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;

