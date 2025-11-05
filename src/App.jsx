import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ChartPanel from './components/ChartPanel';
import UploadModal from './components/UploadModal';
import './App.css';

function App() {
  const [geospatialData, setGeospatialData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2024);
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
        axios.get(`/api/geospatial-data?year=${selectedYear}`),
        axios.get('/api/trends'),
        axios.get(`/api/statistics?year=${selectedYear}`)
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
    <div className="app">
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
    </div>
  );
}

export default App;

