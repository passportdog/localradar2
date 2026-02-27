import { NextRequest, NextResponse } from 'next/server';

const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const AZURE_BASE_URL = 'https://atlas.microsoft.com/traffic/camera/json';

interface AzureCamera {
  id: string;
  type: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cameraName?: string;
    imageUrl?: string;
    videoUrl?: string;
    direction?: string;
    roadName?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!AZURE_MAPS_KEY) {
      return NextResponse.json(
        { error: 'Azure Maps key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '27.9506');
    const lng = parseFloat(searchParams.get('lng') || '-82.4572');
    const radius = parseInt(searchParams.get('radius') || '10'); // km

    // Azure Maps traffic camera API
    const url = new URL(AZURE_BASE_URL);
    url.searchParams.set('subscription-key', AZURE_MAPS_KEY);
    url.searchParams.set('api-version', '1.0');
    url.searchParams.set('query', `${lat},${lng}`);
    url.searchParams.set('radius', radius.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Maps error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch from Azure Maps', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Azure format to our Camera format
    const cameras = (data.cameras || []).map((cam: AzureCamera) => ({
      id: `azure-${cam.id}`,
      camera_id: cam.id,
      name: cam.properties.cameraName || `Camera ${cam.id}`,
      intersection: cam.properties.roadName || null,
      lat: cam.geometry.coordinates[1],
      lng: cam.geometry.coordinates[0],
      stream_url: cam.properties.videoUrl || null,
      snapshot_url: cam.properties.imageUrl || null,
      state: 'FL',
      status: 'active' as const,
      last_checked: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }));

    return NextResponse.json({
      cameras,
      count: cameras.length,
      source: 'azure-maps',
      meta: { lat, lng, radius },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('Azure Maps API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cameras from Azure Maps' },
      { status: 500 }
    );
  }
}
