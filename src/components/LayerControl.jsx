import React from 'react';
import { School, Church, Shield, ShoppingBag, Building2, Heart, Eye, EyeOff } from 'lucide-react';
import './LayerControl.css';

const LayerControl = ({ visibleLayers, onToggleLayer, layerCounts }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const layers = [
    {
      id: 'boundaries',
      name: 'Boundaries',
      icon: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      color: '#ffeb3b',
      count: 6
    },
    {
      id: 'health',
      name: 'Health',
      icon: Heart,
      color: '#ff4444',
      count: layerCounts?.health || 0
    },
    {
      id: 'clinic',
      name: 'Clinics',
      icon: Heart,
      color: '#f48fb1',
      count: layerCounts?.clinic || 0
    },
    {
      id: 'school-primary',
      name: 'Primary',
      icon: School,
      color: '#4caf50',
      count: layerCounts?.schoolPrimary || 0
    },
    {
      id: 'school-secondary',
      name: 'Secondary',
      icon: School,
      color: '#2196f3',
      count: layerCounts?.schoolSecondary || 0
    },
    {
      id: 'school-tertiary',
      name: 'Tertiary',
      icon: School,
      color: '#9c27b0',
      count: layerCounts?.schoolTertiary || 0
    },
    {
      id: 'church',
      name: 'Churches',
      icon: Church,
      color: '#ff9800',
      count: layerCounts?.church || 0
    },
    {
      id: 'police',
      name: 'Police',
      icon: Shield,
      color: '#1976d2',
      count: layerCounts?.police || 0
    },
    {
      id: 'shop',
      name: 'Shops',
      icon: ShoppingBag,
      color: '#e91e63',
      count: layerCounts?.shop || 0
    },
    {
      id: 'office',
      name: 'Offices',
      icon: Building2,
      color: '#607d8b',
      count: layerCounts?.office || 0
    }
  ];

  return (
    <div className="layer-control-panel">
      <div className="layer-control-header">
        <h3>Map Layers</h3>
        <button 
          className="toggle-expand"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="layer-control-content">
          <div className="layer-actions">
            <button 
              className="btn-layer-action"
              onClick={() => layers.forEach(layer => onToggleLayer(layer.id, true))}
            >
              <Eye size={14} /> Show All
            </button>
            <button 
              className="btn-layer-action"
              onClick={() => layers.forEach(layer => onToggleLayer(layer.id, false))}
            >
              <EyeOff size={14} /> Hide All
            </button>
          </div>

          <div className="layer-list">
            {layers.map(layer => {
              const Icon = layer.icon;
              const isVisible = visibleLayers[layer.id];

              return (
                <div 
                  key={layer.id}
                  className={`layer-item ${isVisible ? 'active' : 'inactive'}`}
                  onClick={() => onToggleLayer(layer.id, !isVisible)}
                >
                  <div className="layer-info">
                    <div 
                      className="layer-icon"
                      style={{ 
                        backgroundColor: isVisible ? layer.color : '#666',
                        opacity: isVisible ? 1 : 0.5
                      }}
                    >
                      <Icon size={16} color="white" />
                    </div>
                    <div className="layer-details">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-count">{layer.count} locations</span>
                    </div>
                  </div>
                  <div className="layer-toggle">
                    <div className={`toggle-switch ${isVisible ? 'on' : 'off'}`}>
                      <div className="toggle-knob"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerControl;

