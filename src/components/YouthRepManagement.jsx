import React, { useState, useEffect } from 'react';
import './YouthRepManagement.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Component for managing youth representative information for districts
 * Updated to support many-to-many relationships (one rep can be in many districts)
 */
const YouthRepManagement = () => {
  const [youthReps, setYouthReps] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRepForm, setShowRepForm] = useState(false);
  const [editingRep, setEditingRep] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    district_ids: []
  });
  const [healthPlatforms, setHealthPlatforms] = useState({}); // district_id -> platforms array

  // Fetch youth reps and districts
  useEffect(() => {
    fetchYouthReps();
    fetchDistricts();
  }, []);

  const fetchYouthReps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/youth-reps`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch youth representatives');
      }
      
      const data = await response.json();
      setYouthReps(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching youth reps:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/districts/youth-info`);
      
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
        
        // Extract health platforms for each district
        const platformsMap = {};
        data.forEach(district => {
          platformsMap[district.id] = district.health_platforms || [];
        });
        setHealthPlatforms(platformsMap);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleEdit = (rep) => {
    setEditingRep(rep);
    setFormData({
      name: rep.name || '',
      title: rep.title || '',
      district_ids: rep.districts ? rep.districts.map(d => d.id) : []
    });
    setShowRepForm(true);
  };

  const handleCancel = () => {
    setEditingRep(null);
    setShowRepForm(false);
    setFormData({
      name: '',
      title: '',
      district_ids: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDistrictChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      district_ids: selectedIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to manage youth representatives');
        return;
      }

      const url = editingRep 
        ? `${API_BASE_URL}/youth-reps/${editingRep.id}`
        : `${API_BASE_URL}/youth-reps`;
      
      const method = editingRep ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save youth representative');
      }

      await fetchYouthReps();
      handleCancel();
      alert(editingRep ? 'Youth representative updated successfully!' : 'Youth representative created successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error saving youth rep:', err);
    }
  };

  const handleDelete = async (repId) => {
    if (!confirm('Are you sure you want to delete this youth representative?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to delete youth representatives');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/youth-reps/${repId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete youth representative');
      }

      await fetchYouthReps();
      alert('Youth representative deleted successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error deleting youth rep:', err);
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
      <div className="youth-rep-header">
        <h2>Youth Representative Management</h2>
        <button 
          className="btn-add-rep" 
          onClick={() => {
            setEditingRep(null);
            setFormData({ name: '', title: '', district_ids: [] });
            setShowRepForm(true);
          }}
        >
          + Add Youth Representative
        </button>
      </div>

      {showRepForm && (
        <div className="rep-form-modal">
          <div className="rep-form-content">
            <div className="form-header">
              <h3>{editingRep ? 'Edit' : 'Add'} Youth Representative</h3>
              <button className="close-btn" onClick={handleCancel}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="name">Youth Representative Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Tinotenda Craig Marimo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Representative Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., YPNHW District Facilitator"
                />
              </div>

              <div className="form-group">
                <label htmlFor="district_ids">Districts * (Select multiple)</label>
                <select
                  id="district_ids"
                  name="district_ids"
                  multiple
                  required
                  size={Math.min(districts.length, 10)}
                  value={formData.district_ids.map(String)}
                  onChange={handleDistrictChange}
                  style={{ minHeight: '200px', padding: '8px' }}
                >
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name} {district.code ? `(${district.code})` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple districts
                </small>
                {formData.district_ids.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Selected ({formData.district_ids.length}):</strong>
                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {formData.district_ids.map(id => {
                        const district = districts.find(d => d.id === id);
                        return district ? (
                          <span key={id} style={{
                            background: '#e3f2fd',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {district.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingRep ? 'Update' : 'Create'} Representative
                </button>
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="reps-table-container">
        <table className="districts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Districts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {youthReps.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No youth representatives found. Click "Add Youth Representative" to create one.
                </td>
              </tr>
            ) : (
              youthReps.map(rep => (
                <tr key={rep.id}>
                  <td className="rep-name">{rep.name}</td>
                  <td>{rep.title || <em>-</em>}</td>
                  <td>
                    {rep.districts && rep.districts.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {rep.districts.map((district, idx) => (
                          <span key={district.id} style={{
                            background: '#e3f2fd',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {district.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <em>No districts assigned</em>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(rep)}
                      className="edit-btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rep.id)}
                      className="delete-btn-small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YouthRepManagement;
