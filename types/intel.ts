export type CameraStatus = 'active' | 'degraded' | 'dead' | 'unknown';

export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: CameraStatus;
  direction?: string;
  stream_url?: string;
  still_url?: string;
  source?: string;
  last_checked?: string;
  created_at?: string;
}

export interface MapState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface CameraCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  cameras: Camera[];
}

export interface LayerConfig {
  cameras: boolean;
  traffic: boolean;
  terrain: boolean;
  buildings3d: boolean;
}
