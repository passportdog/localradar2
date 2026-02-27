/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format coordinates for display
 */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Check if coordinates are within Florida bounds
 */
export function isInFlorida(lat: number, lng: number): boolean {
  return lat >= 24.4 && lat <= 30.9 && lng >= -87.6 && lng <= -80.0;
}

/**
 * Generate a shareable URL for map state
 */
export function generateShareUrl(state: {
  lat: number;
  lng: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}): string {
  const params = new URLSearchParams({
    lat: state.lat.toFixed(6),
    lng: state.lng.toFixed(6),
    zoom: state.zoom.toFixed(2),
    ...(state.pitch && { pitch: state.pitch.toString() }),
    ...(state.bearing && { bearing: state.bearing.toString() }),
  });
  return `${window.location.origin}/explore?${params}`;
}
