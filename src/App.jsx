import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from './config';
import Header from './components/Header';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ChartPanel from './components/ChartPanel';
import UploadModal from './components/UploadModal';
import AdminDashboard from './components/AdminDashboard';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function DashboardView() {
  const [geospatialData, setGeospatialData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  // Default to current year (2025)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Fetch data on component mount and year change
  useEffect(() => {
    fetchAllData();
  }, [selectedYear]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [geoResponse, trendResponse, statsResponse] = await Promise.all([
        axios.get(getApiUrl(`api/geospatial-data?year=${selectedYear}`)),
        axios.get(getApiUrl('api/trends')),
        axios.get(getApiUrl(`api/statistics?year=${selectedYear}`))
      ]);

      setGeospatialData(geoResponse.data);
      setTrendData(trendResponse.data);
      setStatistics(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchAllData();
  };

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
  };

  return (
    <>
      <Header 
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />
      
      <div className="app-content">
        <Sidebar 
          geospatialData={geospatialData}
          selectedFeature={selectedFeature}
          onFeatureSelect={handleFeatureClick}
          selectedYear={selectedYear}
        />
        
        <div className="main-content">
          <MapView 
            geospatialData={geospatialData}
            selectedYear={selectedYear}
            onFeatureClick={handleFeatureClick}
            selectedFeature={selectedFeature}
            loading={loading}
          />
          
          <ChartPanel 
            trendData={trendData}
            statistics={statistics}
            selectedYear={selectedYear}
          />
        </div>
      </div>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

