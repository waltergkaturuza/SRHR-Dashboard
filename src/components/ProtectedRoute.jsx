import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole = 'viewer' }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <Loader size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(requiredRole)) {
    // User doesn't have required role
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1a1a1a',
        color: '#fff',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#f44336', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ color: '#999', marginBottom: '2rem' }}>
          You don't have permission to access this page. Required role: <strong>{requiredRole}</strong>
        </p>
        <a href="/" style={{ color: '#00d4ff', textDecoration: 'none' }}>Return to Dashboard</a>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

