import React from 'react';
import { Upload, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

const Header = ({ selectedYear, onYearChange, onUploadClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [years, setYears] = React.useState([2024]);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Fetch available years from API
  React.useEffect(() => {
    fetch('/api/years')
      .then(res => res.json())
      .then(data => {
        if (data.years && data.years.length > 0) {
          setYears(data.years);
        }
      })
      .catch(err => console.error('Error fetching years:', err));
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
        
        <div className="year-selector">
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="year-dropdown">
            <span className="year-label">Select a year</span>
            <span className="year-value">{selectedYear}</span>
            {isMenuOpen && (
              <div className="year-menu">
                {years.map(year => (
                  <button
                    key={year}
                    className={`year-option ${year === selectedYear ? 'active' : ''}`}
                    onClick={() => {
                      onYearChange(year);
                      setIsMenuOpen(false);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

