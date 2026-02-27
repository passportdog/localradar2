export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      traffic_cameras: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          location: unknown;
          status: string;
          direction: string | null;
          stream_url: string | null;
          still_url: string | null;
          source: string;
          last_checked: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          location?: unknown;
          status?: string;
          direction?: string | null;
          stream_url?: string | null;
          still_url?: string | null;
          source?: string;
          last_checked?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          location?: unknown;
          status?: string;
          direction?: string | null;
          stream_url?: string | null;
          still_url?: string | null;
          source?: string;
          last_checked?: string | null;
          created_at?: string;
        };
      };
      zip_codes: {
        Row: {
          zip: string;
          city: string;
          state: string;
          latitude: number;
          longitude: number;
          location: unknown;
        };
      };
    };
    Functions: {
      get_cameras_within_radius: {
        Args: {
          center_lat: number;
          center_lng: number;
          radius_km: number;
          max_results: number;
        };
        Returns: Database['public']['Tables']['traffic_cameras']['Row'][];
      };
      get_cameras_by_zip: {
        Args: {
          zip_code: string;
          max_results: number;
        };
        Returns: Database['public']['Tables']['traffic_cameras']['Row'][];
      };
    };
  };
}
