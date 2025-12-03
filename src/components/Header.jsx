import React from 'react';
import { Upload, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const Header = ({ selectedYear, onYearChange, onUploadClick }) => {
  const { theme, toggleTheme } = useTheme();
  // Default to current year
  const currentYear = new Date().getFullYear();
  const [years, setYears] = React.useState([currentYear]);

  // Fetch available years from API
  React.useEffect(() => {
    import('../config').then(({ getApiUrl }) => {
      fetch(getApiUrl('api/years'))
        .then(res => res.json())
        .then(data => {
          console.log('Available years from API:', data.years);
          if (data.years && data.years.length > 0) {
            setYears(data.years);
          }
        })
        .catch(err => console.error('Error fetching years:', err));
    });
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">SRHR Geospatial Dashboard</h1>
        <span className="header-subtitle">Harare District Health Decision-Making Spaces</span>
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button 
          className="upload-btn"
          onClick={onUploadClick}
          title="Upload Geospatial Data"
        >
          <Upload size={18} />
          <span>Upload Data</span>
        </button>
        
        <div className="year-selector-inline">
          <span className="year-label-inline">Year:</span>
          <div className="year-chips-inline">
            {years.sort((a, b) => a - b).map(year => (
              <button
                key={year}
                className={`year-chip-inline ${year === selectedYear ? 'active' : ''}`}
                onClick={() => onYearChange(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

