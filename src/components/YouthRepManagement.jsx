import React, { useState, useEffect } from 'react';
import './YouthRepManagement.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Component for managing youth representative information for districts
 */
const YouthRepManagement = () => {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [formData, setFormData] = useState({
    youth_rep_name: '',
    youth_rep_title: '',
    health_platforms: []
  });
  const [newPlatform, setNewPlatform] = useState('');

  // Fetch districts with youth info
  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/districts/youth-info`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      
      const data = await response.json();
      setDistricts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching districts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (district) => {
    setEditingDistrict(district);
    setFormData({
      youth_rep_name: district.youth_rep_name || '',
      youth_rep_title: district.youth_rep_title || '',
      health_platforms: district.health_platforms || []
    });
  };

  const handleCancel = () => {
    setEditingDistrict(null);
    setFormData({
      youth_rep_name: '',
      youth_rep_title: '',
      health_platforms: []
    });
    setNewPlatform('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPlatform = () => {
    if (newPlatform.trim()) {
      setFormData(prev => ({
        ...prev,
        health_platforms: [...prev.health_platforms, newPlatform.trim()]
      }));
      setNewPlatform('');
    }
  };

  const handleRemovePlatform = (index) => {
    setFormData(prev => ({
      ...prev,
      health_platforms: prev.health_platforms.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to update district information');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/districts/${editingDistrict.id}/youth-info`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update district');
      }

      // Refresh districts list
      await fetchDistricts();
      handleCancel();
      alert('District information updated successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error updating district:', err);
    }
  };

  if (loading) {
    return <div className="youth-rep-management loading">Loading districts...</div>;
  }

  if (error) {
    return (
      <div className="youth-rep-management error">
        <p>Error: {error}</p>
        <button onClick={fetchDistricts}>Retry</button>
      </div>
    );
  }

  return (
    <div className="youth-rep-management">
      <h2>Youth Representative Management</h2>
      
      {editingDistrict ? (
        <div className="edit-form-container">
          <h3>Edit {editingDistrict.name}</h3>
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label htmlFor="youth_rep_name">Youth Representative Name</label>
              <input
                type="text"
                id="youth_rep_name"
                name="youth_rep_name"
                value={formData.youth_rep_name}
                onChange={handleInputChange}
                placeholder="e.g., Tinotenda Craig Marimo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="youth_rep_title">Representative Title</label>
              <input
                type="text"
                id="youth_rep_title"
                name="youth_rep_title"
                value={formData.youth_rep_title}
                onChange={handleInputChange}
                placeholder="e.g., YPNHW District Facilitator"
              />
            </div>

            <div className="form-group">
              <label>Health Platforms</label>
              <div className="platforms-list">
                {formData.health_platforms.map((platform, index) => (
                  <div key={index} className="platform-item">
                    <span>{platform}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlatform(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="add-platform">
                <input
                  type="text"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  placeholder="Add a health platform"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlatform())}
                />
                <button type="button" onClick={handleAddPlatform} className="add-btn">
                  Add
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">Save Changes</button>
              <button type="button" onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="districts-table-container">
          <table className="districts-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Youth Representative</th>
                <th>Title</th>
                <th>Health Platforms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {districts.map(district => (
                <tr key={district.id}>
                  <td className="district-name">{district.name}</td>
                  <td>{district.youth_rep_name || <em>Not assigned</em>}</td>
                  <td>{district.youth_rep_title || <em>-</em>}</td>
                  <td>
                    <div className="platforms-preview">
                      {district.health_platforms && district.health_platforms.length > 0 ? (
                        <>
                          <span className="platform-count">
                            {district.health_platforms.length} platform{district.health_platforms.length !== 1 ? 's' : ''}
                          </span>
                          <div className="platforms-tooltip">
                            <ul>
                              {district.health_platforms.map((platform, idx) => (
                                <li key={idx}>{platform}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <em>None</em>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(district)}
                      className="edit-btn-small"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {districts.length === 0 && (
            <div className="no-districts">
              <p>No districts found. Please add district boundaries first.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default YouthRepManagement;
