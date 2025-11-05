import { useEffect } from 'react';
import { Menu, MapPin } from 'lucide-react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { YearSelector } from './components/YearSelector';
import { ChartSection } from './components/ChartSection';
import { UploadForm } from './components/UploadForm';
import { useDashboardStore } from './store/dashboardStore';
import { harareDistricts, healthDecisionSpaces } from './data/mockData';
import './App.css';

function App() {
  const { filterState, setDistricts, setHealthSpaces } = useDashboardStore();

  useEffect(() => {
    setDistricts(harareDistricts);
    setHealthSpaces(healthDecisionSpaces);
  }, [setDistricts, setHealthSpaces]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <MapPin size={32} color="#00d9ff" />
          <h1>SRHR Geospatial Dashboard</h1>
        </div>
        <div className="year-badge">
          <Menu size={20} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Select a year
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00d9ff', marginTop: '0.25rem' }}>
            {filterState.selectedYear}
          </div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <YearSelector />
          <Sidebar />
          <UploadForm />
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Map />
          <ChartSection />
        </main>
      </div>
    </div>
  );
}

export default App;

