import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Settings, BarChart3 } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
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
        
        <NavLink 
          to="/admin" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          title="Admin Panel"
        >
          <Settings size={20} />
          <span>Admin Panel</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;

