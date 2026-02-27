import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const AZURE_BASE_URL = 'https://atlas.microsoft.com/traffic/camera/json';

// Florida bounding box scan points
const FLORIDA_SCAN_POINTS = [
  { lat: 24.8, lng: -87.4 },
  { lat: 24.8, lng: -84.0 },
  { lat: 24.8, lng: -80.2 },
  { lat: 27.0, lng: -87.4 },
  { lat: 27.0, lng: -84.0 },
  { lat: 27.0, lng: -80.2 },
  { lat: 30.8, lng: -87.4 },
  { lat: 30.8, lng: -84.0 },
  { lat: 30.8, lng: -80.2 },
];

interface AzureCamera {
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cameraName?: string;
    imageUrl?: string;
    videoUrl?: string;
    roadName?: string;
    locationLabel?: string;
  };
}

async function fetchAzureCameras(lat: number, lng: number): Promise<AzureCamera[]> {
  const url = new URL(AZURE_BASE_URL);
  url.searchParams.set('subscription-key', AZURE_MAPS_KEY!);
  url.searchParams.set('api-version', '1.0');
  url.searchParams.set('query', `${lat},${lng}`);
  url.searchParams.set('radius', '100');

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Azure API error: ${response.status}`);
  }

  const data = await response.json();
  return data.cameras || [];
}

export async function GET(request: NextRequest) {
  // Verify cron secret or Vercel verification
  const authHeader = request.headers.get('authorization');
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` || 
                 request.headers.get('x-vercel-signature') !== undefined;

  if (!isCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!AZURE_MAPS_KEY) {
      return NextResponse.json({ error: 'Azure Maps key not configured' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cameraMap = new Map<string, AzureCamera>();

    // Scan all Florida points
    for (const point of FLORIDA_SCAN_POINTS) {
      try {
        const cameras = await fetchAzureCameras(point.lat, point.lng);
        for (const cam of cameras) {
          cameraMap.set(cam.id, cam);
        }
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Error at ${point.lat}, ${point.lng}:`, err);
      }
    }

    // Upsert cameras
    let upserted = 0;
    for (const [id, cam] of cameraMap) {
      const { error } = await supabase
        .from('traffic_cameras')
        .upsert({
          camera_id: `az-${cam.id}`,
          name: cam.properties.cameraName || `Camera ${cam.id}`,
          intersection: cam.properties.roadName || cam.properties.locationLabel || null,
          lat: cam.geometry.coordinates[1],
          lng: cam.geometry.coordinates[0],
          stream_url: cam.properties.videoUrl || null,
          snapshot_url: cam.properties.imageUrl || null,
          state: 'FL',
          status: 'active',
          last_checked: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, { onConflict: 'camera_id' });

      if (!error) upserted++;
    }

    return NextResponse.json({
      success: true,
      camerasFound: cameraMap.size,
      camerasUpserted: upserted,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
