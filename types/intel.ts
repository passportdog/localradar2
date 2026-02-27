export type CameraStatus = 'active' | 'inactive' | 'degraded';

export interface Camera {
  id: string;
  camera_id: string;
  name: string;
  intersection: string | null;
  lat: number;
  lng: number;
  stream_url: string | null;
  snapshot_url: string | null;
  state: string;
  status: CameraStatus;
  last_checked: string | null;
  created_at: string;
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
