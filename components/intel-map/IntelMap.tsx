'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapState, Camera } from '@/types/intel';
import { MAPBOX_CONFIG, INITIAL_VIEW_STATE } from '@/lib/intel-map/constants';
import { CameraLayer } from './CameraLayer';
import { CameraPanel } from './CameraPanel';
import { LayerToggle } from './LayerToggle';
import { MapControls } from './MapControls';
import { SearchBar } from './SearchBar';

interface IntelMapProps {
  initialState?: Partial<MapState>;
  onStateChange?: (state: MapState) => void;
}

export default function IntelMap({ initialState, onStateChange }: IntelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapState, setMapState] = useState<MapState>({
    ...INITIAL_VIEW_STATE,
    ...initialState,
  });
  
  // Layer toggles
  const [layers, setLayers] = useState({
    cameras: true,
    traffic: false,
    terrain: false,
    buildings3d: true,
  });
  
  // Selected camera
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [nearbyCameras, setNearbyCameras] = useState<Camera[]>([]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom,
      bearing: mapState.bearing,
      pitch: mapState.pitch,
      attributionControl: false,
    });
    
    newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    newMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    newMap.on('load', () => {
      setIsLoaded(true);
      
      // Add DEM source for terrain
      newMap.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      
      // Add 3D buildings (only if composite source exists - not available on satellite)
      try {
        if (newMap.getSource('composite')) {
          newMap.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#1a1a2e',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.8,
            },
          });
        }
      } catch {
        // 3D buildings not available on this style
      }
      
      // Set atmosphere
      newMap.setFog({
        color: 'rgb(10, 10, 15)',
        'high-color': 'rgb(20, 20, 35)',
        'horizon-blend': 0.4,
        'space-color': 'rgb(10, 10, 15)',
      });
    });
    
    newMap.on('moveend', () => {
      const center = newMap.getCenter();
      const newState: MapState = {
        latitude: center.lat,
        longitude: center.lng,
        zoom: newMap.getZoom(),
        bearing: newMap.getBearing(),
        pitch: newMap.getPitch(),
      };
      setMapState(newState);
      onStateChange?.(newState);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('lat', newState.latitude.toFixed(6));
      url.searchParams.set('lng', newState.longitude.toFixed(6));
      url.searchParams.set('zoom', newState.zoom.toFixed(2));
      url.searchParams.set('pitch', newState.pitch.toFixed(0));
      url.searchParams.set('bearing', newState.bearing.toFixed(0));
      window.history.replaceState({}, '', url);
    });
    
    map.current = newMap;
    
    return () => {
      newMap.remove();
      map.current = null;
    };
  }, []);
  
  // Handle layer toggles
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    
    // Terrain
    map.current.setTerrain(layers.terrain ? { source: 'mapbox-dem', exaggeration: 1.5 } : null);
    
    // 3D Buildings visibility (only if layer exists)
    if (map.current.getLayer('3d-buildings')) {
      try {
        map.current.setLayoutProperty('3d-buildings', 'visibility', layers.buildings3d ? 'visible' : 'none');
      } catch {
        // Layer might not exist
      }
    }
  }, [layers, isLoaded]);
  
  // Handle camera selection
  const handleCameraSelect = useCallback(async (camera: Camera) => {
    setSelectedCamera(camera);
    
    // Fetch nearby cameras
    try {
      const res = await fetch(`/api/cameras?lat=${camera.latitude}&lng=${camera.longitude}&radius=5&limit=6`);
      const data = await res.json();
      setNearbyCameras(data.cameras?.filter((c: Camera) => c.id !== camera.id) || []);
    } catch {
      setNearbyCameras([]);
    }
  }, []);
  
  // Search handler
  const handleSearch = useCallback((location: { lat: number; lng: number; name: string }) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 13,
      duration: 1500,
    });
  }, []);
  
  // Get user's location
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation || !map.current) return;
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          duration: 1000,
        });
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Camera Layer */}
      {isLoaded && map.current && layers.cameras && (
        <CameraLayer
          map={map.current}
          onCameraSelect={handleCameraSelect}
        />
      )}
      
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-16 md:right-auto md:w-96 z-10">
        <SearchBar onSelect={handleSearch} />
      </div>
      
      {/* Layer Toggles */}
      <div className="absolute bottom-8 left-4 z-10">
        <LayerToggle layers={layers} onChange={setLayers} />
      </div>
      
      {/* Map Controls */}
      <div className="absolute bottom-8 right-4 z-10">
        <MapControls onLocate={handleLocate} />
      </div>
      
      {/* Camera Panel */}
      <CameraPanel
        camera={selectedCamera}
        nearbyCameras={nearbyCameras}
        onClose={() => setSelectedCamera(null)}
        onSelectNearby={handleCameraSelect}
      />
    </div>
  );
}
