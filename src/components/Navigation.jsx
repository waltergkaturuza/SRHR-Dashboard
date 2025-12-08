import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Map, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, hasRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="main-navigation">
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          title="Dashboard View"
        >
          <Map size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        {isAuthenticated && hasRole('admin') && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            title="Admin Panel"
          >
            <Settings size={20} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </div>

      <div className="nav-user">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <UserIcon size={18} />
              <span className="username">{user?.username || 'User'}</span>
              <span className="user-role">{user?.role || 'viewer'}</span>
            </div>
            <button onClick={handleLogout} className="logout-button" title="Logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" className="login-link">
            <UserIcon size={18} />
            <span>Login</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

