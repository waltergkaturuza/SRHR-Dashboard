import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useDashboardStore } from '../store/dashboardStore';
import { ChartData } from '../types';

export function ChartSection() {
  const { healthSpaces, filterState } = useDashboardStore();

  const chartData = useMemo(() => {
    const dataByYear: { [year: number]: ChartData } = {};

    healthSpaces.forEach((space) => {
      const districtMatch =
        filterState.selectedDistricts.length === 0 ||
        filterState.selectedDistricts.includes(space.districtId);

      if (districtMatch) {
        if (!dataByYear[space.year]) {
          dataByYear[space.year] = {
            year: space.year,
            youthParticipants: 0,
            totalSpaces: 0,
            averagePerSpace: 0,
          };
        }
        dataByYear[space.year].youthParticipants += space.youthParticipants;
        dataByYear[space.year].totalSpaces += 1;
      }
    });

    return Object.values(dataByYear)
      .map((data) => ({
        ...data,
        averagePerSpace: Number((data.youthParticipants / data.totalSpaces).toFixed(1)),
      }))
      .sort((a, b) => a.year - b.year);
  }, [healthSpaces, filterState]);

  const currentYearData = useMemo(() => {
    return chartData.find((d) => d.year === filterState.selectedYear) || null;
  }, [chartData, filterState]);

  return (
    <div className="chart-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Youth Participants</div>
          <div className="stat-value">{currentYearData?.youthParticipants || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Decision Spaces</div>
          <div className="stat-value">{currentYearData?.totalSpaces || 0}</div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="chart-title">Youth Participation Trends (Ages ≤24)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="year" stroke="#a0a0a0" />
            <YAxis stroke="#a0a0a0" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#ffffff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="youthParticipants"
              stroke="#00d9ff"
              strokeWidth={2}
              name="Youth Participants"
              dot={{ fill: '#00d9ff', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="chart-title">Average Youth per Decision Space</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="year" stroke="#a0a0a0" />
            <YAxis stroke="#a0a0a0" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#ffffff',
              }}
            />
            <Legend />
            <Bar dataKey="averagePerSpace" fill="#ffd700" name="Avg Youth per Space" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="chart-subtitle">
        *Tracking young people aged 24 and below in health decision-making platforms
      </p>
    </div>
  );
}

