import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import './UploadModal.css';

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

    setUploading(true);
    setUploadStatus(null);
    setMessage('');

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('success');
      setMessage(`Successfully uploaded ${response.data.features} features from ${response.data.filename}`);
      
      // Wait a bit before closing so user can see success message
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
{`{
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

