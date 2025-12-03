import { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { getApiUrl } from '../config';

export function YearSelector() {
  const { filterState, setFilterState } = useDashboardStore();
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available years from API
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(getApiUrl('api/years'));
        const data = await response.json();
        
        if (data.years && data.years.length > 0) {
          // Sort years descending (newest first)
          const sortedYears = [...data.years].sort((a, b) => b - a);
          setYears(sortedYears);
          
          // Set default to current year (2025) or latest available year
          const currentYear = new Date().getFullYear();
          const defaultYear = sortedYears.includes(currentYear) 
            ? currentYear 
            : Math.max(...sortedYears);
          
          // Only set default if no year is currently selected or if it's still 2024
          if (!filterState.selectedYear || filterState.selectedYear === 2024) {
            setFilterState({ selectedYear: defaultYear });
          }
        } else {
          // Fallback: use current year and recent years
          const currentYear = new Date().getFullYear();
          const fallbackYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
          setYears(fallbackYears);
          if (!filterState.selectedYear || filterState.selectedYear === 2024) {
            setFilterState({ selectedYear: currentYear });
          }
        }
      } catch (error) {
        console.error('Error fetching years:', error);
        // Fallback on error
        const currentYear = new Date().getFullYear();
        const fallbackYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
        setYears(fallbackYears);
        if (!filterState.selectedYear || filterState.selectedYear === 2024) {
          setFilterState({ selectedYear: currentYear });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []); // Only run once on mount

  if (loading) {
    return (
      <div className="year-selector">
        <h3>Select a Year</h3>
        <div className="year-buttons">
          <div>Loading years...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="year-selector">
      <h3>Select a Year</h3>
      <div className="year-buttons" style={{ maxHeight: '200px', overflowY: 'auto' }}>
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

