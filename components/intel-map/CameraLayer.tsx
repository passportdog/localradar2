'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Camera } from '@/types/intel';
import { CAMERA_STYLES } from '@/lib/intel-map/styles';

interface CameraLayerProps {
  map: mapboxgl.Map;
  onCameraSelect: (camera: Camera) => void;
}

export function CameraLayer({ map, onCameraSelect }: CameraLayerProps) {
  const camerasRef = useRef<Camera[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  // Fetch cameras
  const fetchCameras = useCallback(async () => {
    const center = map.getCenter();
    const bounds = map.getBounds();
    
    if (!bounds) return;
    
    const radius = Math.ceil(bounds.getNorthEast().distanceTo(bounds.getSouthWest()) / 2000);
    
    try {
      const res = await fetch(
        `/api/cameras?lat=${center.lat}&lng=${center.lng}&radius=${Math.min(radius, 100)}`
      );
      const data = await res.json();
      camerasRef.current = data.cameras || [];
      
      updateCameraSource();
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    }
  }, [map]);
  
  // Update GeoJSON source
  const updateCameraSource = useCallback(() => {
    const source = map.getSource('cameras') as mapboxgl.GeoJSONSource;
    
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: camerasRef.current.map(cam => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [cam.longitude, cam.latitude],
          },
          properties: {
            id: cam.id,
            name: cam.name,
            status: cam.status,
            direction: cam.direction,
            streamUrl: cam.stream_url,
            stillUrl: cam.still_url,
          },
        })),
      });
    }
  }, [map]);
  
  // Initialize layer
  useEffect(() => {
    if (!map) return;
    
    // Add source
    map.addSource('cameras', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    
    // Add cluster layer
    map.addLayer({
      id: 'camera-clusters',
      type: 'circle',
      source: 'cameras',
      filter: ['has', 'point_count'],
      paint: CAMERA_STYLES.cluster,
    });
    
    // Add cluster count
    map.addLayer({
      id: 'camera-cluster-count',
      type: 'symbol',
      source: 'cameras',
      filter: ['has', 'point_count'],
      layout: CAMERA_STYLES.clusterCount,
    });
    
    // Add individual camera markers
    map.addLayer({
      id: 'camera-markers',
      type: 'circle',
      source: 'cameras',
      filter: ['!', ['has', 'point_count']],
      paint: CAMERA_STYLES.marker,
    });
    
    // Click handler
    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      
      const feature = e.features[0];
      const props = feature.properties;
      
      if (!props) return;
      
      // If it's a cluster, zoom in
      if (props.cluster) {
        const source = map.getSource('cameras') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(Number(props.cluster_id), (err, zoom) => {
          if (err || !zoom) return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom });
        });
        return;
      }
      
      // Individual camera clicked
      const camera: Camera = {
        id: props.id,
        name: props.name,
        latitude: (feature.geometry as GeoJSON.Point).coordinates[1],
        longitude: (feature.geometry as GeoJSON.Point).coordinates[0],
        status: props.status,
        direction: props.direction,
        stream_url: props.streamUrl,
        still_url: props.stillUrl,
      };
      
      onCameraSelect(camera);
    };
    
    // Hover handlers
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    
    map.on('click', 'camera-markers', handleClick);
    map.on('click', 'camera-clusters', handleClick);
    map.on('mouseenter', 'camera-markers', handleMouseEnter);
    map.on('mouseleave', 'camera-markers', handleMouseLeave);
    map.on('mouseenter', 'camera-clusters', handleMouseEnter);
    map.on('mouseleave', 'camera-clusters', handleMouseLeave);
    
    // Initial fetch
    fetchCameras();
    
    // Refresh on move end
    const handleMoveEnd = () => {
      fetchCameras();
    };
    
    map.on('moveend', handleMoveEnd);
    
    // Periodic refresh every 30s
    const interval = setInterval(fetchCameras, 30000);
    
    return () => {
      clearInterval(interval);
      map.off('moveend', handleMoveEnd);
      map.off('click', 'camera-markers', handleClick);
      map.off('click', 'camera-clusters', handleClick);
      map.off('mouseenter', 'camera-markers', handleMouseEnter);
      map.off('mouseleave', 'camera-markers', handleMouseLeave);
      map.off('mouseenter', 'camera-clusters', handleMouseEnter);
      map.off('mouseleave', 'camera-clusters', handleMouseLeave);
      
      if (map.getLayer('camera-markers')) map.removeLayer('camera-markers');
      if (map.getLayer('camera-clusters')) map.removeLayer('camera-clusters');
      if (map.getLayer('camera-cluster-count')) map.removeLayer('camera-cluster-count');
      if (map.getSource('cameras')) map.removeSource('cameras');
      popupRef.current?.remove();
    };
  }, [map, fetchCameras, onCameraSelect]);
  
  return null;
}
