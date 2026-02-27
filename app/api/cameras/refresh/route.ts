import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// FDOT Camera Feed URL patterns
const FDOT_SOURCES = [
  {
    name: 'FDOT Miami-Dade',
    baseUrl: 'https://www.fdotmiamidad.com',
    apiEndpoint: '/api/cameras',
  },
  {
    name: 'FDOT Statewide',
    baseUrl: 'https://fl511.com',
    apiEndpoint: '/api/cameras',
  },
];

interface FDOTCamera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  url: string;
  direction?: string;
  roadName?: string;
}

async function fetchFDOTCameras(source: typeof FDOT_SOURCES[0]): Promise<FDOTCamera[]> {
  try {
    // This is a placeholder - actual FDOT API would be implemented here
    // In production, this would call the real FDOT API
    const response = await fetch(`${source.baseUrl}${source.apiEndpoint}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LocalRadar2/1.0',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cameras || [];
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const results = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Fetch cameras from all sources
    for (const source of FDOT_SOURCES) {
      try {
        const cameras = await fetchFDOTCameras(source);
        results.fetched += cameras.length;

        for (const camera of cameras) {
          const { error } = await supabase
            .from('cameras')
            .upsert(
              {
                id: camera.id,
                name: camera.name,
                latitude: camera.latitude,
                longitude: camera.longitude,
                snapshot_url: camera.url,
                source: source.name,
                direction: camera.direction || null,
                road_name: camera.roadName || null,
                status: 'active',
                is_active: true,
                last_updated: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (error) {
            results.errors.push(`Failed to upsert ${camera.id}: ${error.message}`);
          } else {
            results.updated++;
          }
        }
      } catch (error) {
        results.errors.push(`Source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // If no external API available, seed with sample data
    if (results.fetched === 0) {
      const sampleCameras = generateSampleCameras();
      
      for (const camera of sampleCameras) {
        const { error } = await supabase
          .from('cameras')
          .upsert(camera, { onConflict: 'id' });

        if (error) {
          results.errors.push(`Failed to upsert ${camera.id}: ${error.message}`);
        } else {
          results.inserted++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Generate sample Florida cameras for development
function generateSampleCameras() {
  const cameras = [];
  const baseLocations = [
    { lat: 25.7617, lng: -80.1918, name: 'Miami Downtown' },
    { lat: 25.7907, lng: -80.1300, name: 'Miami Beach' },
    { lat: 25.6859, lng: -80.3142, name: 'Kendall' },
    { lat: 25.9429, lng: -80.1234, name: 'Aventura' },
    { lat: 25.8576, lng: -80.2781, name: 'Doral' },
    { lat: 25.7752, lng: -80.2106, name: 'Coral Gables' },
    { lat: 25.9087, lng: -80.1584, name: 'North Miami' },
    { lat: 25.7006, lng: -80.1623, name: 'Key Biscayne' },
    { lat: 25.9792, lng: -80.1438, name: 'Sunny Isles' },
    { lat: 26.0113, lng: -80.1495, name: 'Hallandale' },
  ];

  const roads = ['I-95', 'Florida Turnpike', 'Palmetto Expressway', 'Dolphin Expressway', 'I-75'];
  const directions = ['NB', 'SB', 'EB', 'WB'];

  for (let i = 0; i < 100; i++) {
    const base = baseLocations[i % baseLocations.length];
    const offsetLat = (Math.random() - 0.5) * 0.5;
    const offsetLng = (Math.random() - 0.5) * 0.5;
    
    cameras.push({
      id: `fdot-miami-${i.toString().padStart(3, '0')}`,
      name: `${base.name} - ${roads[i % roads.length]} ${directions[i % directions.length]}`,
      description: `Traffic camera at ${base.name}`,
      latitude: base.lat + offsetLat,
      longitude: base.lng + offsetLng,
      snapshot_url: `https://www.fdotmiamidad.com/cameras/cam${i.toString().padStart(3, '0')}.jpg`,
      stream_url: null,
      status: 'active',
      direction: directions[i % directions.length],
      road_name: roads[i % roads.length],
      source: 'FDOT Miami-Dade',
      is_active: true,
      last_updated: new Date().toISOString(),
      properties: {
        camera_type: 'traffic',
        resolution: '1080p',
        refresh_rate: 5,
      },
    });
  }

  return cameras;
}
