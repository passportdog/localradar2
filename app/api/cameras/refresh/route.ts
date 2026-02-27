import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// FDOT/FL511 camera endpoints (mock - replace with real feeds)
const FDOT_FEEDS = [
  { name: 'I-4 Corridor', url: 'https://fl511.com/api/cameras/i4' },
  { name: 'I-75 South', url: 'https://fl511.com/api/cameras/i75' },
  { name: 'I-95 East Coast', url: 'https://fl511.com/api/cameras/i95' },
  { name: 'I-10 Panhandle', url: 'https://fl511.com/api/cameras/i10' },
  { name: 'Turnpike', url: 'https://fl511.com/api/cameras/turnpike' },
];

interface FDOTCamera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  streamUrl: string;
  stillUrl: string;
  direction: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin/auth if needed
    const authHeader = request.headers.get('authorization');
    const isAdmin = authHeader === `Bearer ${process.env.ADMIN_API_KEY}`;
    
    if (!isAdmin && process.env.NODE_ENV === 'production') {
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
    
    // For demo: Insert mock Florida cameras
    const mockCameras: Omit<FDOTCamera, 'id'>[] = generateMockFloridaCameras();
    
    for (const camera of mockCameras) {
      try {
        const { error } = await supabase
          .from('traffic_cameras')
          .upsert({
            name: camera.name,
            latitude: camera.latitude,
            longitude: camera.longitude,
            stream_url: camera.streamUrl,
            still_url: camera.stillUrl,
            direction: camera.direction,
            status: 'active',
            source: 'fdot',
            last_checked: new Date().toISOString(),
          }, {
            onConflict: 'name',
          });
          
        if (error) {
          results.errors.push(`${camera.name}: ${error.message}`);
        } else {
          results.inserted++;
        }
      } catch (err) {
        results.errors.push(`${camera.name}: ${String(err)}`);
      }
    }
    
    results.fetched = mockCameras.length;
    
    return NextResponse.json({
      success: true,
      results,
      feedsProcessed: FDOT_FEEDS.length,
    });
    
  } catch (error) {
    console.error('Camera refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cameras' },
      { status: 500 }
    );
  }
}

// Generate realistic mock camera locations across Florida
function generateMockFloridaCameras(): Omit<FDOTCamera, 'id'>[] {
  const cameras: Omit<FDOTCamera, 'id'>[] = [];
  const corridors = [
    { name: 'I-4', start: [27.95, -82.45], end: [28.54, -81.38], count: 15 },
    { name: 'I-75', start: [27.5, -82.6], end: [30.4, -82.3], count: 20 },
    { name: 'I-95', start: [25.8, -80.2], end: [30.7, -81.7], count: 25 },
    { name: 'I-10', start: [30.4, -87.2], end: [30.3, -82.3], count: 12 },
    { name: 'FL Turnpike', start: [25.9, -80.3], end: [29.7, -82.1], count: 18 },
  ];
  
  const DIRECTIONS = ['NB', 'SB', 'EB', 'WB'];
  
  for (const corridor of corridors) {
    for (let i = 0; i < corridor.count; i++) {
      const progress = i / (corridor.count - 1);
      const lat = corridor.start[0] + (corridor.end[0] - corridor.start[0]) * progress + (Math.random() - 0.5) * 0.05;
      const lng = corridor.start[1] + (corridor.end[1] - corridor.start[1]) * progress + (Math.random() - 0.5) * 0.05;
      const directions = corridor.name.includes('Turnpike') ? ['NB', 'SB'] : ['EB', 'WB'];
      const direction = directions[i % directions.length];
      
      cameras.push({
        name: `${corridor.name} @ MM ${Math.floor(Math.random() * 300)} ${direction}`,
        latitude: lat,
        longitude: lng,
        streamUrl: `https://fl511.com/cameras/${corridor.name.toLowerCase().replace(/\s/g, '-')}-${i}.m3u8`,
        stillUrl: `https://fl511.com/cameras/snapshots/${corridor.name.toLowerCase().replace(/\s/g, '-')}-${i}.jpg`,
        direction,
      });
    }
  }
  
  return cameras;
}
