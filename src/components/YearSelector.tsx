import { useDashboardStore } from '../store/dashboardStore';

const years = [2020, 2021, 2022, 2023, 2024];

export function YearSelector() {
  const { filterState, setFilterState } = useDashboardStore();

  return (
    <div className="year-selector">
      <h3>Select a Year</h3>
      <div className="year-buttons">
        {years.map((year) => (
          <button
            key={year}
            className={`year-btn ${filterState.selectedYear === year ? 'active' : ''}`}
            onClick={() => setFilterState({ selectedYear: year })}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}

