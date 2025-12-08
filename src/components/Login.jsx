import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader, Eye, EyeOff, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        <div className="brand-header">
          <h1 className="brand-name">
            <span className="brand-part-1">SRHR</span>
            <span className="brand-part-2">Dashboard</span>
          </h1>
          <p className="welcome-text">Initialize Admin Account</p>
        </div>

        <div className="login-card">
          <h2 className="login-title">Create Admin</h2>

          <form onSubmit={handleInitAdmin} className="login-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <Mail size={18} />
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
              <div className="input-wrapper password-wrapper">
                <Lock size={18} />
                <input
                  id="init-password"
                  type={showPassword ? "text" : "password"}
                  value={initAdminData.password}
                  onChange={(e) => setInitAdminData({ ...initAdminData, password: e.target.value })}
                  required
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
      <div className="brand-header">
        <h1 className="brand-name">
          <span className="brand-part-1">SRHR</span>
          <span className="brand-part-2">Dashboard</span>
        </h1>
        <p className="welcome-text">Welcome back</p>
      </div>

      <div className="login-card">
        <h2 className="login-title">Login</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="admin@srhr.local"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper password-wrapper">
              <Lock size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); }}>
              Forgot your password?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-login">
            <button type="button" className="social-button google-button">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.965-2.18l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.947 10.702c-.18-.54-.282-1.117-.282-1.702s.102-1.162.282-1.702V4.966H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.034l2.99-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.966L3.947 7.3C4.66 5.163 6.65 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
          </div>

          <div className="signup-link">
            <span>Don't have an account?</span>
            <a href="#" onClick={(e) => { e.preventDefault(); }}>
              Signup
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

