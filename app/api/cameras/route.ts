import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const lat = parseFloat(searchParams.get('lat') || '27.9506');
    const lng = parseFloat(searchParams.get('lng') || '-82.4572');
    const radius = parseFloat(searchParams.get('radius') || '50');
    const zip = searchParams.get('zip');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const supabase = await createClient();
    
    let query;
    
    if (zip) {
      // Query by ZIP code
      const { data, error } = await supabase.rpc('get_cameras_by_zip', {
        zip_code: zip,
        max_results: limit,
      });
      if (error) throw error;
      query = { data, error };
    } else {
      // Query by radius
      const { data, error } = await supabase.rpc('get_cameras_within_radius', {
        center_lat: lat,
        center_lng: lng,
        radius_km: radius,
        max_results: limit,
      });
      if (error) throw error;
      query = { data, error };
    }
    
    if (query.error) {
      return NextResponse.json(
        { error: query.error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      cameras: query.data || [],
      count: query.data?.length || 0,
      meta: {
        lat,
        lng,
        radius,
        zip,
      },
    });
    
  } catch (error) {
    console.error('Camera API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cameras' },
      { status: 500 }
    );
  }
}
