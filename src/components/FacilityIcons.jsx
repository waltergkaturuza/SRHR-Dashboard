import L from 'leaflet';

// Create custom HTML icon markers for different facility types
export const createCustomIcon = (category, subType = '', color = '#00d4ff', size = 'medium') => {
  const sizeMap = {
    small: { iconSize: [25, 25], className: 'custom-icon-small' },
    medium: { iconSize: [32, 32], className: 'custom-icon-medium' },
    large: { iconSize: [40, 40], className: 'custom-icon-large' }
  };

  const { iconSize, className } = sizeMap[size] || sizeMap.medium;

  const iconHTML = getIconHTML(category, subType, color);

  return L.divIcon({
    html: iconHTML,
    className: `custom-marker ${className}`,
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]]
  });
};

// Get icon HTML based on category
const getIconHTML = (category, subType, color) => {
  const icons = {
    health: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1">
        <path d="M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm3 11h-2v2H8v-2H6v-2h2v-2h2v2h2v2z"/>
      </svg>
    `,
    clinic: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
      </svg>
    `,
    school: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
      </svg>
    `,
    church: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
        <path d="M18 12h-2V9h-1V7h1V4h-3v3h-2V4H8v3h1v2H8v3H6v7h5v-5h2v5h5v-7zM10 6h1v1h-1V6zm3 0h1v1h-1V6z"/>
      </svg>
    `,
    police: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h5c-.47 2.48-2.05 4.64-5 5.65V13H7v-.01h5z"/>
      </svg>
    `,
    shop: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
      </svg>
    `,
    office: `
      <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    `
  };

  return `
    <div style="
      background-color: white;
      border: 2px solid ${color};
      border-radius: 50%;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      ${icons[category] || icons.office}
    </div>
  `;
};

// Color scheme for different categories
export const getCategoryColor = (category, subType = '') => {
  const colors = {
    health: '#ff4444',
    clinic: '#f48fb1',
    school: {
      primary: '#4caf50',
      secondary: '#2196f3',
      tertiary: '#9c27b0',
      default: '#4caf50'
    },
    church: '#ff9800',
    police: '#1976d2',
    shop: '#e91e63',
    office: '#607d8b'
  };

  if (category === 'school' && colors.school[subType]) {
    return colors.school[subType];
  }
  
  return typeof colors[category] === 'object' ? colors[category].default : colors[category];
};

// Get display name for facility category
export const getCategoryDisplayName = (category, subType = '') => {
  const names = {
    health: 'Health Platforms',
    school: {
      primary: 'Primary Schools',
      secondary: 'Secondary Schools',
      tertiary: 'Tertiary Institutions',
      default: 'Schools'
    },
    church: 'Churches',
    police: 'Police Stations',
    shop: 'Shops & Markets',
    office: 'Government Offices'
  };

  if (category === 'school' && subType && names.school[subType]) {
    return names.school[subType];
  }

  return typeof names[category] === 'object' ? names[category].default : names[category];
};

export default {
  createCustomIcon,
  getCategoryColor,
  getCategoryDisplayName
};

