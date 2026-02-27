'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface RoadSegment {
  coordinates: [number, number][];
  length: number;
  highway: string;
}

interface Particle {
  segmentIndex: number;
  position: number; // 0 to 1 along segment
  speed: number;
  direction: 1 | -1;
}

interface TrafficParticlesProps {
  map: mapboxgl.Map;
  enabled: boolean;
}

const MAX_PARTICLES = 2000;
const PARTICLE_COUNT = 500;
const UPDATE_INTERVAL = 2; // Update Mapbox every 2 frames
const ROAD_SAMPLE_DISTANCE = 0.0001; // ~10m in degrees

export function TrafficParticles({ map, enabled }: TrafficParticlesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const roadsRef = useRef<RoadSegment[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const isFetchingRef = useRef(false);
  const lastBoundsRef = useRef<string>('');

  // Fetch road data from Overpass API
  const fetchRoads = useCallback(async () => {
    if (!map || isFetchingRef.current) return;
    
    const bounds = map.getBounds();
    if (!bounds) return;

    // Check if we've moved significantly
    const boundsKey = `${bounds.getWest().toFixed(3)},${bounds.getSouth().toFixed(3)},${bounds.getEast().toFixed(3)},${bounds.getNorth().toFixed(3)}`;
    if (boundsKey === lastBoundsRef.current && roadsRef.current.length > 0) return;
    lastBoundsRef.current = boundsKey;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      
      // Fetch main roads first
      const mainRoadsQuery = `[out:json];way["highway"~"^(motorway|trunk|primary|secondary)$"](${bbox});(._;>;);out geom;`;
      const mainRoads = await fetchOverpassData(mainRoadsQuery);
      
      // Then fetch residential/tertiary (limit to prevent crash)
      const smallRoadsQuery = `[out:json];way["highway"~"^(tertiary|residential)$"](${bbox});(._;>;);out geom 500;`;
      const smallRoads = await fetchOverpassData(smallRoadsQuery);
      
      const allWays = [...mainRoads, ...smallRoads];
      roadsRef.current = parseRoadSegments(allWays);
      
      // Initialize particles
      initParticles();
      
      // Add/update source
      updateParticleSource();
      
    } catch (err) {
      console.error('Failed to fetch roads:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [map]);

  const fetchOverpassData = async (query: string) => {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
    
    const data = await response.json();
    return data.elements?.filter((e: any) => e.type === 'way' && e.geometry) || [];
  };

  const parseRoadSegments = (ways: any[]): RoadSegment[] => {
    const segments: RoadSegment[] = [];
    
    for (const way of ways) {
      if (!way.geometry || way.geometry.length < 2) continue;
      
      const coords: [number, number][] = way.geometry.map((g: any) => [g.lon, g.lat]);
      
      // Sample points every ~10m
      const sampledCoords = sampleLine(coords, ROAD_SAMPLE_DISTANCE);
      
      segments.push({
        coordinates: sampledCoords,
        length: calculateLength(sampledCoords),
        highway: way.tags?.highway || 'unknown',
      });
    }
    
    return segments;
  };

  const sampleLine = (coords: [number, number][], interval: number): [number, number][] => {
    if (coords.length < 2) return coords;
    
    const result: [number, number][] = [coords[0]];
    
    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i];
      const end = coords[i + 1];
      const dist = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      
      if (dist > interval) {
        const steps = Math.floor(dist / interval);
        for (let j = 1; j < steps; j++) {
          const t = j / steps;
          result.push([
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
          ]);
        }
      }
      
      result.push(end);
    }
    
    return result;
  };

  const calculateLength = (coords: [number, number][]): number => {
    let length = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      length += Math.sqrt(
        Math.pow(coords[i + 1][0] - coords[i][0], 2) +
        Math.pow(coords[i + 1][1] - coords[i][1], 2)
      );
    }
    return length;
  };

  const initParticles = () => {
    const count = Math.min(PARTICLE_COUNT, MAX_PARTICLES);
    particlesRef.current = [];
    
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        segmentIndex: Math.floor(Math.random() * roadsRef.current.length),
        position: Math.random(),
        speed: 0.0005 + Math.random() * 0.001, // Random speed
        direction: Math.random() > 0.5 ? 1 : -1,
      });
    }
  };

  const getPositionOnSegment = (segment: RoadSegment, t: number): [number, number] => {
    const coords = segment.coordinates;
    const index = Math.floor(t * (coords.length - 1));
    const localT = (t * (coords.length - 1)) - index;
    
    if (index >= coords.length - 1) return coords[coords.length - 1];
    
    const start = coords[index];
    const end = coords[index + 1];
    
    return [
      start[0] + (end[0] - start[0]) * localT,
      start[1] + (end[1] - start[1]) * localT,
    ];
  };

  const updateParticles = () => {
    if (roadsRef.current.length === 0) return;
    
    for (const particle of particlesRef.current) {
      // Move particle
      particle.position += particle.speed * particle.direction;
      
      // Check if reached end of segment
      if (particle.position >= 1 || particle.position <= 0) {
        // Pick new random segment
        particle.segmentIndex = Math.floor(Math.random() * roadsRef.current.length);
        particle.position = Math.random();
        particle.direction = Math.random() > 0.5 ? 1 : -1;
      }
    }
  };

  const updateParticleSource = () => {
    if (!map) return;
    
    const features = particlesRef.current.map((p, i) => {
      const segment = roadsRef.current[p.segmentIndex];
      if (!segment) return null;
      
      const pos = getPositionOnSegment(segment, p.position);
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: pos,
        },
        properties: {
          id: i,
          speed: p.speed,
        },
      };
    }).filter(Boolean);

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    const source = map.getSource('traffic-particles') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson as any);
    }
  };

  const animate = () => {
    if (!enabled) return;
    
    updateParticles();
    
    frameCountRef.current++;
    if (frameCountRef.current % UPDATE_INTERVAL === 0) {
      updateParticleSource();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Initialize map layers
  useEffect(() => {
    if (!map) return;

    // Add source
    if (!map.getSource('traffic-particles')) {
      map.addSource('traffic-particles', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    // Add layer
    if (!map.getLayer('traffic-particles')) {
      map.addLayer({
        id: 'traffic-particles',
        type: 'circle',
        source: 'traffic-particles',
        paint: {
          'circle-radius': 2,
          'circle-color': '#00ff88',
          'circle-opacity': 0.8,
        },
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [map]);

  // Handle enabled/disabled
  useEffect(() => {
    if (!map) return;

    if (enabled) {
      fetchRoads();
      animate();
      
      // Set up map move listener with debounce
      let timeout: NodeJS.Timeout;
      const handleMove = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fetchRoads();
        }, 1000);
      };
      
      map.on('moveend', handleMove);
      
      return () => {
        map.off('moveend', handleMove);
        clearTimeout(timeout);
      };
    } else {
      // Stop animation and clear
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      const source = map.getSource('traffic-particles') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
      
      roadsRef.current = [];
      particlesRef.current = [];
    }
  }, [enabled, map, fetchRoads]);

  // Toggle layer visibility
  useEffect(() => {
    if (!map) return;
    
    if (map.getLayer('traffic-particles')) {
      map.setLayoutProperty(
        'traffic-particles',
        'visibility',
        enabled ? 'visible' : 'none'
      );
    }
  }, [enabled, map]);

  if (!enabled) return null;

  return (
    <div className="absolute bottom-20 left-4 z-10 bg-intel-panel/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 text-xs text-gray-400">
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 border border-intel-cyan/30 border-t-intel-cyan rounded-full animate-spin" />
          Loading road network...
        </span>
      ) : (
        <span>{particlesRef.current.length} particles active</span>
      )}
    </div>
  );
}
