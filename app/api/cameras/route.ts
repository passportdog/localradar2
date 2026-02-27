import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse bounding box for geo filtering
    const swLat = parseFloat(searchParams.get('swLat') || '24.3');
    const swLng = parseFloat(searchParams.get('swLng') || '-81.2');
    const neLat = parseFloat(searchParams.get('neLat') || '25.9');
    const neLng = parseFloat(searchParams.get('neLng') || '-80.1');
    
    // Optional filters
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000);
    
    const supabase = await createClient();
    
    let query = supabase
      .from('cameras')
      .select(`
        id,
        name,
        description,
        latitude,
        longitude,
        stream_url,
        snapshot_url,
        status,
        direction,
        road_name,
        source,
        last_updated,
        properties
      `)
      .gte('latitude', swLat)
      .lte('latitude', neLat)
      .gte('longitude', swLng)
      .lte('longitude', neLng)
      .eq('is_active', true)
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: cameras, error } = await query;
    
    if (error) {
      console.error('Error fetching cameras:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cameras', details: error.message },
        { status: 500 }
      );
    }
    
    // Transform to GeoJSON format
    const geojson = {
      type: 'FeatureCollection',
      features: cameras?.map((camera) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [camera.longitude, camera.latitude],
        },
        properties: {
          id: camera.id,
          name: camera.name,
          description: camera.description,
          streamUrl: camera.stream_url,
          snapshotUrl: camera.snapshot_url,
          status: camera.status,
          direction: camera.direction,
          roadName: camera.road_name,
          source: camera.source,
          lastUpdated: camera.last_updated,
          ...camera.properties,
        },
      })) || [],
    };
    
    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
