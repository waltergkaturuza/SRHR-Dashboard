import { useDashboardStore } from '../store/dashboardStore';
import { harareDistricts } from '../data/mockData';

export function Sidebar() {
  const { filterState, toggleDistrictSelection } = useDashboardStore();

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>District Selection</h3>
        <div className="district-list">
          {harareDistricts.map((district) => (
            <div key={district.id} className="district-item">
              <input
                type="radio"
                id={district.id}
                name="district"
                checked={filterState.selectedDistricts.includes(district.id)}
                onChange={() => toggleDistrictSelection(district.id)}
              />
              <label htmlFor={district.id}>{district.name}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

