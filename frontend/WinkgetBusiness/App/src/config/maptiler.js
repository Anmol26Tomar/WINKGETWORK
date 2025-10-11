// MapTiler Configuration
// Get your free API key from: https://www.maptiler.com/

export const MAPTILER_CONFIG = {
  // Replace with your actual MapTiler API key
  // You can get a free API key at https://www.maptiler.com/
  API_KEY: process.env.EXPO_PUBLIC_MAPTILER_KEY || 'YOUR_MAPTILER_API_KEY_HERE',
  
  // Map style options (Google Maps compatible)
  STYLES: {
    STREETS: 'streets-v2',           // Google Maps-like street view
    SATELLITE: 'satellite',          // Google Earth-like satellite
    HYBRID: 'hybrid',                // Satellite with labels
    OUTDOORS: 'outdoors-v2',         // Google Maps terrain-like
    LIGHT: 'light-v2',               // Google Maps light theme
    DARK: 'dark-v2',                 // Google Maps dark theme
    WINTER: 'winter-v2',             // Winter theme
    GOOGLE_STREETS: 'streets-v2',    // Google Maps street style
    GOOGLE_SATELLITE: 'satellite',   // Google Earth satellite
    GOOGLE_HYBRID: 'hybrid'          // Google Maps hybrid
  },
  
  // Default map style
  DEFAULT_STYLE: 'streets-v2',
  
  // Default map settings
  DEFAULT_ZOOM: 15,
  DEFAULT_PITCH: 0,
  DEFAULT_BEARING: 0,
  
  // Location settings
  LOCATION_TIMEOUT: 10000,
  LOCATION_MAX_AGE: 60000,
  LOCATION_ACCURACY: 6,
};

// Helper function to get MapTiler style URL
export const getMapTilerStyleUrl = (style = MAPTILER_CONFIG.DEFAULT_STYLE) => {
  console.log('MapTiler API Key:', MAPTILER_CONFIG.API_KEY);
  
  if (!MAPTILER_CONFIG.API_KEY || MAPTILER_CONFIG.API_KEY === 'YOUR_MAPTILER_API_KEY_HERE') {
    console.warn('MapTiler API key not configured. Please add your API key to environment variables or maptiler.js');
    return null;
  }
  
  return `https://api.maptiler.com/maps/${style}/style.json?key=${MAPTILER_CONFIG.API_KEY}`;
};

// Helper function to get MapTiler tile URL
export const getMapTilerTileUrl = (style = MAPTILER_CONFIG.DEFAULT_STYLE) => {
  if (!MAPTILER_CONFIG.API_KEY || MAPTILER_CONFIG.API_KEY === 'YOUR_MAPTILER_API_KEY_HERE') {
    console.warn('MapTiler API key not configured. Please add your API key to environment variables or maptiler.js');
    return null;
  }
  
  return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_CONFIG.API_KEY}`;
};
