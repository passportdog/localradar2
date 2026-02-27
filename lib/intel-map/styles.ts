import { STATUS_COLORS } from './constants';

export const CAMERA_STYLES = {
  // Cluster circles
  cluster: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#00f0ff',
      10,
      '#00a8b3',
      50,
      '#8b5cf6',
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      15,
      10,
      20,
      50,
      30,
    ],
    'circle-opacity': 0.8,
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 2,
  },
  
  // Cluster count labels
  clusterCount: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
    'text-color': '#000',
  },
  
  // Individual camera markers
  marker: {
    'circle-color': [
      'match',
      ['get', 'status'],
      'active',
      STATUS_COLORS.active,
      'degraded',
      STATUS_COLORS.degraded,
      'dead',
      STATUS_COLORS.dead,
      STATUS_COLORS.unknown,
    ],
    'circle-radius': 8,
    'circle-stroke-color': '#00f0ff',
    'circle-stroke-width': 2,
    'circle-opacity': 0.9,
  },
};

export const TRAFFIC_LAYER_STYLE = {
  id: 'traffic',
  type: 'line',
  source: 'traffic',
  paint: {
    'line-color': [
      'match',
      ['get', 'congestion'],
      'low',
      '#22c55e',
      'moderate',
      '#eab308',
      'heavy',
      '#f97316',
      'severe',
      '#ef4444',
      '#6b7280',
    ],
    'line-width': 3,
  },
};
