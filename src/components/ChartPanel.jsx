import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Building2, TrendingUp, Percent } from 'lucide-react';
import './ChartPanel.css';

const ChartPanel = ({ trendData, statistics, selectedYear }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-panel">
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(0, 212, 255, 0.2)' }}>
            <Users className="stat-card-icon" style={{ color: '#00d4ff' }} />
          </div>
          <div className="stat-card-content">
            <p className="stat-card-label">Total Youth Participants</p>
            <p className="stat-card-value">{statistics?.total_youth || 0}</p>
            <p className="stat-card-sublabel">Aged 24 and below</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(255, 152, 0, 0.2)' }}>
            <Building2 className="stat-card-icon" style={{ color: '#ff9800' }} />
          </div>
          <div className="stat-card-content">
            <p className="stat-card-label">Decision-Making Platforms</p>
            <p className="stat-card-value">{statistics?.total_committees || 0}</p>
            <p className="stat-card-sublabel">Active committees</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
            <TrendingUp className="stat-card-icon" style={{ color: '#4caf50' }} />
          </div>
          <div className="stat-card-content">
            <p className="stat-card-label">Avg Youth per Platform</p>
            <p className="stat-card-value">{statistics?.average_youth_per_committee || 0}</p>
            <p className="stat-card-sublabel">Average participation</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(233, 30, 99, 0.2)' }}>
            <Percent className="stat-card-icon" style={{ color: '#e91e63' }} />
          </div>
          <div className="stat-card-content">
            <p className="stat-card-label">Youth Representation</p>
            <p className="stat-card-value">{statistics?.youth_percentage || 0}%</p>
            <p className="stat-card-sublabel">Of total members</p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3>Youth Participation Trends</h3>
          <p className="chart-subtitle">Number of young people in health decision-making platforms over time</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={trendData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="year" 
              stroke="#999"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis 
              stroke="#999"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="youth_count" 
              name="Youth Participants (≤24)"
              stroke="#00d4ff" 
              strokeWidth={3}
              dot={{ fill: '#00d4ff', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="total_count" 
              name="Total Members"
              stroke="#ff9800" 
              strokeWidth={2}
              dot={{ fill: '#ff9800', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="chart-note">
          <p>
            📊 <strong>Insight:</strong> Youth participation has increased by{' '}
            {trendData.length > 0 ? 
              Math.round(((trendData[trendData.length - 1]?.youth_count - trendData[0]?.youth_count) / 
              trendData[0]?.youth_count) * 100) : 0}% 
            {' '}from {trendData[0]?.year} to {trendData[trendData.length - 1]?.year}, 
            demonstrating growing youth engagement in SRHR decision-making.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;

