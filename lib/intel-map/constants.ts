export const MAPBOX_CONFIG = {
  style: 'mapbox://styles/mapbox/satellite-v9',
  defaultCenter: [-82.4572, 27.9506] as [number, number], // Tampa, FL
  defaultZoom: 10,
  minZoom: 4,
  maxZoom: 20,
};

export const INITIAL_VIEW_STATE = {
  latitude: 27.9506,
  longitude: -82.4572,
  zoom: 10,
  bearing: 0,
  pitch: 45,
};

// Florida bounding box for initial camera placement
export const FLORIDA_BOUNDS = {
  north: 30.9,
  south: 24.4,
  east: -80.0,
  west: -87.6,
};

// Status colors
export const STATUS_COLORS = {
  active: '#22c55e',    // green-500
  degraded: '#eab308',  // yellow-500
  dead: '#ef4444',      // red-500
  unknown: '#6b7280',   // gray-500
};

// Camera refresh interval (ms)
export const CAMERA_REFRESH_INTERVAL = 3500;
