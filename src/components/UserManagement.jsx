import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { Plus, Edit2, Trash2, Save, X, Shield, User as UserIcon, Mail, Lock, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './UserManagement.css';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    full_name: ''
  });
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    { value: 'viewer', label: 'Viewer', description: 'Read-only access', color: '#4caf50' },
    { value: 'editor', label: 'Editor', description: 'Can upload, edit, and delete data', color: '#ff9800' },
    { value: 'admin', label: 'Admin', description: 'Full access including user management', color: '#f44336' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('api/auth/users'));
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(getApiUrl('api/auth/register'), newUser);
      setSuccess('User created successfully');
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        full_name: ''
      });
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name || '',
      is_active: user.is_active,
      password: '' // Don't pre-fill password
    });
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = { ...editForm };
      // Remove password if empty
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await axios.put(getApiUrl(`api/auth/users/${editingId}`), updateData);
      setSuccess('User updated successfully');
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(getApiUrl(`api/auth/users/${userId}`));
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[0];
  };

  const getPermissions = (role) => {
    const permissions = {
      viewer: ['View dashboard', 'View data'],
      editor: ['View dashboard', 'View data', 'Upload data', 'Edit data', 'Delete data'],
      admin: ['View dashboard', 'View data', 'Upload data', 'Edit data', 'Delete data', 'Manage users', 'Manage settings']
    };
    return permissions[role] || [];
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h2>User Management</h2>
          <p>Manage user accounts and access roles</p>
        </div>
        <button className="btn-add-user" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          Add User
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <X size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <UserCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      {showAddForm && (
        <div className="user-form-card">
          <div className="form-header">
            <h3>Create New User</h3>
            <button className="btn-close" onClick={() => {
              setShowAddForm(false);
              setError('');
              setNewUser({
                username: '',
                email: '',
                password: '',
                role: 'viewer',
                full_name: ''
              });
            }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <UserIcon size={16} />
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Lock size={16} />
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  placeholder="Enter password"
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>
                  <Shield size={16} />
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>
                <UserIcon size={16} />
                Full Name
              </label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Optional full name"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-save">
                <Save size={18} />
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={editingId === user.id ? 'editing' : ''}>
                {editingId === user.id ? (
                  <>
                    <td colSpan="6">
                      <form onSubmit={handleSaveEdit} className="edit-form-inline">
                        <div className="edit-form-fields">
                          <div className="form-group-inline">
                            <label>Username</label>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group-inline">
                            <label>Email</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group-inline">
                            <label>Role</label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              required
                            >
                              {roles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group-inline">
                            <label>Full Name</label>
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            />
                          </div>
                          <div className="form-group-inline">
                            <label>New Password (optional)</label>
                            <input
                              type="password"
                              value={editForm.password}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              placeholder="Leave empty to keep current"
                            />
                          </div>
                          <div className="form-group-inline">
                            <label>Status</label>
                            <select
                              value={editForm.is_active ? 'active' : 'inactive'}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div className="edit-form-actions">
                          <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>
                            <X size={16} />
                            Cancel
                          </button>
                          <button type="submit" className="btn-save">
                            <Save size={16} />
                            Save
                          </button>
                        </div>
                      </form>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <div className="user-name">{user.full_name || user.username}</div>
                          <div className="user-details">
                            <span>{user.username}</span>
                            <span>•</span>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge" style={{ backgroundColor: getRoleInfo(user.role).color }}>
                        {getRoleInfo(user.role).label}
                      </span>
                    </td>
                    <td>
                      <div className="permissions-list">
                        {getPermissions(user.role).slice(0, 3).map((perm, idx) => (
                          <span key={idx} className="permission-tag">{perm}</span>
                        ))}
                        {getPermissions(user.role).length > 3 && (
                          <span className="permission-more">+{getPermissions(user.role).length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span className="status-badge status-active">
                          <UserCheck size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">
                          <UserX size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      {user.last_login ? (
                        <span className="last-login">
                          {new Date(user.last_login).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="last-login never">Never</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(user)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Cannot edit your own account' : 'Edit user'}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="role-info-section">
        <h3>Role Permissions</h3>
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.value} className="role-card">
              <div className="role-header" style={{ borderLeftColor: role.color }}>
                <Shield size={20} style={{ color: role.color }} />
                <h4>{role.label}</h4>
              </div>
              <p className="role-description">{role.description}</p>
              <div className="role-permissions">
                <strong>Permissions:</strong>
                <ul>
                  {getPermissions(role.value).map((perm, idx) => (
                    <li key={idx}>{perm}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

