// API Configuration
// This file determines which backend URL to use

const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     (import.meta.env.MODE === 'production' 
                       ? 'https://srhr-dashboard.onrender.com'
                       : 'http://localhost:5000');

export const API_URL = API_BASE_URL;

// Helper function to build API URLs
export const getApiUrl = (endpoint) => {
  // If endpoint already starts with http, return as is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default {
  API_URL,
  getApiUrl
};

