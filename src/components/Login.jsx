import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initAdminLoading, setInitAdminLoading] = useState(false);
  const [showInitAdmin, setShowInitAdmin] = useState(false);
  const [initAdminData, setInitAdminData] = useState({
    username: 'admin',
    email: 'admin@srhr.local',
    password: 'admin123',
    full_name: 'Administrator'
  });

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we need to show init admin form
  useEffect(() => {
    checkIfUsersExist();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const checkIfUsersExist = async () => {
    try {
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../config');
      // Try to login with dummy credentials to see if users exist
      // If it fails with "Invalid username", users exist
      // If it fails with something else, we'll show init admin
      const response = await axios.post(getApiUrl('api/auth/init-admin'), {});
      // This shouldn't succeed if users exist
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exist')) {
        setShowInitAdmin(false);
      } else {
        // No users exist, show init admin form
        setShowInitAdmin(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleInitAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setInitAdminLoading(true);

    try {
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../config');
      const response = await axios.post(getApiUrl('api/auth/init-admin'), initAdminData);
      
      // Auto-login after creating admin
      const loginResult = await login(initAdminData.username, initAdminData.password);
      if (loginResult.success) {
        navigate('/', { replace: true });
      } else {
        setError('Admin created but login failed. Please login manually.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create admin user');
    } finally {
      setInitAdminLoading(false);
    }
  };

  if (showInitAdmin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>SRHR Dashboard</h1>
            <p>Initialize Admin Account</p>
          </div>

          <form onSubmit={handleInitAdmin} className="login-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="init-username">Username</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  id="init-username"
                  type="text"
                  value={initAdminData.username}
                  onChange={(e) => setInitAdminData({ ...initAdminData, username: e.target.value })}
                  required
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="init-email">Email</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  id="init-email"
                  type="email"
                  value={initAdminData.email}
                  onChange={(e) => setInitAdminData({ ...initAdminData, email: e.target.value })}
                  required
                  placeholder="admin@srhr.local"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="init-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  id="init-password"
                  type="password"
                  value={initAdminData.password}
                  onChange={(e) => setInitAdminData({ ...initAdminData, password: e.target.value })}
                  required
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="init-fullname">Full Name</label>
              <div className="input-wrapper">
                <User size={18} />
                <input
                  id="init-fullname"
                  type="text"
                  value={initAdminData.full_name}
                  onChange={(e) => setInitAdminData({ ...initAdminData, full_name: e.target.value })}
                  placeholder="Administrator"
                />
              </div>
            </div>

            <button type="submit" className="login-button" disabled={initAdminLoading}>
              {initAdminLoading ? (
                <>
                  <Loader size={18} className="spinner" />
                  Creating Admin...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SRHR Dashboard</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <div className="input-wrapper">
              <User size={18} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Enter username or email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <Lock size={18} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

